# Router API

Router는 모듈화된 라우팅을 위한 강력한 도구입니다. Express의 Router와 100% 호환되며, 애플리케이션을 기능별로 분리하여 관리할 수 있습니다.

## 목차

- [numflow.Router([options])](#numflowrouteroptions)
- [router.use()](#routeruse)
  - [전역 미들웨어](#전역-미들웨어)
  - [경로별 미들웨어](#경로별-미들웨어)
  - [중첩 라우터](#중첩-라우터)
- [router.METHOD()](#routermethod)
- [router.route()](#routerroute)
- [Router 마운트](#router-마운트)
- [실전 예제](#실전-예제)

---

## numflow.Router([options])

새로운 Router 인스턴스를 생성합니다.

### 파라미터

- `options` (선택) - Router 옵션
  - `caseSensitive` (boolean) - 대소문자 구분 (기본값: false)
  - `ignoreTrailingSlash` (boolean) - 후행 슬래시 무시 (기본값: true)

### 반환값

새로운 `Router` 인스턴스

### 예제

```javascript
// JavaScript (CommonJS)
const numflow = require('numflow')
const router = numflow.Router()

router.get('/users', (req, res) => {
  res.json({ users: [] })
})

module.exports = router
```

```javascript
// JavaScript (ESM)
import numflow from 'numflow'
const router = numflow.Router()

router.get('/users', (req, res) => {
  res.json({ users: [] })
})

export default router
```

```typescript
// TypeScript
import numflow from 'numflow'
const router = numflow.Router()

router.get('/users', (req, res) => {
  res.json({ users: [] })
})

export default router
```

---

## router.use()

Router 레벨 미들웨어를 등록하거나 중첩 라우터를 마운트합니다.

### 전역 미들웨어

Router의 모든 라우트에 적용되는 미들웨어를 등록합니다.

```javascript
// JavaScript
const router = numflow.Router()

// 모든 라우트에 적용
router.use((req, res, next) => {
  console.log('Time:', Date.now())
  next()
})

// 여러 미들웨어를 한 번에 등록
router.use(logger, authenticate, authorize)
```

### 경로별 미들웨어

특정 경로에만 적용되는 미들웨어를 등록합니다.

```javascript
// JavaScript
const router = numflow.Router()

// /admin으로 시작하는 경로에만 적용
router.use('/admin', requireAdmin)

// 여러 미들웨어 등록
router.use('/admin', authenticate, authorize, audit)
```

### 중첩 라우터

다른 Router를 중첩하여 계층 구조를 만듭니다.

```javascript
// JavaScript
const numflow = require('numflow')

// 메인 라우터
const apiRouter = numflow.Router()

// 중첩 라우터
const usersRouter = numflow.Router()
usersRouter.get('/', (req, res) => {
  res.json({ users: [] })
})

const postsRouter = numflow.Router()
postsRouter.get('/', (req, res) => {
  res.json({ posts: [] })
})

// 중첩 라우터 마운트
apiRouter.use('/users', usersRouter)
apiRouter.use('/posts', postsRouter)

// 결과 URL:
// /users → usersRouter
// /posts → postsRouter
```

---

## router.METHOD()

HTTP 메서드에 대한 라우트를 등록합니다.

### 지원되는 메서드

- `router.get(path, ...handlers)` - GET 요청
- `router.post(path, ...handlers)` - POST 요청
- `router.put(path, ...handlers)` - PUT 요청
- `router.delete(path, ...handlers)` - DELETE 요청
- `router.patch(path, ...handlers)` - PATCH 요청
- `router.options(path, ...handlers)` - OPTIONS 요청
- `router.head(path, ...handlers)` - HEAD 요청
- `router.all(path, ...handlers)` - 모든 HTTP 메서드

### 예제

```javascript
// JavaScript
const router = numflow.Router()

// GET 라우트
router.get('/users', (req, res) => {
  res.json({ users: [] })
})

// POST 라우트
router.post('/users', (req, res) => {
  const user = req.body
  res.status(201).json({ user })
})

// 동적 파라미터
router.get('/users/:id', (req, res) => {
  const userId = req.params.id
  res.json({ userId })
})

// 미들웨어 체이닝
router.post('/users', authenticate, validate, (req, res) => {
  res.status(201).json({ user: req.body })
})

// 모든 메서드 처리
router.all('/test', (req, res) => {
  res.json({ method: req.method })
})
```

### 중복 라우트 체크

Numflow는 같은 경로와 메서드를 중복으로 등록하면 서버 시작 시 에러를 발생시킵니다.

```javascript
// JavaScript
const router = numflow.Router()

// 첫 번째 등록 - 정상
router.get('/users', (req, res) => {
  res.json({ users: [] })
})

// 두 번째 등록 - 에러 발생!
router.get('/users', (req, res) => {
  res.json({ users: [] })
})
// → Error: Duplicate route registration: GET /users
```

**허용되는 경우:**

```javascript
// ✅ 같은 경로, 다른 메서드 - 허용
router.get('/users', handler)
router.post('/users', handler)

// ✅ 다른 경로, 같은 메서드 - 허용
router.get('/users', handler)
router.get('/posts', handler)
```

**router.all()과의 상호작용:**

```javascript
// router.all()은 모든 메서드에 대해 등록
router.all('/users', handler)

// 따라서 이후 같은 경로에 특정 메서드 등록 시 에러
router.get('/users', handler)
// → Error: Duplicate route registration: GET /users
```

---

## router.route()

동일한 경로에 대해 여러 HTTP 메서드를 체이닝하여 등록합니다.

### 예제

```javascript
// JavaScript
const router = numflow.Router()

router.route('/users/:id')
  .get((req, res) => {
    // GET /users/:id
    res.json({ user: { id: req.params.id } })
  })
  .put((req, res) => {
    // PUT /users/:id
    res.json({ updated: true })
  })
  .delete((req, res) => {
    // DELETE /users/:id
    res.json({ deleted: true })
  })
```

```typescript
// TypeScript
import numflow from 'numflow'
const router = numflow.Router()

router.route('/users/:id')
  .get((req, res) => {
    res.json({ user: { id: req.params.id } })
  })
  .put((req, res) => {
    res.json({ updated: true })
  })
  .delete((req, res) => {
    res.json({ deleted: true })
  })
```

---

## Router 마운트

Router를 Application에 마운트하여 모듈화된 라우팅을 구현합니다.

### 기본 마운트

```javascript
// JavaScript
const numflow = require('numflow')
const app = numflow()
const apiRouter = numflow.Router()

apiRouter.get('/users', (req, res) => {
  res.json({ users: [] })
})

// Router를 /api에 마운트
app.use('/api', apiRouter)

// 결과 URL: /api/users
```

### 다중 Router 마운트

```javascript
// JavaScript
const app = numflow()

const usersRouter = numflow.Router()
const postsRouter = numflow.Router()
const productsRouter = numflow.Router()

usersRouter.get('/', (req, res) => res.json({ users: [] }))
postsRouter.get('/', (req, res) => res.json({ posts: [] }))
productsRouter.get('/', (req, res) => res.json({ products: [] }))

app.use('/users', usersRouter)
app.use('/posts', postsRouter)
app.use('/products', productsRouter)

// 결과 URL:
// /users → usersRouter
// /posts → postsRouter
// /products → productsRouter
```

### 중첩 Router 마운트

```javascript
// JavaScript
const app = numflow()

// 1단계: Users Router
const usersRouter = numflow.Router()

// 2단계: Posts Router (Users의 하위)
const postsRouter = numflow.Router()
postsRouter.get('/', (req, res) => {
  const userId = req.params.userId
  res.json({ userId, posts: [] })
})

// 3단계: Comments Router (Posts의 하위)
const commentsRouter = numflow.Router()
commentsRouter.get('/', (req, res) => {
  const userId = req.params.userId
  const postId = req.params.postId
  res.json({ userId, postId, comments: [] })
})

// 중첩 마운트
postsRouter.use('/:postId/comments', commentsRouter)
usersRouter.use('/:userId/posts', postsRouter)
app.use('/users', usersRouter)

// 결과 URL:
// /users/:userId/posts → postsRouter
// /users/:userId/posts/:postId/comments → commentsRouter
```

---

## 실전 예제

### 모듈화된 API 구조

```javascript
// routes/users.js
const numflow = require('numflow')
const router = numflow.Router()

// 미들웨어
router.use(authenticate)

// 라우트
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

const usersRouter = require('./routes/users')
const postsRouter = require('./routes/posts')

app.use('/api/users', usersRouter)
app.use('/api/posts', postsRouter)

app.listen(3000)
```

### RESTful API with Router

```javascript
// JavaScript
const numflow = require('numflow')
const app = numflow()

// API Router
const apiRouter = numflow.Router()

// Users Router
const usersRouter = numflow.Router()
usersRouter.get('/', (req, res) => {
  res.json({ users: [
    { id: 1, name: 'Alice' },
    { id: 2, name: 'Bob' }
  ]})
})
usersRouter.post('/', (req, res) => {
  res.status(201).json({ user: req.body })
})
usersRouter.get('/:id', (req, res) => {
  res.json({ user: { id: req.params.id } })
})
usersRouter.put('/:id', (req, res) => {
  res.json({ updated: true })
})
usersRouter.delete('/:id', (req, res) => {
  res.json({ deleted: true })
})

// Posts Router
const postsRouter = numflow.Router()
postsRouter.get('/', (req, res) => {
  res.json({ posts: [] })
})
postsRouter.post('/', (req, res) => {
  res.status(201).json({ post: req.body })
})

// API Router에 마운트
apiRouter.use('/users', usersRouter)
apiRouter.use('/posts', postsRouter)

// App에 마운트
app.use('/api', apiRouter)

app.listen(3000)

// 결과 URL:
// GET    /api/users
// POST   /api/users
// GET    /api/users/:id
// PUT    /api/users/:id
// DELETE /api/users/:id
// GET    /api/posts
// POST   /api/posts
```

---

## Express 호환성

Numflow의 Router는 Express의 Router와 100% 호환됩니다.

```javascript
// Express 코드
const express = require('express')
const router = express.Router()

// Numflow 코드 (동일!)
const numflow = require('numflow')
const router = numflow.Router()
```

모든 Express Router 코드가 Numflow에서 그대로 동작합니다!

---

## 다음 단계

- **[Application API](./application.md)** - app.use()로 Router 마운트
- **[Middleware](./middleware.md)** - 미들웨어 패턴
- **[Examples](../../examples/02-routing/)** - Router 예제 코드

---

**마지막 업데이트**: 2025-10-16 (중복 라우트 체크 기능 추가)
**이전**: [목차](../API.md)
