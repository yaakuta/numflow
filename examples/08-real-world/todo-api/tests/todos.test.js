/**
 * TODO API 통합 테스트
 *
 * Numflow의 inject() 메서드를 사용한 테스트입니다.
 * 실제 HTTP 서버 없이도 테스트할 수 있습니다.
 */

const app = require('../app')
const db = require('../db')

describe('TODO API', () => {
  // 각 테스트 전에 DB 초기화
  beforeEach(() => {
    db.clear()
  })

  describe('GET /todos', () => {
    it('모든 TODO를 조회해야 함', async () => {
      // Given: 테스트 데이터 준비
      db.create({ title: 'TODO 1', description: 'Description 1' })
      db.create({ title: 'TODO 2', description: 'Description 2' })

      // When: GET /todos 요청
      const response = await app.inject({
        method: 'GET',
        url: '/todos',
      })

      // Then: 응답 검증
      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.success).toBe(true)
      expect(body.count).toBe(2)
      expect(body.data).toHaveLength(2)
      expect(body.data[0].title).toBe('TODO 2') // 최신 순
      expect(body.data[1].title).toBe('TODO 1')
    })

    it('completed 쿼리로 필터링해야 함', async () => {
      // Given
      db.create({ title: 'TODO 1', description: '' })
      const todo2 = db.create({ title: 'TODO 2', description: '' })
      db.complete(todo2.id)

      // When: ?completed=true
      const response1 = await app.inject({
        method: 'GET',
        url: '/todos?completed=true',
      })

      // Then
      const body1 = JSON.parse(response1.body)
      expect(body1.count).toBe(1)
      expect(body1.data[0].completed).toBe(true)

      // When: ?completed=false
      const response2 = await app.inject({
        method: 'GET',
        url: '/todos?completed=false',
      })

      // Then
      const body2 = JSON.parse(response2.body)
      expect(body2.count).toBe(1)
      expect(body2.data[0].completed).toBe(false)
    })

    it('빈 배열을 반환해야 함 (TODO가 없을 때)', async () => {
      // When
      const response = await app.inject({
        method: 'GET',
        url: '/todos',
      })

      // Then
      const body = JSON.parse(response.body)
      expect(body.success).toBe(true)
      expect(body.count).toBe(0)
      expect(body.data).toEqual([])
    })
  })

  describe('POST /todos', () => {
    it('새 TODO를 생성해야 함', async () => {
      // When
      const response = await app.inject({
        method: 'POST',
        url: '/todos',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          title: '새로운 TODO',
          description: '테스트 설명',
        }),
      })

      // Then
      expect(response.statusCode).toBe(201)
      const body = JSON.parse(response.body)
      expect(body.success).toBe(true)
      expect(body.message).toBe('TODO가 성공적으로 생성되었습니다.')
      expect(body.data.title).toBe('새로운 TODO')
      expect(body.data.description).toBe('테스트 설명')
      expect(body.data.completed).toBe(false)
      expect(body.data.id).toBeDefined()
    })

    it('title이 없으면 400 에러를 반환해야 함', async () => {
      // When
      const response = await app.inject({
        method: 'POST',
        url: '/todos',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          description: '설명만 있음',
        }),
      })

      // Then
      expect(response.statusCode).toBe(400)
      const body = JSON.parse(response.body)
      expect(body.success).toBe(false)
      expect(body.error).toContain('title')
    })

    it('빈 title은 400 에러를 반환해야 함', async () => {
      // When
      const response = await app.inject({
        method: 'POST',
        url: '/todos',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          title: '   ',
        }),
      })

      // Then
      expect(response.statusCode).toBe(400)
      const body = JSON.parse(response.body)
      expect(body.error).toContain('비어있을 수 없습니다')
    })

    it('title이 200자를 초과하면 400 에러를 반환해야 함', async () => {
      // When
      const response = await app.inject({
        method: 'POST',
        url: '/todos',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          title: 'a'.repeat(201),
        }),
      })

      // Then
      expect(response.statusCode).toBe(400)
      const body = JSON.parse(response.body)
      expect(body.error).toContain('200자')
    })
  })

  describe('GET /todos/:id', () => {
    it('특정 TODO를 조회해야 함', async () => {
      // Given
      const todo = db.create({ title: '테스트 TODO', description: '설명' })

      // When
      const response = await app.inject({
        method: 'GET',
        url: `/todos/${todo.id}`,
      })

      // Then
      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.success).toBe(true)
      expect(body.data.id).toBe(todo.id)
      expect(body.data.title).toBe('테스트 TODO')
    })

    it('존재하지 않는 ID는 404를 반환해야 함', async () => {
      // When
      const response = await app.inject({
        method: 'GET',
        url: '/todos/999',
      })

      // Then
      expect(response.statusCode).toBe(404)
      const body = JSON.parse(response.body)
      expect(body.success).toBe(false)
      expect(body.error).toContain('찾을 수 없습니다')
    })
  })

  describe('PUT /todos/:id', () => {
    it('TODO를 업데이트해야 함', async () => {
      // Given
      const todo = db.create({ title: '원본 제목', description: '원본 설명' })

      // When
      const response = await app.inject({
        method: 'PUT',
        url: `/todos/${todo.id}`,
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          title: '수정된 제목',
          description: '수정된 설명',
          completed: true,
        }),
      })

      // Then
      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.success).toBe(true)
      expect(body.data.title).toBe('수정된 제목')
      expect(body.data.description).toBe('수정된 설명')
      expect(body.data.completed).toBe(true)
    })

    it('일부 필드만 업데이트할 수 있어야 함', async () => {
      // Given
      const todo = db.create({ title: '원본 제목', description: '원본 설명' })

      // When: title만 업데이트
      const response = await app.inject({
        method: 'PUT',
        url: `/todos/${todo.id}`,
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          title: '새 제목',
        }),
      })

      // Then
      const body = JSON.parse(response.body)
      expect(body.data.title).toBe('새 제목')
      expect(body.data.description).toBe('원본 설명') // 유지됨
    })

    it('존재하지 않는 ID는 404를 반환해야 함', async () => {
      // When
      const response = await app.inject({
        method: 'PUT',
        url: '/todos/999',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          title: '수정',
        }),
      })

      // Then
      expect(response.statusCode).toBe(404)
    })

    it('업데이트할 데이터가 없으면 400을 반환해야 함', async () => {
      // Given
      const todo = db.create({ title: '제목', description: '' })

      // When
      const response = await app.inject({
        method: 'PUT',
        url: `/todos/${todo.id}`,
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({}),
      })

      // Then
      expect(response.statusCode).toBe(400)
      const body = JSON.parse(response.body)
      expect(body.error).toContain('업데이트할 데이터가 없습니다')
    })
  })

  describe('DELETE /todos/:id', () => {
    it('TODO를 삭제해야 함', async () => {
      // Given
      const todo = db.create({ title: '삭제할 TODO', description: '' })

      // When
      const response = await app.inject({
        method: 'DELETE',
        url: `/todos/${todo.id}`,
      })

      // Then
      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.success).toBe(true)
      expect(body.message).toContain('삭제되었습니다')

      // Verify: DB에서 실제로 삭제되었는지 확인
      expect(db.findById(todo.id)).toBeNull()
    })

    it('존재하지 않는 ID는 404를 반환해야 함', async () => {
      // When
      const response = await app.inject({
        method: 'DELETE',
        url: '/todos/999',
      })

      // Then
      expect(response.statusCode).toBe(404)
    })
  })

  describe('PATCH /todos/:id/complete', () => {
    it('TODO를 완료 처리해야 함', async () => {
      // Given
      const todo = db.create({ title: '완료할 TODO', description: '' })
      expect(todo.completed).toBe(false)

      // When
      const response = await app.inject({
        method: 'PATCH',
        url: `/todos/${todo.id}/complete`,
      })

      // Then
      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.success).toBe(true)
      expect(body.data.completed).toBe(true)

      // Verify: DB에서 실제로 완료 처리되었는지 확인
      const updated = db.findById(todo.id)
      expect(updated.completed).toBe(true)
    })

    it('이미 완료된 TODO는 400을 반환해야 함', async () => {
      // Given
      const todo = db.create({ title: 'TODO', description: '' })
      db.complete(todo.id)

      // When
      const response = await app.inject({
        method: 'PATCH',
        url: `/todos/${todo.id}/complete`,
      })

      // Then
      expect(response.statusCode).toBe(400)
      const body = JSON.parse(response.body)
      expect(body.error).toContain('이미 완료')
    })

    it('존재하지 않는 ID는 404를 반환해야 함', async () => {
      // When
      const response = await app.inject({
        method: 'PATCH',
        url: '/todos/999/complete',
      })

      // Then
      expect(response.statusCode).toBe(404)
    })
  })

  describe('GET /', () => {
    it('API 정보를 반환해야 함', async () => {
      // When
      const response = await app.inject({
        method: 'GET',
        url: '/',
      })

      // Then
      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.message).toContain('환영합니다')
      expect(body.endpoints).toBeDefined()
    })
  })

  describe('404 Handler', () => {
    it('존재하지 않는 경로는 404를 반환해야 함', async () => {
      // When
      const response = await app.inject({
        method: 'GET',
        url: '/non-existent-path',
      })

      // Then
      expect(response.statusCode).toBe(404)
      const body = JSON.parse(response.body)
      expect(body.success).toBe(false)
      expect(body.error).toContain('찾을 수 없습니다')
    })
  })
})
