# 테스트하기

Numflow는 빠르고 안정적인 테스트를 위해 `app.inject()` 메서드를 제공합니다. 이 메서드는 실제 서버를 시작하지 않고도 HTTP 요청을 시뮬레이션할 수 있어, 테스트 속도가 매우 빠릅니다.

> **핵심 특징**:
> - ⚡ 서버 시작 없이 즉시 테스트 (99% 빠름)
> - 🚀 Fastify의 `light-my-request` 기반
> - 🔄 Feature-First와 완벽 호환
> - ✅ Promise와 Callback 스타일 모두 지원

---

## 목차

- [기본 사용법](#기본-사용법)
- [HTTP 메서드 테스트](#http-메서드-테스트)
- [Request Body 전송](#request-body-전송)
- [라우트 파라미터와 쿼리](#라우트-파라미터와-쿼리)
- [미들웨어 테스트](#미들웨어-테스트)
- [에러 처리 테스트](#에러-처리-테스트)
- [Feature-First 테스트](#feature-first-테스트)
- [Jest와 함께 사용](#jest와-함께-사용)
- [Callback 스타일](#callback-스타일)

---

## 기본 사용법

### 간단한 GET 요청 테스트

**JavaScript:**
```javascript
const numflow = require('numflow')

const app = numflow()

app.get('/', (req, res) => {
  res.json({ message: 'Hello World' })
})

// inject()로 테스트 (서버 시작 불필요!)
const response = await app.inject({
  method: 'GET',
  url: '/'
})

console.log(response.statusCode) // 200
console.log(response.payload)     // '{"message":"Hello World"}'
console.log(JSON.parse(response.payload)) // { message: 'Hello World' }
```

**TypeScript:**
```typescript
import numflow from 'numflow'

const app = numflow()

app.get('/', (req, res) => {
  res.json({ message: 'Hello World' })
})

const response = await app.inject({
  method: 'GET',
  url: '/'
})

console.log(response.statusCode) // 200
console.log(JSON.parse(response.payload)) // { message: 'Hello World' }
```

---

## HTTP 메서드 테스트

### GET, POST, PUT, DELETE

```javascript
const numflow = require('numflow')
const app = numflow()

// 라우트 등록
app.get('/users', (req, res) => {
  res.json({ users: [] })
})

app.post('/users', (req, res) => {
  res.status(201).json({ id: 1, name: req.body.name })
})

app.put('/users/:id', (req, res) => {
  res.json({ id: req.params.id, updated: true })
})

app.delete('/users/:id', (req, res) => {
  res.status(204).end()
})

// 테스트
const getResponse = await app.inject({
  method: 'GET',
  url: '/users'
})

const postResponse = await app.inject({
  method: 'POST',
  url: '/users',
  payload: { name: 'John' },
  headers: {
    'content-type': 'application/json'
  }
})

const putResponse = await app.inject({
  method: 'PUT',
  url: '/users/123'
})

const deleteResponse = await app.inject({
  method: 'DELETE',
  url: '/users/123'
})
```

---

## Request Body 전송

### JSON Body

```javascript
const response = await app.inject({
  method: 'POST',
  url: '/api/users',
  payload: { name: 'John', age: 30 },
  headers: {
    'content-type': 'application/json'
  }
})

console.log(response.statusCode) // 201
const body = JSON.parse(response.payload)
console.log(body.name) // 'John'
```

### Form Data

```javascript
const response = await app.inject({
  method: 'POST',
  url: '/api/login',
  payload: 'username=admin&password=secret',
  headers: {
    'content-type': 'application/x-www-form-urlencoded'
  }
})
```

---

## 라우트 파라미터와 쿼리

### URL 파라미터

```javascript
const app = numflow()

app.get('/users/:id', (req, res) => {
  res.json({ userId: req.params.id })
})

const response = await app.inject({
  method: 'GET',
  url: '/users/456'
})

const body = JSON.parse(response.payload)
console.log(body.userId) // '456'
```

### 쿼리 파라미터

```javascript
const app = numflow()

app.get('/search', (req, res) => {
  res.json({
    query: req.query.q,
    page: req.query.page
  })
})

const response = await app.inject({
  method: 'GET',
  url: '/search?q=test&page=1'
})

const body = JSON.parse(response.payload)
console.log(body.query) // 'test'
console.log(body.page)  // '1'
```

---

## 미들웨어 테스트

### 전역 미들웨어

```javascript
const app = numflow()
const middlewareCalls = []

// 미들웨어 등록
app.use((req, res, next) => {
  middlewareCalls.push('middleware1')
  next()
})

app.use((req, res, next) => {
  middlewareCalls.push('middleware2')
  next()
})

app.get('/', (req, res) => {
  middlewareCalls.push('handler')
  res.json({ middlewareCalls })
})

// 테스트
const response = await app.inject({
  method: 'GET',
  url: '/'
})

const body = JSON.parse(response.payload)
console.log(body.middlewareCalls)
// ['middleware1', 'middleware2', 'handler']
```

---

## 에러 처리 테스트

### 에러 핸들러 테스트

```javascript
const app = numflow()

app.get('/error', (req, res) => {
  throw new Error('Test error')
})

app.use((err, req, res, next) => {
  res.status(500).json({
    error: err.message
  })
})

const response = await app.inject({
  method: 'GET',
  url: '/error'
})

console.log(response.statusCode) // 500
const body = JSON.parse(response.payload)
console.log(body.error) // 'Test error'
```

### 404 에러

```javascript
const app = numflow()

app.get('/exists', (req, res) => {
  res.json({ ok: true })
})

const response = await app.inject({
  method: 'GET',
  url: '/not-found'
})

console.log(response.statusCode) // 404
```

---

## Feature-First 테스트

inject()는 Feature-First와 완벽하게 호환됩니다!

### 기본 Feature 테스트

```javascript
const numflow = require('numflow')
const app = numflow()

// Feature 등록
app.use(numflow.feature({
  method: 'POST',
  path: '/api/orders',
  steps: './features/orders/steps'
}))

// 테스트 - Feature 등록 완료까지 자동 대기!
const response = await app.inject({
  method: 'POST',
  url: '/api/orders',
  payload: { productId: 123, quantity: 2 },
  headers: {
    'content-type': 'application/json'
  }
})

console.log(response.statusCode) // 200
const body = JSON.parse(response.payload)
console.log(body.orderId) // 'ORD-12345'
```

### Convention 기반 Feature 테스트

```javascript
// features/api/users/post/index.js
const numflow = require('numflow')
module.exports = numflow.feature({
  // method: 'POST' ← 'post' 폴더명에서 자동 추론
  // path: '/api/users' ← 폴더 구조에서 자동 추론
})

// test/api.test.js
const app = numflow()

// 모든 Feature 자동 등록
app.registerFeatures('./features')

// 테스트 - 자동으로 Feature 등록 완료까지 대기!
const response = await app.inject({
  method: 'POST',
  url: '/api/users',
  payload: { name: 'John' },
  headers: {
    'content-type': 'application/json'
  }
})

console.log(response.statusCode) // 201
```

**주요 특징**:
- ✅ `app.inject()`는 Feature 등록 완료를 자동으로 기다립니다
- ✅ Step 함수들이 모두 실행됩니다
- ✅ Async Tasks도 정상 동작합니다
- ✅ Feature Context도 그대로 사용 가능합니다

---

## Jest와 함께 사용

### 기본 테스트 구조

```javascript
// test/api.test.js
const numflow = require('numflow')

describe('API Tests', () => {
  it('should return users list', async () => {
    const app = numflow()

    app.get('/users', (req, res) => {
      res.json({ users: [] })
    })

    const response = await app.inject({
      method: 'GET',
      url: '/users'
    })

    expect(response.statusCode).toBe(200)
    const body = JSON.parse(response.payload)
    expect(body.users).toEqual([])
  })

  it('should create user', async () => {
    const app = numflow()

    app.post('/users', (req, res) => {
      res.status(201).json({
        id: 1,
        name: req.body.name
      })
    })

    const response = await app.inject({
      method: 'POST',
      url: '/users',
      payload: { name: 'John' },
      headers: {
        'content-type': 'application/json'
      }
    })

    expect(response.statusCode).toBe(201)
    const body = JSON.parse(response.payload)
    expect(body.name).toBe('John')
  })
})
```

### beforeEach/afterEach 불필요!

**기존 방식 (app.listen() 사용):**
```javascript
// ❌ 복잡하고 느림
describe('API Tests', () => {
  let server
  let port

  beforeEach(() => {
    port = Math.floor(Math.random() * 10000) + 10000
  })

  afterEach(async () => {
    if (server) {
      await new Promise(resolve => server.close(resolve))
    }
  })

  it('should work', async () => {
    const app = numflow()
    app.get('/', (req, res) => res.end('OK'))

    server = app.listen(port)

    // HTTP 요청...
  })
})
```

**inject() 방식:**
```javascript
// ✅ 간단하고 빠름
describe('API Tests', () => {
  it('should work', async () => {
    const app = numflow()
    app.get('/', (req, res) => res.end('OK'))

    const response = await app.inject({ method: 'GET', url: '/' })
    expect(response.statusCode).toBe(200)
  })
})
```

**성능 비교**:
- **app.listen()**: ~200ms per test
- **app.inject()**: ~2ms per test (99% faster!)

---

## Callback 스타일

Promise를 사용할 수 없는 환경에서는 callback 스타일을 사용할 수 있습니다.

```javascript
app.inject(
  { method: 'GET', url: '/' },
  (err, response) => {
    if (err) {
      console.error('Error:', err)
      return
    }

    console.log(response.statusCode) // 200
    console.log(response.payload)     // 응답 본문
  }
)
```

---

## API 레퍼런스

### app.inject(options[, callback])

**Parameters:**

- **options** (object, required):
  - `method` (string, required): HTTP 메서드 ('GET', 'POST', 'PUT', 'DELETE' 등)
  - `url` (string, required): 요청 URL (쿼리 파라미터 포함 가능)
  - `payload` (object | string, optional): 요청 본문
  - `headers` (object, optional): 요청 헤더
  - `query` (object, optional): 쿼리 파라미터 (url에 포함하지 않은 경우)

- **callback** (function, optional): `(err, response) => void`
  - callback을 제공하지 않으면 Promise를 반환합니다

**Returns:**

- Promise 스타일: `Promise<Response>`
- Callback 스타일: `void`

**Response Object:**

```typescript
{
  statusCode: number     // HTTP 상태 코드
  statusMessage: string  // 상태 메시지
  headers: object        // 응답 헤더
  payload: string        // 응답 본문 (문자열)
  rawPayload: Buffer     // 응답 본문 (Buffer)
}
```

---

## 실전 예제

### 인증 API 테스트

```javascript
const numflow = require('numflow')

describe('Auth API', () => {
  it('should login successfully', async () => {
    const app = numflow()

    app.post('/auth/login', (req, res) => {
      const { username, password } = req.body

      if (username === 'admin' && password === 'secret') {
        res.json({
          token: 'jwt-token-here',
          user: { id: 1, username: 'admin' }
        })
      } else {
        res.status(401).json({ error: 'Invalid credentials' })
      }
    })

    const response = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { username: 'admin', password: 'secret' },
      headers: { 'content-type': 'application/json' }
    })

    expect(response.statusCode).toBe(200)
    const body = JSON.parse(response.payload)
    expect(body.token).toBeDefined()
    expect(body.user.username).toBe('admin')
  })

  it('should reject invalid credentials', async () => {
    const app = numflow()

    app.post('/auth/login', (req, res) => {
      const { username, password } = req.body

      if (username === 'admin' && password === 'secret') {
        res.json({ token: 'jwt-token-here' })
      } else {
        res.status(401).json({ error: 'Invalid credentials' })
      }
    })

    const response = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { username: 'wrong', password: 'wrong' },
      headers: { 'content-type': 'application/json' }
    })

    expect(response.statusCode).toBe(401)
    const body = JSON.parse(response.payload)
    expect(body.error).toBe('Invalid credentials')
  })
})
```

---

## Best Practices

### ✅ 권장사항

1. **inject()를 우선 사용하세요**
   - 테스트가 99% 빠릅니다
   - 포트 충돌 걱정이 없습니다
   - beforeEach/afterEach가 필요 없습니다

2. **각 테스트마다 새 app 생성**
   ```javascript
   it('test 1', async () => {
     const app = numflow() // 새 인스턴스
     // ...
   })

   it('test 2', async () => {
     const app = numflow() // 또 다른 새 인스턴스
     // ...
   })
   ```

3. **Feature-First도 inject()로 테스트**
   - Feature 등록 완료를 자동으로 기다립니다
   - Step 함수가 정상 실행됩니다

### ❌ 피해야 할 것

1. **실제 서버를 시작하지 마세요**
   ```javascript
   // ❌ 느리고 복잡함
   const server = app.listen(3000)
   // HTTP 요청...
   server.close()

   // ✅ 빠르고 간단함
   const response = await app.inject({ method: 'GET', url: '/' })
   ```

2. **app 인스턴스를 재사용하지 마세요**
   ```javascript
   // ❌ 테스트 간 상태 공유
   const app = numflow() // 전역

   it('test 1', async () => {
     app.get('/test', ...)
   })

   it('test 2', async () => {
     // test 1의 라우트가 남아있음!
   })
   ```

---

## 다음 단계

- **[에러 처리](./error-handling.md)** - 에러 핸들러 테스트
- **[Feature-First](./feature-first.md)** - Feature 테스트
- **[Application API](../api/application.md)** - inject() API 상세 문서

---

**마지막 업데이트**: 2025-11-14 (inject() 테스트 가이드 추가)
