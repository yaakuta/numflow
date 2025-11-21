/**
 * 인메모리 TODO 데이터베이스
 * 실제 프로덕션에서는 PostgreSQL, MongoDB 등을 사용하세요.
 */

class TodoDatabase {
  constructor() {
    this.todos = new Map()
    this.currentId = 1
  }

  /**
   * 모든 TODO 조회
   * @param {Object} options - 필터 옵션
   * @param {boolean} options.completed - 완료 여부 필터
   * @returns {Array} TODO 목록
   */
  findAll(options = {}) {
    let todos = Array.from(this.todos.values())

    // 완료 여부 필터링
    if (options.completed !== undefined) {
      todos = todos.filter((todo) => todo.completed === options.completed)
    }

    // 생성일 기준 내림차순 정렬
    return todos.sort((a, b) => b.createdAt - a.createdAt)
  }

  /**
   * ID로 TODO 조회
   * @param {string} id - TODO ID
   * @returns {Object|null} TODO 객체 또는 null
   */
  findById(id) {
    return this.todos.get(id) || null
  }

  /**
   * 새 TODO 생성
   * @param {Object} data - TODO 데이터
   * @param {string} data.title - TODO 제목
   * @param {string} [data.description] - TODO 설명
   * @returns {Object} 생성된 TODO
   */
  create(data) {
    const id = String(this.currentId++)
    const now = new Date()

    const todo = {
      id,
      title: data.title,
      description: data.description || '',
      completed: false,
      createdAt: now,
      updatedAt: now,
    }

    this.todos.set(id, todo)
    return todo
  }

  /**
   * TODO 업데이트
   * @param {string} id - TODO ID
   * @param {Object} data - 업데이트할 데이터
   * @returns {Object|null} 업데이트된 TODO 또는 null
   */
  update(id, data) {
    const todo = this.todos.get(id)
    if (!todo) return null

    const updated = {
      ...todo,
      ...data,
      id: todo.id, // ID는 변경 불가
      createdAt: todo.createdAt, // 생성일은 변경 불가
      updatedAt: new Date(),
    }

    this.todos.set(id, updated)
    return updated
  }

  /**
   * TODO 삭제
   * @param {string} id - TODO ID
   * @returns {boolean} 삭제 성공 여부
   */
  delete(id) {
    return this.todos.delete(id)
  }

  /**
   * TODO 완료 처리
   * @param {string} id - TODO ID
   * @returns {Object|null} 업데이트된 TODO 또는 null
   */
  complete(id) {
    return this.update(id, { completed: true })
  }

  /**
   * 모든 TODO 삭제 (테스트용)
   */
  clear() {
    this.todos.clear()
    this.currentId = 1
  }

  /**
   * TODO 개수 조회
   * @returns {number} TODO 개수
   */
  count() {
    return this.todos.size
  }
}

// 싱글톤 인스턴스
const db = new TodoDatabase()

// 초기 샘플 데이터
db.create({
  title: 'Numflow 문서 읽기',
  description: 'Feature-First 아키텍처 이해하기',
})

db.create({
  title: 'TODO API 예제 작성',
  description: 'Convention over Configuration 적용',
})

db.create({
  title: '테스트 코드 작성',
  description: 'TDD 방식으로 개발',
})

module.exports = db
