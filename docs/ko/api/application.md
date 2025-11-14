# Application

### numflow()

Numflow 애플리케이션 인스턴스를 생성합니다.

**JavaScript (CommonJS):**
```javascript
const numflow = require('numflow')
const app = numflow()
```

**JavaScript (ESM):**
```javascript
import numflow from 'numflow'
const app = numflow()
```

**TypeScript:**
```typescript
import numflow from 'numflow'
const app = numflow()
```


### app.listen(port, [hostname], [backlog], [callback])

HTTP 서버를 시작합니다. `app.registerFeature()` 또는 `app.registerFeatures()`를 사용한 경우, 모든 Feature 등록이 완료될 때까지 자동으로 대기한 후 서버를 시작합니다.

```javascript
app.listen(3000, () => {
  console.log('Server running on port 3000')
})

// 호스트명 지정
app.listen(3000, 'localhost')

// Feature 등록과 함께 사용
app.registerFeatures('./features')
app.listen(3000, () => {
  console.log('Server running on port 3000')
})
```

**반환값**: `http.Server`


**참고**: [Feature 등록 방법](./feature.md#feature-등록-방법)을 참조하세요.

### app.inject(options[, callback])

서버를 시작하지 않고 HTTP 요청을 시뮬레이션합니다. 테스트에 매우 유용하며, Fastify의 `light-my-request` 기반으로 동작합니다.

**특징**:
- ⚡ 서버 시작 없이 즉시 테스트 (99% 빠름)
- 🔄 Feature-First와 완벽 호환 (Feature 등록 완료까지 자동 대기)
- ✅ Promise와 Callback 스타일 모두 지원

**JavaScript (Promise):**
```javascript
const numflow = require('numflow')
const app = numflow()

app.get('/users', (req, res) => {
  res.json({ users: [] })
})

// inject()로 테스트
const response = await app.inject({
  method: 'GET',
  url: '/users'
})

console.log(response.statusCode) // 200
console.log(JSON.parse(response.payload)) // { users: [] }
```

**JavaScript (Callback):**
```javascript
app.inject(
  { method: 'GET', url: '/users' },
  (err, response) => {
    if (err) throw err
    console.log(response.statusCode) // 200
  }
)
```

**POST 요청 예제:**
```javascript
const response = await app.inject({
  method: 'POST',
  url: '/users',
  payload: { name: 'John', age: 30 },
  headers: {
    'content-type': 'application/json'
  }
})

console.log(response.statusCode) // 201
const body = JSON.parse(response.payload)
console.log(body.name) // 'John'
```

**Feature-First 테스트:**
```javascript
// Feature 등록
app.use(numflow.feature({
  method: 'POST',
  path: '/api/orders',
  steps: './steps'
}))

// inject()가 Feature 등록 완료까지 자동으로 대기!
const response = await app.inject({
  method: 'POST',
  url: '/api/orders',
  payload: { productId: 123 },
  headers: { 'content-type': 'application/json' }
})
```

**Parameters:**

- **options** (object, required):
  - `method` (string, required): HTTP 메서드 ('GET', 'POST', 'PUT', 'DELETE' 등)
  - `url` (string, required): 요청 URL (쿼리 파라미터 포함 가능)
  - `payload` (object | string, optional): 요청 본문
  - `headers` (object, optional): 요청 헤더
  - `query` (object, optional): 쿼리 파라미터

- **callback** (function, optional): `(err, response) => void`
  - callback을 제공하지 않으면 Promise를 반환합니다

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

**반환값**:
- Promise 스타일: `Promise<Response>`
- Callback 스타일: `void`

**참고**: 자세한 테스트 가이드는 [테스트하기](../getting-started/testing.md)를 참조하세요.

### app.use([path], ...middleware)

미들웨어를 등록합니다.


```typescript
// 전역 미들웨어
app.use(logger)
app.use(express.json())

// 경로별 미들웨어
app.use('/api', auth)
app.use('/admin', requireAdmin)

// 다중 미들웨어
app.use(cors, helmet, compression)

// 라우터 마운트
const apiRouter = numflow.Router()
app.use('/api', apiRouter)

// Feature와 함께 사용
const createOrderFeature = numflow.feature({
  method: 'POST',
  path: '/api/orders',
  middlewares: [auth, validate],  // Feature 전용 미들웨어
  steps: './steps',
})
```

**반환값**: `Application` (체이닝 가능)

### app.get(path, handler)

GET 라우트를 등록합니다. 또는 설정 값을 조회합니다.

**라우트 등록:**
```typescript
app.get('/', (req, res) => {
  res.statusCode = 200
  res.end('Hello World')
})

// 경로 파라미터
app.get('/users/:id', (req, res) => {
  const userId = req.params.id
  res.end(`User ${userId}`)
})

// 쿼리 파라미터
app.get('/search', (req, res) => {
  const { q, page } = req.query
  res.end(`Search: ${q}, Page: ${page}`)
})
```

**설정 조회:**
```typescript
const port = app.get('port')
const env = app.get('env')
```

**반환값**:
- 라우트 등록 시: `Application` (체이닝 가능)
- 설정 조회 시: 설정 값


**참고**: 미들웨어 체이닝이 지원됩니다. `app.get('/path', middleware1, middleware2, handler)` 형태로 사용 가능합니다.

### app.post(path, handler)

POST 라우트를 등록합니다.

```typescript
app.post('/users', (req, res) => {
  res.statusCode = 201
  res.end('User created')
})
```

**반환값**: `Application`


### app.put(path, handler)

PUT 라우트를 등록합니다.

```typescript
app.put('/users/:id', (req, res) => {
  const { id } = req.params
  res.end(`User ${id} updated`)
})
```

**반환값**: `Application`


### app.delete(path, handler)

DELETE 라우트를 등록합니다.

```typescript
app.delete('/users/:id', (req, res) => {
  const { id } = req.params
  res.end(`User ${id} deleted`)
})
```

**반환값**: `Application`


### app.patch(path, handler)

PATCH 라우트를 등록합니다.

```typescript
app.patch('/users/:id', (req, res) => {
  const { id } = req.params
  res.end(`User ${id} patched`)
})
```

**반환값**: `Application`


### app.options(path, handler)

OPTIONS 라우트를 등록합니다.

```typescript
app.options('/users', (req, res) => {
  res.setHeader('Allow', 'GET, POST, PUT, DELETE')
  res.end()
})
```

**반환값**: `Application`


### app.head(path, handler)

HEAD 라우트를 등록합니다.

```typescript
app.head('/users', (req, res) => {
  res.setHeader('Content-Length', '1234')
  res.end()
})
```

**반환값**: `Application`


### app.all(path, handler)

모든 HTTP 메서드에 대한 라우트를 등록합니다.

```typescript
app.all('/ping', (req, res) => {
  res.end('pong')
})
```

**반환값**: `Application`


### app.route(path)

라우트 체이닝을 위한 RouteChain 객체를 반환합니다.

```typescript
app.route('/users')
  .get((req, res) => {
    res.end('Get users')
  })
  .post((req, res) => {
    res.end('Create user')
  })

app.route('/users/:id')
  .get((req, res) => {
    res.end(`Get user ${req.params.id}`)
  })
  .put((req, res) => {
    res.end(`Update user ${req.params.id}`)
  })
  .delete((req, res) => {
    res.end(`Delete user ${req.params.id}`)
  })
```

**반환값**: `RouteChain`


### app.onError(handler)

글로벌 에러 핸들러를 등록합니다. 모든 라우트와 미들웨어에서 발생한 에러를 중앙에서 처리합니다.


**JavaScript (CommonJS):**
```javascript
const numflow = require('numflow')
const { ValidationError, NotFoundError, BusinessError } = numflow
const app = numflow()

app.onError((err, req, res) => {
  console.error(err)

  // ValidationError 처리
  if (err instanceof ValidationError) {
    return res.status(400).json({
      error: err.message,
      validationErrors: err.validationErrors
    })
  }

  // NotFoundError 처리
  if (err instanceof NotFoundError) {
    return res.status(404).json({ error: err.message })
  }

  // BusinessError 처리
  if (err instanceof BusinessError) {
    return res.status(400).json({
      error: err.message,
      code: err.code
    })
  }

  // 일반 에러 (500)
  res.status(500).json({ error: 'Internal server error' })
})
```

**TypeScript:**
```typescript
import numflow, {
  ValidationError,
  NotFoundError,
  BusinessError,
  ErrorHandler
} from 'numflow'

const app = numflow()

const errorHandler: ErrorHandler = (err, req, res) => {
  console.error(err)

  if (err instanceof ValidationError) {
    return res.status(400).json({
      error: err.message,
      validationErrors: err.validationErrors
    })
  }

  if (err instanceof NotFoundError) {
    return res.status(404).json({ error: err.message })
  }

  if (err instanceof BusinessError) {
    return res.status(400).json({
      error: err.message,
      code: err.code
    })
  }

  res.status(500).json({ error: 'Internal server error' })
}

app.onError(errorHandler)
```

**개발/프로덕션 환경 분기:**
```javascript
if (process.env.NODE_ENV !== 'production') {
  // 개발 환경: 스택 트레이스 포함
  app.onError((err, req, res) => {
    res.status(err.statusCode || 500).json({
      error: {
        message: err.message,
        statusCode: err.statusCode || 500,
        stack: err.stack  // 스택 트레이스 포함
      }
    })
  })
} else {
  // 프로덕션 환경: 안전한 메시지만
  app.onError((err, req, res) => {
    console.error('[ERROR]', {
      message: err.message,
      stack: err.stack,
      timestamp: new Date().toISOString()
    })

    res.status(err.statusCode || 500).json({
      error: {
        message: err.message || 'Internal server error',
        statusCode: err.statusCode || 500
      }
    })
  })
}
```

**반환값**: `Application` (체이닝 가능)

**참고**:
- 에러 핸들러는 한 번만 등록 가능합니다
- 에러 핸들러를 등록하지 않으면 기본 에러 핸들러가 사용됩니다
- Feature 에러도 자동으로 글로벌 핸들러로 전달됩니다

### app.set(key, value)

애플리케이션 설정을 저장합니다.

```typescript
app.set('view engine', 'pug')
app.set('views', './views')
app.set('trust proxy', true)
```


### app.get(key)

애플리케이션 설정을 가져옵니다. (app.get(path, handler)와 오버로딩됨)

```typescript
const viewEngine = app.get('view engine')
const port = app.get('port')
```


### app.enable(key) / app.disable(key)

Boolean 설정을 활성화/비활성화합니다.


```typescript
app.enable('trust proxy')
app.disable('x-powered-by')

// 체이닝 가능
app.enable('trust proxy')
   .set('port', 3000)
   .listen(3000)
```

**반환값**: `Application` (체이닝 가능)

### app.enabled(key) / app.disabled(key)

Boolean 설정 상태를 확인합니다.


```typescript
if (app.enabled('trust proxy')) {
  // trust proxy가 활성화됨
}

if (app.disabled('x-powered-by')) {
  // x-powered-by가 비활성화됨
}
```

**반환값**: `boolean`

---

## Properties

### app.mountpath

이 애플리케이션이 부모 애플리케이션에 마운트된 경로 패턴입니다.

**타입**: `string | string[]`

**기본 예제:**
```typescript
const app = numflow()
const admin = numflow()

admin.get('/dashboard', (req, res) => {
  console.log(admin.mountpath) // '/admin'
  res.send('관리자 대시보드')
})

app.use('/admin', admin)
```

**여러 경로에 마운트:**
```typescript
const app = numflow()
const blog = numflow()

blog.get('/', (req, res) => {
  console.log(blog.mountpath) // ['/blog', '/articles']
  res.send('블로그 홈')
})

// 여러 경로에 마운트
app.use(['/blog', '/articles'], blog)
```

**app.path()와의 차이:**
- `app.mountpath`: 앱이 마운트된 즉시 마운트 패턴을 반환하는 프로퍼티
- `app.path()`: 모든 부모 마운트를 포함한 누적된 전체 경로를 반환하는 메서드

**차이점을 보여주는 예제:**
```typescript
const app = numflow()
const admin = numflow()
const users = numflow()

users.get('/', (req, res) => {
  res.json({
    mountpath: users.mountpath, // '/users' (즉시 마운트 패턴)
    path: users.path()           // '/admin/users' (전체 누적 경로)
  })
})

admin.use('/users', users)
app.use('/admin', admin)
```

**마운트되지 않은 애플리케이션:**
```typescript
const app = numflow()
console.log(app.mountpath) // '' (마운트되지 않은 앱은 빈 문자열)
```

**참고**: `mountpath` 프로퍼티는 `app.use()`를 사용하여 애플리케이션이 마운트될 때 자동으로 설정됩니다.

---

**이전**: [목차](./README.md)
