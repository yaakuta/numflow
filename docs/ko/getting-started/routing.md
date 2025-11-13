# 라우팅 (Routing)

Numflow는 고성능 **Radix Tree** 기반 라우팅을 제공합니다 (find-my-way v8.2.2).

## 기본 라우트 등록

가장 간단한 GET 라우트 예제:

```javascript
const numflow = require('numflow')
const app = numflow()

// GET 요청 처리
app.get('/', (req, res) => {
  res.statusCode = 200
  res.setHeader('Content-Type', 'text/plain')
  res.end('Hello Numflow!')
})

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000')
})
```

브라우저에서 `http://localhost:3000`을 열면 "Hello Numflow!" 메시지를 볼 수 있습니다.

## HTTP 메서드

Numflow는 모든 주요 HTTP 메서드를 지원합니다:

```javascript
// GET - 데이터 조회
app.get('/users', (req, res) => {
  res.statusCode = 200
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify({ users: ['Alice', 'Bob'] }))
})

// POST - 데이터 생성
app.post('/users', (req, res) => {
  res.statusCode = 201
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify({ success: true, message: 'User created' }))
})

// PUT - 데이터 전체 수정
app.put('/users/:id', (req, res) => {
  const userId = req.params.id
  res.statusCode = 200
  res.end(`User ${userId} updated`)
})

// PATCH - 데이터 부분 수정
app.patch('/users/:id', (req, res) => {
  const userId = req.params.id
  res.statusCode = 200
  res.end(`User ${userId} patched`)
})

// DELETE - 데이터 삭제
app.delete('/users/:id', (req, res) => {
  const userId = req.params.id
  res.statusCode = 200
  res.end(`User ${userId} deleted`)
})

// OPTIONS - CORS preflight
app.options('/users', (req, res) => {
  res.statusCode = 204
  res.setHeader('Allow', 'GET, POST, OPTIONS')
  res.end()
})

// HEAD - 헤더만 요청
app.head('/users', (req, res) => {
  res.statusCode = 200
  res.setHeader('Content-Type', 'application/json')
  res.end()
})
```

## 경로 파라미터 (Path Parameters)

URL에서 동적 값을 추출할 수 있습니다:

### 단일 파라미터

```javascript
// /users/123 → req.params.id === '123'
app.get('/users/:id', (req, res) => {
  const userId = req.params.id
  res.statusCode = 200
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify({
    user: { id: userId, name: `User ${userId}` }
  }))
})
```

### 다중 파라미터

```javascript
// /users/1/posts/456 → req.params.userId === '1', req.params.postId === '456'
app.get('/users/:userId/posts/:postId', (req, res) => {
  const { userId, postId } = req.params
  res.statusCode = 200
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify({
    post: {
      id: postId,
      userId,
      title: `Post ${postId} by User ${userId}`
    }
  }))
})
```

## 쿼리 파라미터 (Query Parameters)

URL의 쿼리 문자열을 자동으로 파싱합니다:

```javascript
// /search?q=numflow&page=2&limit=10
app.get('/search', (req, res) => {
  const { q, page = '1', limit = '10' } = req.query

  res.statusCode = 200
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify({
    query: q,
    page: parseInt(page),
    limit: parseInt(limit),
    results: [
      { id: 1, title: `Result for "${q}"` }
    ]
  }))
})
```

## 모든 메서드 처리 (app.all)

하나의 핸들러로 모든 HTTP 메서드를 처리할 수 있습니다:

```javascript
// GET, POST, PUT, DELETE 등 모든 메서드를 처리
app.all('/ping', (req, res) => {
  res.statusCode = 200
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify({
    message: 'pong',
    method: req.method
  }))
})
```

## 중복 라우트 체크 ⭐

Numflow는 개발자의 실수를 방지하기 위해 같은 경로와 메서드를 중복으로 등록하면 서버 시작 시 에러를 발생시킵니다.

```javascript
const numflow = require('numflow')
const app = numflow()

// 첫 번째 등록 - 정상
app.get('/users', (req, res) => {
  res.end('Users list')
})

// 두 번째 등록 - 서버 시작 시 에러 발생!
app.get('/users', (req, res) => {
  res.end('Another handler')
})
// → Error: Duplicate route registration: GET /users
```

### 허용되는 경우

```javascript
// ✅ 같은 경로, 다른 메서드 - 허용
app.get('/users', (req, res) => {
  res.end('Get users')
})
app.post('/users', (req, res) => {
  res.end('Create user')
})

// ✅ 다른 경로, 같은 메서드 - 허용
app.get('/users', (req, res) => {
  res.end('Users')
})
app.get('/posts', (req, res) => {
  res.end('Posts')
})
```

### app.all()과의 상호작용

`app.all()`은 모든 HTTP 메서드에 대해 라우트를 등록하므로, 이후 같은 경로에 특정 메서드를 등록하면 에러가 발생합니다:

```javascript
// app.all()로 모든 메서드 등록
app.all('/ping', (req, res) => {
  res.end('pong')
})

// 이후 같은 경로에 GET 등록 시 에러!
app.get('/ping', (req, res) => {
  res.end('ping')
})
// → Error: Duplicate route registration: GET /ping
```

### 왜 중복 체크가 중요한가요?

1. **조기 에러 감지**: 서버 시작 시 즉시 발견 (런타임 에러 방지)
2. **명확한 에러 메시지**: 어떤 라우트가 중복되었는지 정확히 알 수 있음
3. **안전한 배포**: 프로덕션 배포 전에 문제를 발견
4. **코드 품질**: 실수로 인한 라우트 오버라이드 방지

## 라우트 체이닝 (Route Chaining)

같은 경로에 여러 메서드를 등록할 때 체이닝을 사용하면 코드가 깔끔해집니다:

```javascript
// 체이닝 없이
app.get('/products', (req, res) => {
  res.end('Product list')
})
app.post('/products', (req, res) => {
  res.end('Product created')
})

// 체이닝 사용 (권장)
app.route('/products')
  .get((req, res) => {
    res.statusCode = 200
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({
      products: [
        { id: 1, name: 'Product A', price: 100 },
        { id: 2, name: 'Product B', price: 200 }
      ]
    }))
  })
  .post((req, res) => {
    res.statusCode = 201
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({
      success: true,
      message: 'Product created'
    }))
  })
  .put((req, res) => {
    res.statusCode = 200
    res.end('Product updated')
  })
  .delete((req, res) => {
    res.statusCode = 200
    res.end('Product deleted')
  })
```

## 404 Not Found 처리

등록되지 않은 경로는 자동으로 404 응답을 반환합니다:

```javascript
const numflow = require('numflow')
const app = numflow()

app.get('/', (req, res) => {
  res.end('Home page')
})

// 등록되지 않은 경로 (예: /unknown)는 자동으로 404 반환
// "404 Not Found: GET /unknown"

app.listen(3000)
```

## 완전한 REST API 예제

```javascript
const numflow = require('numflow')
const app = numflow()

// 홈페이지
app.get('/', (req, res) => {
  res.statusCode = 200
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify({
    message: 'Welcome to Numflow REST API',
    version: '1.0.0'
  }))
})

// 사용자 목록 조회
app.get('/api/users', (req, res) => {
  res.statusCode = 200
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify({
    users: [
      { id: 1, name: 'Alice', email: 'alice@example.com' },
      { id: 2, name: 'Bob', email: 'bob@example.com' }
    ]
  }))
})

// 특정 사용자 조회
app.get('/api/users/:id', (req, res) => {
  const userId = req.params.id
  res.statusCode = 200
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify({
    user: { id: userId, name: `User ${userId}` }
  }))
})

// 사용자 생성
app.post('/api/users', (req, res) => {
  res.statusCode = 201
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify({
    success: true,
    message: 'User created',
    user: { id: 3, name: 'New User' }
  }))
})

// 사용자 수정
app.put('/api/users/:id', (req, res) => {
  const userId = req.params.id
  res.statusCode = 200
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify({
    success: true,
    message: `User ${userId} updated`
  }))
})

// 사용자 삭제
app.delete('/api/users/:id', (req, res) => {
  const userId = req.params.id
  res.statusCode = 200
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify({
    success: true,
    message: `User ${userId} deleted`
  }))
})

// 검색 (쿼리 파라미터 사용)
app.get('/api/search', (req, res) => {
  const { q, page = '1' } = req.query
  res.statusCode = 200
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify({
    query: q,
    page: parseInt(page),
    results: [
      { id: 1, title: `Result for "${q}"` }
    ]
  }))
})

app.listen(3000, () => {
  console.log('REST API running on http://localhost:3000')
  console.log('\nAvailable endpoints:')
  console.log('  GET    /')
  console.log('  GET    /api/users')
  console.log('  GET    /api/users/:id')
  console.log('  POST   /api/users')
  console.log('  PUT    /api/users/:id')
  console.log('  DELETE /api/users/:id')
  console.log('  GET    /api/search?q=keyword&page=1')
})
```

## 테스트하기

curl을 사용하여 API를 테스트할 수 있습니다:

```bash
# 사용자 목록 조회
curl http://localhost:3000/api/users

# 특정 사용자 조회
curl http://localhost:3000/api/users/123

# 사용자 생성
curl -X POST http://localhost:3000/api/users

# 사용자 삭제
curl -X DELETE http://localhost:3000/api/users/123

# 검색 (쿼리 파라미터)
curl "http://localhost:3000/api/search?q=numflow&page=2"
```

## 고급 경로 패턴

Numflow는 find-my-way 라이브러리를 사용하여 고급 경로 패턴을 지원합니다:

### 와일드카드

```javascript
// /files 하위의 모든 경로 매칭
app.get('/files/*', (req, res) => {
  res.end(`File path: ${req.url}`)
})
```

### 정규식 패턴

```javascript
// 숫자만 허용하는 경로
// /users/123 (O), /users/abc (X)
app.get('/users/:id(^\\d+$)', (req, res) => {
  res.end(`User ID: ${req.params.id}`)
})
```

## 모듈화된 라우팅 (Router) ⭐

대규모 애플리케이션에서는 라우트를 모듈별로 분리하여 관리하는 것이 좋습니다. Numflow는 Express와 100% 호환되는 Router를 제공합니다.

### Router 생성

```javascript
// JavaScript
const numflow = require('numflow')
const router = numflow.Router()

// 라우트 등록
router.get('/users', (req, res) => {
  res.statusCode = 200
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify({ users: [] }))
})

router.post('/users', (req, res) => {
  res.statusCode = 201
  res.end('User created')
})

module.exports = router
```

### Router 마운트

Router를 Application에 마운트하여 사용합니다:

```javascript
// app.js
const numflow = require('numflow')
const app = numflow()

const usersRouter = require('./routes/users')
const postsRouter = require('./routes/posts')

// Router를 특정 경로에 마운트
app.use('/api/users', usersRouter)
app.use('/api/posts', postsRouter)

app.listen(3000)

// 결과 URL:
// /api/users → usersRouter의 라우트들
// /api/posts → postsRouter의 라우트들
```

### Router 레벨 미들웨어

Router에 공통 미들웨어를 적용할 수 있습니다:

```javascript
const router = numflow.Router()

// Router의 모든 라우트에 적용
router.use((req, res, next) => {
  console.log('Time:', Date.now())
  next()
})

// 인증 미들웨어
router.use(authenticate)

router.get('/users', (req, res) => {
  // authenticate 미들웨어가 자동 실행됨
  res.end('Authenticated users')
})
```

### 중첩 Router

Router 안에 다른 Router를 마운트하여 계층 구조를 만들 수 있습니다:

```javascript
const numflow = require('numflow')
const app = numflow()

// 1단계: API Router
const apiRouter = numflow.Router()

// 2단계: Users Router
const usersRouter = numflow.Router()
usersRouter.get('/', (req, res) => {
  res.end('Users list')
})

// 3단계: Posts Router (Users 하위)
const postsRouter = numflow.Router()
postsRouter.get('/', (req, res) => {
  const userId = req.params.userId
  res.end(`Posts by user ${userId}`)
})

// 중첩 마운트
usersRouter.use('/:userId/posts', postsRouter)
apiRouter.use('/users', usersRouter)
app.use('/api', apiRouter)

// 결과 URL:
// /api/users → usersRouter
// /api/users/:userId/posts → postsRouter
```

### 실전 예제: 모듈화된 API

```javascript
// routes/users.js
const numflow = require('numflow')
const router = numflow.Router()

// 미들웨어
router.use(authenticate)

// CRUD 라우트
router.get('/', getAllUsers)
router.get('/:id', getUser)
router.post('/', createUser)
router.put('/:id', updateUser)
router.delete('/:id', deleteUser)

module.exports = router

// routes/posts.js
const numflow = require('numflow')
const router = numflow.Router()

router.use(authenticate)

router.get('/', getAllPosts)
router.get('/:id', getPost)
router.post('/', createPost)

module.exports = router

// app.js
const numflow = require('numflow')
const app = numflow()

// Router 마운트
app.use('/api/users', require('./routes/users'))
app.use('/api/posts', require('./routes/posts'))

app.listen(3000, () => {
  console.log('Modular API running on port 3000')
})
```

### Router의 장점

1. **모듈화**: 기능별로 라우트를 분리하여 관리
2. **재사용**: 동일한 Router를 여러 경로에 마운트 가능
3. **중첩**: Router 안에 Router를 마운트하여 계층 구조 구현
4. **미들웨어**: Router 레벨 미들웨어로 공통 로직 적용
5. **테스트**: 모듈별로 독립적인 테스트 작성 가능

### Express 호환성

Numflow의 Router는 Express와 완전히 동일하게 동작합니다:

```javascript
// Express 코드
const express = require('express')
const router = express.Router()

// Numflow 코드 (동일!)
const numflow = require('numflow')
const router = numflow.Router()
```

기존 Express 프로젝트의 Router 코드를 수정 없이 사용할 수 있습니다!

## 다음 단계

라우팅과 Router의 기본을 익혔습니다! 더 자세한 내용과 예제는:

- **[Router API 문서](../api/router.md)** - Router의 모든 기능
- **[Examples](../../examples/02-routing/)** - 실전 예제 코드
- **[Middleware](./middleware.md)** - 미들웨어 시스템

---

**마지막 업데이트**: 2025-10-16 (중복 라우트 체크 기능 추가)
**이전**: [목차](./README.md)
