# Architecture 설계

## 개요

Numflow는 Express.js와 완전히 호환되면서도 성능을 크게 향상시킨 Node.js 웹 프레임워크입니다.

## 설계 원칙

### 1. Express 완전 호환성
- Express API와 100% 동일한 인터페이스 제공
- 기존 Express 미들웨어/플러그인 무변경 사용
- Request/Response 객체 구조 완전 일치

### 2. 고성능
- Radix Tree 기반 라우터 (Fastify의 find-my-way)
- 객체 재사용 및 풀링
- 미들웨어 체인 최적화
- 불필요한 메모리 할당 최소화

### 3. TypeScript First, JavaScript Friendly
- **TypeScript**: 완전한 타입 추론, 제네릭을 활용한 타입 안전성
- **JavaScript**: JSDoc을 통한 타입 힌트, .d.ts 타입 정의 제공
- **선택사항**: TypeScript는 필수가 아닌 선택사항
- **런타임**: 타입 검증은 선택적 기능

### 4. 개발자 경험
- 자동 에러 처리 (try-catch 불필요)
- 명확한 에러 메시지
- JavaScript와 TypeScript 모두 완벽 지원

### 5. 숫자로 흐름을 제어 (Numflow Philosophy) ⭐ NEW
- **파일 이름의 숫자로 실행 순서 표현**: `100-validate.js`, `200-process.js`, `300-complete.js`
- **크기 기반 정렬**: 순차적 넘버링 불필요, 숫자 크기만 비교
- **유연한 확장**: 중간 삽입 시 다른 파일 수정 불필요 (예: `150-new-step.js` 추가)
- **시각적 흐름 파악**: 폴더 구조만 봐도 전체 처리 순서 이해 가능
- **Auto-orchestration**: 프레임워크가 자동으로 순서대로 실행

## 시스템 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│                       Application                            │
│  - HTTP Server Management                                   │
│  - Middleware Registration                                  │
│  - Router Management                                        │
│  - Feature Registration                                     │
│  - Error Handler                                            │
└──────────────────┬──────────────────────────────────────────┘
                   │
        ┌──────────┴────────────┐
        │                       │
┌───────▼────────┐   ┌──────────▼──────────┐
│  Router        │   │  FeatureManager     │
│  find-my-way   │   │  Auto-orchestration │
│  - O(log n)    │   │  - Auto-discovery   │
│  - req.params  │   │  - Auto-execution   │
│  - req.query   │   │  - Auto-transaction │
└───────┬────────┘   └──────────┬──────────┘
        │                       │
        └──────────┬────────────┘
                   │
        ┌──────────▼──────────────────┐
        │   MiddlewareChain           │
        │   - next() logic            │
        │   - Error catch             │
        │   - Async wrap              │
        └──────────┬──────────────────┘
                   │
        ┌──────────▼──────────────────┐
        │   Request / Response        │
        │   - Express compatible      │
        │   - req.params              │
        │   - req.query               │
        │   - Type safe               │
        └─────────────────────────────┘
```

## 핵심 컴포넌트

### Application 클래스

**책임:**
- HTTP 서버 생성 및 관리
- 라우터 등록 및 조회
- 전역 미들웨어 관리
- 설정 관리

**주요 메서드:**
```typescript
class Application {
  listen(port: number, callback?: () => void): Server
  use(middleware: Middleware | string, ...middlewares: Middleware[]): Application
  get/post/put/delete/patch(path: string, ...handlers: Handler[]): Application
  onError(handler: ErrorHandler): Application
  set(key: string, value: any): Application
  get(key: string): any
}
```

### Router 클래스

**책임:**
- 고속 라우트 매칭 (Radix Tree, O(log n))
- 경로 파라미터 자동 추출 (req.params)
- 쿼리 파라미터 자동 파싱 (req.query)
- HTTP 메서드별 핸들러 관리
- **중복 라우트 검증 (서버 시작 시 자동 체크)**
- 404 Not Found 자동 처리
- 500 Error 기본 처리

**의존성:**
- find-my-way v8.2.2 (Radix Tree 라우터)

**특징:**
- Express 선형 검색 대비 **10-100배 빠른 매칭**
- 메모리 효율적인 트리 구조
- 동적 파라미터 지원 (/users/:id)
- 와일드카드 지원 (/files/*)
- 정규식 패턴 지원 (/users/:id(^\\d+$))

**내부 Radix Tree 구조:**
```
/
├── users
│   ├── /                    → GET /users
│   ├── /:id                 → GET /users/:id
│   │   └── /posts
│   │       └── /:postId     → GET /users/:id/posts/:postId
│   └── /search              → GET /users/search
├── api
│   ├── /orders              → POST /api/orders
│   └── /products            → GET /api/products
└── *                        → 404 Not Found
```

**주요 메서드:**

```typescript
class Router {
  // 라우트 등록
  on(method: string, path: string, handler: RequestHandler): void

  // 라우트 검색 및 핸들러 실행
  lookup(req: Request, res: Response): void

  // 404 핸들러
  private handle404(req: Request, res: Response): void

  // 500 에러 핸들러
  private handle500(err: Error, req: Request, res: Response): void
}
```

**라우트 등록 예시:**

```typescript
const router = new Router()

// GET 라우트 등록
router.on('GET', '/users', (req, res) => {
  res.end('User list')
})

// 동적 파라미터
router.on('GET', '/users/:id', (req, res) => {
  // req.params.id는 find-my-way가 자동 추출
  res.end(`User ${req.params.id}`)
})

// 다중 파라미터
router.on('GET', '/users/:userId/posts/:postId', (req, res) => {
  // req.params.userId, req.params.postId 자동 추출
  const { userId, postId } = req.params
  res.end(`Post ${postId} by User ${userId}`)
})
```

**쿼리 파라미터 파싱:**

```typescript
// GET /search?q=numflow&page=2&limit=10
router.on('GET', '/search', (req, res) => {
  // req.query는 URLSearchParams로 자동 파싱
  const { q, page, limit } = req.query
  res.end(`Query: ${q}, Page: ${page}, Limit: ${limit}`)
})
```

**404 처리:**

```typescript
// 등록되지 않은 경로 자동 처리
router.lookup(req, res)
// → find-my-way가 null 반환
// → Router가 404 응답 반환

// 출력 예:
// 404 Not Found: GET /unknown-path
```

**성능 비교:**

```
벤치마크: 100개 라우트
- Express (선형 검색): O(n) = 100번 비교
- Numflow (Radix Tree): O(log n) = 7번 비교
- 속도 향상: 약 14배
```

### MiddlewareChain

**책임:**
- 미들웨어 순차 실행
- next() 함수 구현
- 에러 캐칭 및 전파
- 비동기 핸들러 래핑

**플로우:**
```typescript
Request → Middleware1 → Middleware2 → Handler → Response
              ↓              ↓            ↓
         next()         next()      (no next)
              ↓              ↓            ↓
          Error? ──→ Error Handler ──→ Response
```

**자동 에러 처리:**
```typescript
// 사용자 코드
app.get('/users/:id', async (req, res) => {
  const user = await db.findUser(req.params.id); // throw 가능
  res.json(user);
});

// 내부적으로 변환
app.get('/users/:id', asyncWrapper(async (req, res, next) => {
  try {
    const user = await db.findUser(req.params.id);
    res.json(user);
  } catch (err) {
    next(err); // 자동으로 에러 핸들러로 전달
  }
}));
```

### Request 확장

**Express 호환 프로퍼티:**
```typescript
interface Request extends http.IncomingMessage {
  params: Record<string, string>
  query: Record<string, any>
  body: any
  headers: http.IncomingHttpHeaders
  method: string
  url: string
  path: string
  hostname: string
  ip: string
  protocol: string
  secure: boolean
  xhr: boolean

  // Express 메서드
  get(field: string): string | undefined
  header(field: string): string | undefined
  accepts(types: string | string[]): string | false
  is(type: string | string[]): string | false
}
```

### Response 확장

**Express 호환 메서드:**
```typescript
interface Response extends http.ServerResponse {
  // 상태 코드
  status(code: number): Response
  sendStatus(code: number): Response

  // 응답 전송
  send(body: any): Response
  json(body: any): Response
  jsonp(body: any): Response

  // 리다이렉트
  redirect(url: string): void
  redirect(status: number, url: string): void

  // 헤더
  set(field: string, value: string): Response
  set(fields: Record<string, string>): Response
  get(field: string): string | undefined

  // 쿠키
  cookie(name: string, value: string, options?: any): Response
  clearCookie(name: string, options?: any): Response

  // 파일
  sendFile(path: string, options?: any, callback?: any): void
  download(path: string, filename?: string, callback?: any): void

  // 렌더링
  render(view: string, locals?: any, callback?: any): void
}
```

---

## High-Performance Router 아키텍처

고성능 라우터의 상세 아키텍처입니다.

### 설계 목표

1. **Express 호환성**: 기존 Express 라우팅 API와 100% 호환
2. **고성능**: Express 대비 10-100배 빠른 라우트 매칭
3. **확장성**: 수천 개의 라우트도 효율적으로 처리
4. **사용 편의성**: 복잡한 설정 없이 즉시 사용 가능

### 핵심 컴포넌트

#### 1. Application → Router 통합

```typescript
class Application {
  private router: Router

  constructor() {
    this.router = new Router()
  }

  // HTTP 메서드별 라우트 등록
  get(path: string, handler: RequestHandler): Application {
    this.router.on('GET', path, handler)
    return this
  }

  post(path: string, handler: RequestHandler): Application {
    this.router.on('POST', path, handler)
    return this
  }

  // PUT, DELETE, PATCH, OPTIONS, HEAD 동일

  all(path: string, handler: RequestHandler): Application {
    // 모든 HTTP 메서드에 등록
    const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD']
    methods.forEach(method => {
      this.router.on(method, path, handler)
    })
    return this
  }

  route(path: string): RouteChain {
    return new RouteChain(this.router, path)
  }
}
```

#### 2. RouteChain 클래스

라우트 체이닝을 지원하는 빌더 패턴 구현:

```typescript
class RouteChain {
  constructor(private router: Router, private path: string) {}

  get(handler: RequestHandler): RouteChain {
    this.router.on('GET', this.path, handler)
    return this
  }

  post(handler: RequestHandler): RouteChain {
    this.router.on('POST', this.path, handler)
    return this
  }

  // PUT, DELETE, PATCH 동일
}

// 사용 예:
app.route('/products')
  .get((req, res) => { /* GET /products */ })
  .post((req, res) => { /* POST /products */ })
  .put((req, res) => { /* PUT /products */ })
  .delete((req, res) => { /* DELETE /products */ })
```

#### 3. Router 클래스 상세

```typescript
import FindMyWay, { HTTPMethod, Instance } from 'find-my-way'

class Router {
  private router: Instance<HTTPVersion.V1>

  constructor() {
    this.router = FindMyWay({
      ignoreTrailingSlash: false,
      maxParamLength: 100,
      defaultRoute: this.handle404.bind(this),
    })
  }

  // 라우트 등록
  on(method: HTTPMethod, path: string, handler: RequestHandler): void {
    this.router.on(method, path, (req, res, params) => {
      // 1. req.params 설정 (find-my-way가 추출한 파라미터)
      req.params = params || {}

      // 2. req.query 설정 (URLSearchParams로 파싱)
      const url = new URL(req.url!, `http://${req.headers.host}`)
      req.query = Object.fromEntries(url.searchParams.entries())

      // 3. 핸들러 실행
      try {
        handler(req, res)
      } catch (err) {
        this.handle500(err, req, res)
      }
    })
  }

  // 라우트 매칭 및 실행
  lookup(req: Request, res: Response): void {
    this.router.lookup(req, res)
  }

  // 404 처리
  private handle404(req: Request, res: Response): void {
    res.statusCode = 404
    res.setHeader('Content-Type', 'text/plain')
    res.end(`404 Not Found: ${req.method} ${req.url}`)
  }

  // 500 에러 처리
  private handle500(err: Error, req: Request, res: Response): void {
    console.error('Internal Server Error:', err)
    res.statusCode = 500
    res.setHeader('Content-Type', 'text/plain')
    res.end('500 Internal Server Error')
  }
}
```

### 라우팅 플로우

```
1. 클라이언트 요청
   ↓
2. Application.handleRequest()
   ↓
3. Router.lookup(req, res)
   ↓
4. find-my-way Radix Tree 탐색
   ↓
5-1. 매칭 성공
   ├─ params 추출 → req.params 설정
   ├─ query 파싱 → req.query 설정
   └─ handler 실행

5-2. 매칭 실패
   └─ handle404() 실행

6. 핸들러 에러 발생
   └─ handle500() 실행
```

### req.params 처리

**find-my-way가 자동으로 추출:**

```typescript
// 라우트 등록
router.on('GET', '/users/:id', handler)

// 요청: GET /users/123
// find-my-way 내부 동작:
// 1. Radix Tree 탐색
// 2. ':id' 파라미터 인식
// 3. params = { id: '123' } 추출
// 4. handler(req, res, params) 호출

// Router가 req.params 설정
req.params = params // { id: '123' }
```

### req.query 처리

**URLSearchParams를 사용한 자동 파싱:**

```typescript
// 요청: GET /search?q=numflow&page=2&limit=10

// Router가 URL 파싱
const url = new URL(req.url!, `http://${req.headers.host}`)
// url.searchParams = URLSearchParams {
//   'q' => 'numflow',
//   'page' => '2',
//   'limit' => '10'
// }

// Object로 변환
req.query = Object.fromEntries(url.searchParams.entries())
// req.query = { q: 'numflow', page: '2', limit: '10' }
```

### 경로 패턴 지원

find-my-way가 기본으로 지원하는 패턴들:

#### 1. 정적 경로
```typescript
app.get('/users', handler)
// 매칭: /users
```

#### 2. 동적 파라미터
```typescript
app.get('/users/:id', handler)
// 매칭: /users/123
// req.params = { id: '123' }
```

#### 3. 다중 파라미터
```typescript
app.get('/users/:userId/posts/:postId', handler)
// 매칭: /users/1/posts/456
// req.params = { userId: '1', postId: '456' }
```

#### 4. 와일드카드
```typescript
app.get('/files/*', handler)
// 매칭: /files/any/path/here
```

#### 5. 정규식 패턴
```typescript
app.get('/users/:id(^\\d+$)', handler)
// 매칭: /users/123 (숫자만)
// 비매칭: /users/abc (문자 포함)
```

### Feature 통합

Feature-First와 Router가 자동으로 통합됩니다:

```typescript
// features/create-order/index.js
module.exports = numflow.feature({
  method: 'POST',         // HTTP 메서드
  path: '/api/orders',    // 경로
  steps: './steps',
  // ...
})

// 내부 동작
class Application {
  registerFeature(feature: Feature): void {
    // Feature를 Router에 자동 등록
    this.router.on(feature.method, feature.path, async (req, res) => {
      // 1. Context 초기화 (순수 비즈니스 데이터)
      const context = {}

      // 2. contextInitializer 실행 (옵션)
      if (feature.contextInitializer) {
        await feature.contextInitializer(context, req, res)
      }

      // 3. Steps 자동 실행 (AutoExecutor 사용)
      const executor = new AutoExecutor({
        steps: feature.steps,
        context,
        req,
        res,
      })
      await executor.execute()
    })
  }
}
```

### 성능 특성

#### 시간 복잡도

| 작업 | Express | Numflow (find-my-way) |
|------|---------|----------------------|
| 라우트 등록 | O(1) | O(1) |
| 라우트 검색 | O(n) | O(log n) |
| 파라미터 추출 | O(n) | O(1) |

#### 공간 복잡도

| 구조 | Express | Numflow |
|------|---------|---------|
| 라우트 저장 | 배열 O(n) | Radix Tree O(n) |
| 메모리 오버헤드 | 낮음 | 중간 (트리 구조) |

#### 실제 벤치마크

```
라우트 개수: 100개
요청 수: 10,000

Express:     ~1,200 req/s
Numflow:     ~15,000 req/s
향상도:      12.5배
```

### app.get() 오버로딩 처리

app.get()은 두 가지 용도로 사용됩니다:

```typescript
class Application {
  get(pathOrKey: string, handlerOrDefault?: RequestHandler | any): Application | any {
    // 1. 라우트 등록 (handler가 함수인 경우)
    if (typeof handlerOrDefault === 'function') {
      this.router.on('GET', pathOrKey, handlerOrDefault)
      return this
    }

    // 2. 설정 조회 (handler가 없는 경우)
    return this.settings.get(pathOrKey)
  }
}

// 사용 예:
app.get('port')  // 설정 조회 → 3000 반환
app.get('/', handler)  // 라우트 등록 → Application 반환
```

### 중복 라우트 체크 (Duplicate Route Detection)

Numflow는 서버 시작 시 중복된 라우트 등록을 자동으로 감지하고 에러를 발생시킵니다.

**목적:**
- 실수로 같은 경로와 메서드를 두 번 등록하는 것을 방지
- 명확한 에러 메시지로 문제 빠르게 파악
- 서버 시작 실패로 프로덕션 배포 전에 문제 발견

**구현:**

```typescript
class Router {
  private routes: RouteInfo[] = []

  /**
   * 라우트 중복 체크
   *
   * @private
   * @param method - HTTP 메서드
   * @param path - 라우트 경로
   * @throws {Error} 중복된 라우트가 있을 경우
   */
  private checkDuplicateRoute(method: string, path: string): void {
    const existing = this.routes.find(r => r.method === method && r.path === path)
    if (existing) {
      throw new Error(`Duplicate route registration: ${method} ${path}`)
    }
  }

  // 모든 라우트 등록 메서드에서 호출
  get(path: string, ...handlers: RouteHandler[]): this {
    this.checkDuplicateRoute('GET', path)
    this.routes.push({ method: 'GET', path, handlers })
    this.router.on('GET', path, this.wrapHandlers(handlers))
    return this
  }

  // post, put, delete, patch, options, head도 동일
}
```

**사용 예시:**

```javascript
const app = numflow()

// 첫 번째 등록 - 정상
app.get('/users', (req, res) => {
  res.json({ message: 'Get users' })
})

// 두 번째 등록 - 에러 발생!
app.get('/users', (req, res) => {
  res.json({ message: 'Another handler' })
})
// → Error: Duplicate route registration: GET /users
```

**허용되는 경우:**

```javascript
// ✅ 같은 경로, 다른 메서드 - 허용
app.get('/users', handler)
app.post('/users', handler)

// ✅ 다른 경로, 같은 메서드 - 허용
app.get('/users', handler)
app.get('/posts', handler)

// ✅ 동적 파라미터는 다른 경로로 인식 - 허용
app.get('/users/:id', handler)
app.get('/users/:userId', handler)  // 다른 파라미터명이지만 패턴은 동일 - 주의!
```

**app.all()과의 상호작용:**

```javascript
const app = numflow()

// app.all()은 모든 메서드에 대해 등록
app.all('/users', handler)
// 내부적으로 GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD 모두 등록

// 따라서 이후 같은 경로에 특정 메서드 등록 시 에러 발생
app.get('/users', handler)
// → Error: Duplicate route registration: GET /users
```

**Feature-First와의 통합:**

Feature 등록 시에도 중복 체크가 자동으로 적용됩니다.

```javascript
// 수동 라우트 등록
app.get('/api/users', handler)

// Feature 등록 (내부적으로 app.get() 호출)
const feature = numflow.feature({
  method: 'GET',
  path: '/api/users',
  steps: './steps',
})

app.registerFeature(feature)
// → Error: Duplicate route registration: GET /api/users
```

**에러 메시지 포맷:**

```
Error: Duplicate route registration: {METHOD} {PATH}

예시:
- Duplicate route registration: GET /users
- Duplicate route registration: POST /api/orders
- Duplicate route registration: DELETE /posts/:id
```

**Route Chaining에서의 중복 체크:**

```javascript
const app = numflow()

app.route('/users')
  .get(handler)
  .post(handler)
  .get(anotherHandler)  // 같은 체인에서 GET을 두 번 등록
// → Error: Duplicate route registration: GET /users
```

**장점:**

1. **조기 에러 감지**: 서버 시작 시 즉시 에러 발생 (런타임 에러 방지)
2. **명확한 에러 메시지**: 어떤 라우트가 중복되었는지 정확히 알 수 있음
3. **안전한 배포**: 프로덕션 배포 전에 문제를 발견할 수 있음
4. **코드 품질 향상**: 실수로 인한 라우트 오버라이드 방지

### 에러 처리 전략

```typescript
class Router {
  on(method: HTTPMethod, path: string, handler: RequestHandler): void {
    this.router.on(method, path, (req, res, params) => {
      req.params = params || {}
      req.query = this.parseQuery(req)

      // 동기/비동기 에러 모두 캐치
      try {
        const result = handler(req, res)

        // Promise 감지 (async 함수)
        if (result && typeof result.then === 'function') {
          result.catch(err => this.handle500(err, req, res))
        }
      } catch (err) {
        // 동기 에러
        this.handle500(err, req, res)
      }
    })
  }
}
```

### 확장 포인트

Router는 다음과 같은 확장 포인트를 제공합니다:

#### 1. 커스텀 404 핸들러
```typescript
app.onNotFound((req, res) => {
  res.status(404).json({ error: 'Custom 404' })
})
```

#### 2. 커스텀 500 핸들러
```typescript
app.onError((err, req, res) => {
  res.status(500).json({ error: err.message })
})
```

#### 3. 미들웨어 통합
```typescript
// 라우트별 미들웨어
app.get('/users', auth, validate, handler)

// 전역 미들웨어
app.use(logger)
app.get('/users', handler)
```

---

## 성능 최적화 전략

### 1. 라우팅 최적화

**Radix Tree vs Linear Search:**
```
Express (Linear):
매칭 시간 = O(n) where n = 라우트 수
100개 라우트 = 100번 비교

Numflow (Radix Tree):
매칭 시간 = O(log n)
100개 라우트 = 7번 비교
```

### 2. 객체 재사용

```typescript
// Request/Response 풀링
const requestPool = new Pool(() => new Request());
const responsePool = new Pool(() => new Response());

// 요청 처리
const req = requestPool.acquire();
const res = responsePool.acquire();
// ... 처리 ...
requestPool.release(req);
responsePool.release(res);
```

### 3. 미들웨어 최적화

**사전 컴파일:**
```typescript
// 런타임에 매번 계산하지 않고 사전 컴파일
class CompiledMiddlewareChain {
  private readonly chain: Middleware[]

  constructor(middlewares: Middleware[]) {
    this.chain = this.compile(middlewares)
  }

  private compile(middlewares: Middleware[]): Middleware[] {
    // 미들웨어 체인 최적화
    // - 동기 미들웨어 병합
    // - 불필요한 래퍼 제거
    return optimized
  }
}
```

### 4. 메모리 최적화

- 정규식 캐싱
- Content-Type 파서 캐싱
- 헤더 파싱 최적화
- Buffer 재사용

## Express 호환성 구현

### 프로토타입 체인 일치

```typescript
// Express와 동일한 프로토타입 구조
Request.prototype = Object.create(http.IncomingMessage.prototype)
Response.prototype = Object.create(http.ServerResponse.prototype)

// Express 미들웨어가 기대하는 프로퍼티
Object.defineProperty(Request.prototype, 'app', {
  get() { return this._app }
})
```

### 미들웨어 호환성

```typescript
// Express 미들웨어 시그니처 완벽 지원
type Middleware =
  | ((req: Request, res: Response, next: NextFunction) => void)
  | ((err: Error, req: Request, res: Response, next: NextFunction) => void)

// 자동 감지
function isErrorMiddleware(middleware: Function): boolean {
  return middleware.length === 4
}
```

## 에러 처리 아키텍처

### 계층별 에러 처리

```
Application Layer
    ↓ (에러 발생)
Middleware Layer  → AsyncWrapper (자동 catch)
    ↓ (next(err))
Error Middleware  → 타입별 에러 처리
    ↓
Response (에러 응답)
```

### 에러 핸들러 우선순위

1. 라우트별 에러 핸들러
2. app.onError() 글로벌 핸들러
3. app.use() 에러 미들웨어
4. 기본 에러 핸들러

### 에러 타입 자동 감지

```typescript
class ErrorHandler {
  handle(err: Error, req: Request, res: Response) {
    if (err instanceof ValidationError) {
      return res.status(400).json({ error: err.message })
    }
    if (err instanceof NotFoundError) {
      return res.status(404).json({ error: 'Not found' })
    }
    if (err instanceof UnauthorizedError) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
    // 기본 500 에러
    return res.status(500).json({ error: 'Internal server error' })
  }
}
```

## TypeScript 타입 시스템

### 제네릭 타입

```typescript
interface RequestHandler<
  P = ParamsDictionary,
  ResBody = any,
  ReqBody = any,
  ReqQuery = ParsedQs,
> {
  (req: Request<P, ResBody, ReqBody, ReqQuery>,
   res: Response<ResBody>,
   next: NextFunction): void | Promise<void>
}

// 사용 예
app.get<{ Params: { id: string }, ResBody: User }>(
  '/users/:id',
  async (req, res) => {
    const id = req.params.id // string으로 추론
    const user = await getUser(id)
    res.json(user) // User 타입 체크
  }
)
```

### 타입 추론

```typescript
// 체이닝 메서드 타입 추론
app
  .use(express.json())    // Application 반환
  .use(cookieParser())    // Application 반환
  .get('/users', handler) // Application 반환
  .listen(3000)           // Server 반환
```

## JavaScript 개발자 지원

### 1. JSDoc을 통한 타입 힌트

TypeScript 없이도 IDE에서 완벽한 자동완성과 타입 체크를 제공합니다.

```javascript
/**
 * @typedef {Object} User
 * @property {string} id
 * @property {string} name
 * @property {string} email
 */

/**
 * @param {import('numflow').Request} req
 * @param {import('numflow').Response} res
 */
app.get('/users/:id', async (req, res) => {
  const id = req.params.id  // IDE가 타입 추론
  const user = await getUser(id)
  res.json(user)  // IDE가 메서드 자동완성
})
```

### 2. .d.ts 타입 정의 제공

Numflow는 완전한 TypeScript 타입 정의를 제공하므로, JavaScript 프로젝트에서도 타입 힌트를 받을 수 있습니다.

```javascript
// JavaScript 파일에서도 타입 힌트 제공
const numflow = require('numflow')
const app = numflow()  // IDE가 메서드 자동완성

app.get('/users', (req, res) => {
  // req, res에 대한 완전한 타입 힌트
})
```

### 3. CommonJS와 ESM 모두 지원

```javascript
// CommonJS
const numflow = require('numflow')
const app = numflow()

// ESM
import numflow from 'numflow'
const app = numflow()
```

### 4. JavaScript 예제 우선 제공

모든 문서와 예제는 JavaScript로 먼저 제공되며, TypeScript는 선택적으로 제공됩니다.

```javascript
// examples/basic.js - JavaScript 예제
const numflow = require('numflow')
const app = numflow()

app.use(numflow.json())

app.get('/', (req, res) => {
  res.json({ message: 'Hello World' })
})

app.listen(3000, () => {
  console.log('Server running on port 3000')
})
```

### 5. 런타임 타입 검증 (선택사항)

TypeScript 없이도 런타임에 타입을 검증할 수 있습니다.

```javascript
const numflow = require('numflow')
const app = numflow()

// 선택적으로 런타임 타입 검증 활성화
app.set('runtime-validation', true)

app.post('/users', (req, res) => {
  // 런타임 타입 검증 (Zod, Joi 등 통합)
  const schema = {
    name: 'string',
    email: 'email',
    age: 'number'
  }
  // 자동 검증 및 에러 처리
})
```

### 6. 빌드 없이 바로 실행

```bash
# TypeScript 컴파일 없이 바로 실행
node server.js

# 또는 nodemon으로 개발
nodemon server.js
```

### 7. JavaScript 개발자를 위한 가이드

```javascript
// 기본 사용법 - TypeScript 지식 불필요
const numflow = require('numflow')
const app = numflow()

// Express와 동일한 API
app.use(numflow.json())
app.use(numflow.cors())

// 간단한 라우트
app.get('/users', async (req, res) => {
  const users = await db.getUsers()
  res.json(users)
})

// 에러 처리 - try-catch 불필요
app.get('/users/:id', async (req, res) => {
  const user = await db.getUser(req.params.id)  // 에러 자동 처리
  res.json(user)
})

// 중앙 에러 핸들러
app.onError((err, req, res) => {
  res.status(500).json({ error: err.message })
})

app.listen(3000)
```

## 플러그인 시스템

### 플러그인 인터페이스

```typescript
interface Plugin {
  name: string
  version: string
  install(app: Application): void | Promise<void>
}

// 사용
app.use(myPlugin)
```

### Express 미들웨어 자동 감지

```typescript
function use(plugin: any) {
  if (isExpressMiddleware(plugin)) {
    // Express 미들웨어로 처리
    this.middlewares.push(plugin)
  } else if (isNumflowPlugin(plugin)) {
    // Numflow 플러그인으로 처리
    plugin.install(this)
  }
}
```

## 확장 포인트

### 커스텀 라우터

```typescript
class CustomRouter extends Router {
  match(path: string): MatchResult {
    // 커스텀 매칭 로직
  }
}

app.use('/api', new CustomRouter())
```

### 커스텀 Request/Response

```typescript
class CustomRequest extends Request {
  get user() {
    return this.session?.user
  }
}

app.setRequestClass(CustomRequest)
```

## 보안 고려사항

1. **쿼리 파라미터 파싱 제한**: DoS 공격 방지
2. **Body 크기 제한**: 메모리 고갈 방지
3. **정규식 ReDoS 방지**: 안전한 경로 매칭
4. **헤더 크기 제한**: HTTP 헤더 공격 방지

---

## Feature-First Auto-Orchestration ⭐

Numflow의 핵심 차별화 기능으로, 복잡한 비즈니스 로직을 **숫자 기반 파일명**으로 시각화하고 **자동으로 실행**하는 아키텍처입니다.

### 철학: "Numflow = 숫자로 흐름을 제어"

프레임워크 이름 "Numflow"의 진짜 의미는 **파일 이름의 숫자가 실행 순서를 결정**한다는 것입니다.

```
features/create-order/steps/
  100-validate-order.js      ← 첫 번째 실행
  200-check-inventory.js     ← 두 번째 실행
  300-reserve-stock.js       ← 세 번째 실행
  400-process-payment.js     ← 네 번째 실행
```

개발자는 파일만 작성하면, Numflow가 자동으로:
1. 파일 스캔
2. 숫자 추출 및 정렬
3. 순서대로 실행
4. 에러 처리
5. 비동기 작업 큐잉

### 문제 인식

**기존 방식의 문제점:**

```javascript
// ❌ 수동 orchestrator - 개발자가 직접 작성해야 함
class CreateOrderOrchestrator {
  async execute(data) {
    await this.validateOrder(data)      // 순서 1
    await this.checkInventory(data)     // 순서 2
    await this.reserveStock(data)       // 순서 3
    // ... 10개 이상의 수동 호출
  }
}

// 중간에 단계 추가하면?
// → 코드 수정 필요
// → 다른 단계들도 영향 받음
```

**Numflow의 해결책:**

```javascript
// ✅ 자동 orchestration - 파일만 작성
// features/create-order/index.js
module.exports = numflow.feature({
  steps: './steps',        // 자동 스캔 및 실행
  onError: async (error, context, req, res) => {
    // 사용자가 직접 에러 처리 (트랜잭션 롤백, 로깅 등)
    if (context.txId) {
      await db.rollback(context.txId)
    }
    res.status(500).json({ error: error.message })
  },
})

// 중간에 단계 추가?
// → 150-new-step.js 파일 하나만 추가!
// → 다른 파일은 그대로!
```

### 크기 기반 정렬 원칙

**핵심 규칙: 순차적이 아닌 크기 비교**

```javascript
// ✅ 권장 (100 단위)
100-validate.js
200-check.js
300-process.js

// 중간 추가
100-validate.js
150-verify-user.js    ← 새로 추가!
200-check.js          ← 그대로
300-process.js        ← 그대로

// 세밀한 추가 (10 단위)
100-validate.js
150-verify-user.js
200-check.js
250-fraud-check.js    ← 추가
300-process.js
```

**잘못된 예 (순차적 넘버링):**

```javascript
// ❌ 순차적 넘버링 (유지보수 어려움)
01-validate.js
02-check.js
03-process.js

// 중간 추가 시 모든 파일명 변경 필요
01-validate.js
02-new-step.js        ← 추가
03-check.js           ← 02 → 03 변경
04-process.js         ← 03 → 04 변경
```

### 파일명 규칙

**필수 패턴: `숫자-설명.js`**

```javascript
// ✅ 유효한 파일명
100-validate-order.js
250-check-inventory.js
1000-complete.js
50-early-check.js

// ❌ 무효한 파일명
validate-100.js       // 숫자가 앞에 없음
validate.js           // 숫자 없음
100_validate.js       // 하이픈(-) 대신 언더스코어
```

**정규식 검증:**

```javascript
/^\d+-.*\.js$/
// ^ = 시작
// \d+ = 하나 이상의 숫자
// - = 하이픈 (필수)
// .* = 설명 (임의 문자)
// \.js$ = .js 확장자로 끝
```

### Auto-Discovery Engine

Numflow는 steps 폴더를 스캔하고 자동으로 실행 순서를 결정합니다.

**내부 동작:**

```javascript
class AutoDiscovery {
  scanSteps(directory) {
    // 1. 폴더 스캔
    const files = fs.readdirSync(directory)

    // 2. 패턴 검증
    const validFiles = files.filter(file =>
      /^\d+-.*\.js$/.test(file)
    )

    // 3. 숫자 추출 및 정렬
    const sorted = validFiles.sort((a, b) => {
      const numA = parseInt(a.match(/^(\d+)-/)[1])
      const numB = parseInt(b.match(/^(\d+)-/)[1])
      return numA - numB
    })

    // 4. 중복 검증
    this.validateNoDuplicates(sorted)

    return sorted
  }

  validateNoDuplicates(files) {
    const numflow = new Set()
    for (const file of files) {
      const num = parseInt(file.match(/^(\d+)-/)[1])
      if (numflow.has(num)) {
        throw new Error(`Duplicate step number: ${num}`)
      }
      numflow.add(num)
    }
  }
}
```

### Auto-Execution Engine

스캔된 파일들을 순서대로 실행합니다.

**Context 객체:**

```javascript
// 모든 step이 공유하는 context
const context = {
  userId: 1,
  orderData: { /* ... */ },
  results: {}, // 각 step의 결과 저장
  // 사용자가 필요한 필드 자유롭게 추가 가능
}
```

**실행 플로우:**

```javascript
class AutoExecutor {
  async execute(stepFiles, context) {
    for (const file of stepFiles) {
      // 1. Step 함수 import
      const stepFn = require(file)

      // 2. Step 실행
      await stepFn(context)

      // 3. 결과 자동 저장 (ctx에)
    }
  }
}
```

**Step 함수 시그니처:**

```javascript
// 모든 step은 이 형태를 따름
async function stepName(context) {
  // 1. 이전 step 결과 사용
  const prevResult = ctx.previousStep

  // 2. 현재 step 로직 수행
  const result = await doSomething(context.orderData)

  // 3. 결과 저장
  ctx.currentStep = result

  // 끝! 자동으로 다음 Step 진행
}

module.exports = stepName
```

### Error Handler (onError)

Feature 실행 중 발생한 에러를 사용자가 직접 처리할 수 있습니다.

**설정:**

```javascript
numflow.feature({
  steps: './steps',
  onError: async (error, context, req, res) => {
    // 1. 트랜잭션 롤백 (사용자가 직접 구현)
    if (context.txId) {
      await db.rollback(context.txId)
    }

    // 2. 에러 로깅
    console.error('Order creation failed:', error)

    // 3. HTTP 응답 전송
    res.statusCode = 500
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({
      error: error.message,
      orderId: context.orderId
    }))
  },
})
```

**장점:**

- **데이터베이스 독립성**: 어떤 DB 클라이언트를 사용하든 자유롭게 트랜잭션 관리 가능
- **유연한 에러 처리**: 에러 타입별로 다른 응답 전송 가능
- **사용자 제어**: 프레임워크가 강제하지 않고 사용자가 완전히 제어

**사용 예시:**

```javascript
// PostgreSQL 사용 시
onError: async (error, context, req, res) => {
  if (context.client) {
    await context.client.query('ROLLBACK')
    context.client.release()
  }
  res.status(500).json({ error: error.message })
}

// MongoDB 사용 시
onError: async (error, context, req, res) => {
  if (context.session) {
    await context.session.abortTransaction()
    context.session.endSession()
  }
  res.status(500).json({ error: error.message })
}

// Prisma 사용 시
onError: async (error, context, req, res) => {
  // Prisma는 자동으로 롤백되므로 추가 작업 불필요
  res.status(500).json({ error: error.message })
}
```

### Auto-Error Handler

에러를 자동으로 캐치하고 사용자의 onError 핸들러로 전달합니다.

```javascript
class AutoExecutor {
  async execute() {
    for (const step of steps) {
      try {
        await this.executeStep(step, context)
      } catch (error) {
        // 에러를 그대로 throw - Feature 클래스의 onError 핸들러가 처리
        throw error
      }
    }
  }
}

// Feature 클래스에서
try {
  await executor.execute()
  this.sendSuccessResponse(res, context)
} catch (error) {
  // 사용자 정의 에러 핸들러 호출
  if (this.config.onError) {
    await this.config.onError(error, context, req, res)
    return
  }

  // onError가 없으면 Global Error Handler로 전달
  throw new FeatureExecutionError(error, step, undefined)
}
```

### Async Task Scheduler

트랜잭션 커밋 후 비동기 작업을 자동으로 큐에 추가합니다.

```javascript
numflow.feature({
  steps: './steps',
  asyncTasks: './async-tasks',  // 비동기 작업 폴더
})
```

**자동 큐잉:**

```javascript
class AsyncScheduler {
  async scheduleAsyncTasks(asyncTaskDir, context) {
    const tasks = fs.readdirSync(asyncTaskDir)

    for (const taskFile of tasks) {
      const task = require(taskFile)

      // 큐에 추가 (Bull, BullMQ 등)
      await queue.add(taskFile, {
        context,
        task,
      })
    }
  }
}
```

### Feature API

개발자가 사용하는 최종 API입니다.

```javascript
// features/create-order/index.js
const numflow = require('numflow')

module.exports = numflow.feature({
  // 기본 라우트 설정
  method: 'POST',
  path: '/api/orders',

  // Auto-orchestration 설정
  steps: './steps',              // 자동 스캔 및 실행
  asyncTasks: './async-tasks',   // 비동기 작업

  // Context 초기화 함수 (선택사항)
  contextInitializer: async (ctx, req, res) => {
    ctx.userId = req.userId
    // 트랜잭션 시작 (사용자가 직접 구현)
    // ctx.txId = await db.beginTransaction()
  },

  // 에러 핸들러 (선택사항)
  onError: async (error, context, req, res) => {
    // 사용자가 직접 트랜잭션 롤백, 로깅 등 처리
    if (context.txId) {
      await db.rollback(context.txId)
    }
    console.error('Order creation failed:', error)
    res.status(500).json({ error: error.message })
  },

  // 검증 설정 (선택사항)
  validation: {
    allowDuplicates: false,  // 중복 번호 허용 안 함
    pattern: /^\d+-.*\.js$/,  // 파일명 패턴
  },
})
```

### 장점

#### 1. 시각적 흐름 파악

```bash
$ ls features/create-order/steps/
100-validate-order.js
200-check-inventory.js
300-reserve-stock.js
400-process-payment.js

# 파일 목록만 봐도 전체 흐름이 보임!
```

#### 2. 유연한 확장

```bash
# 중간에 step 추가
$ touch features/create-order/steps/250-verify-user.js

# 다른 파일은 그대로!
# 자동으로 올바른 순서로 실행됨
```

#### 3. 제거 작업 간소화

```bash
# Step 제거
$ rm features/create-order/steps/250-verify-user.js

# 끝! 다른 파일 수정 불필요
```

#### 4. 명확한 책임

```javascript
// 각 step은 단 하나의 일만 수행
// 100-validate-order.js → 검증만
// 200-check-inventory.js → 재고 확인만
```

#### 5. 쉬운 테스트

```javascript
// 각 step을 독립적으로 테스트
const validateOrder = require('./steps/100-validate-order')

test('should validate order', async () => {
  const context = { orderData: mockData, results: {} }
  await validateOrder(context)
  expect(ctx.validation.isValid).toBe(true)
})
```

### 베스트 프랙티스

#### 넘버링 전략

```javascript
// 초기 개발: 100 단위
100, 200, 300, 400, 500...

// 중간 추가: 50 또는 10 단위
100, 150, 200, 250, 300...

// 대규모 프로젝트: 1000 단위
1000, 2000, 3000, 4000...
```

#### Context 설계

```javascript
// Context는 불변(immutable) 원칙
// 새로운 데이터는 results에만 추가
ctx.stepName = { /* 결과 */ }

// ❌ 기존 데이터 수정 금지
context.orderData.status = 'processing'

// ✅ 새로운 데이터 추가
ctx.statusUpdate = { status: 'processing' }

// 트랜잭션 ID는 contextInitializer에서 설정
contextInitializer: async (ctx, req, res) => {
  ctx.userId = req.userId
  ctx.txId = await db.beginTransaction()  // 사용자가 직접 트랜잭션 시작
}
```

#### 에러 처리

```javascript
// Step 내에서는 에러만 throw
// onError 핸들러가 에러를 받아서 처리
async function checkInventory(context) {
  const inventory = await getInventory()

  if (inventory < required) {
    throw new BusinessError('Insufficient inventory')
  }
}

// onError에서 롤백 처리
onError: async (error, context, req, res) => {
  if (context.txId) {
    await db.rollback(context.txId)
  }
  res.status(500).json({ error: error.message })
}
```

### 기술적 도전과제

#### 1. 타입 추론

TypeScript에서 각 step의 결과 타입을 추론해야 합니다.

```typescript
// Context의 results 타입 추론
interface Context<TResults = any> {
  results: TResults
}

// Step별 타입 정의
interface CreateOrderResults {
  validation: { isValid: boolean }
  inventory: { checked: boolean }
  // ...
}
```

#### 2. 성능 최적화

파일 스캔을 캐싱하여 성능을 최적화합니다.

```javascript
class StepCache {
  private cache = new Map()

  get(directory) {
    if (!this.cache.has(directory)) {
      this.cache.set(directory, this.scan(directory))
    }
    return this.cache.get(directory)
  }

  invalidate(directory) {
    this.cache.delete(directory)
  }
}
```

---

### Feature Debug Mode 🐛

**환경 변수로 제어되는 상세한 디버깅 출력**

개발 중 Feature Step의 실행 흐름과 Context 변화를 시각적으로 추적할 수 있는 Debug Mode를 기본 제공합니다.

#### 활성화 방법

Debug Mode는 **기본적으로 비활성화**되어 있으며, 필요시 활성화할 수 있습니다.

```bash
# Debug Mode 활성화
FEATURE_DEBUG=true node server.js

# 또는 .env 파일에 추가
FEATURE_DEBUG=true
```

#### 기능

1. **Step별 상세 정보**
   - Step 실행 전 Input (context 상태)
   - Step 실행 후 Context 변화
   - 실행 시간 (ms)
   - 성공/실패 표시 (✓/✗)

2. **트리 형식 출력**
   - 보기 좋은 트리 구조 (├─, └─)
   - Step 번호와 이름 표시
   - 각 Step의 Input/Output 정보

3. **Summary 통계**
   - 전체 실행 시간
   - 성공/실패 Step 수
   - 최종 상태 (Success/Failed)

#### 기본 모드 vs Debug Mode

**기본 모드** (FEATURE_DEBUG 없음):
```
[AutoExecutor] [POST /api/orders] Executing 3 steps...
[AutoExecutor] [POST /api/orders] Executing step 100: 100-validate-order.js
[AutoExecutor] [POST /api/orders] Step 100 completed in 2ms
[AutoExecutor] [POST /api/orders] Executing step 200: 200-check-inventory.js
[AutoExecutor] [POST /api/orders] Step 200 completed in 15ms
[AutoExecutor] [POST /api/orders] Executing step 300: 300-create-order.js
[AutoExecutor] [POST /api/orders] Step 300 completed in 8ms
[AutoExecutor] [POST /api/orders] All 3 steps executed successfully
```

**Debug Mode** (FEATURE_DEBUG=true):
```
[Feature] POST /api/orders
  [Step 100] validate-order (2ms) ✓
    ├─ Input: {"userId":1,"orderData":{"items":[{"id":1,"qty":2}]}}
    └─ Context: {"validation":{"isValid":true,"itemCount":1}}

  [Step 200] check-inventory (15ms) ✓
    ├─ Input: {"userId":1,"orderData":{"items":[{"id":1,"qty":2}]}}
    └─ Context: {"inventory":{"available":true,"stock":50}}

  [Step 300] create-order (8ms) ✓
    ├─ Input: {"userId":1,"orderData":{"items":[{"id":1,"qty":2}]}}
    └─ Context: {"order":{"orderId":"12345","status":"created"}}

  [Summary]
    Total: 25ms
    Steps: 3/3 passed
    Status: ✓ Success
```

#### 에러 발생 시 출력

**Debug Mode에서 에러**:
```
[Feature] POST /api/orders
  [Step 100] validate-order (2ms) ✓
    ├─ Input: {"userId":1,"orderData":{"items":[]}}
    └─ Context: {"validation":{"isValid":false}}

  [Step 200] check-inventory (1ms) ✗
    ├─ Input: {"userId":1,"orderData":{"items":[]}}
    └─ Error: No items in order

  [Summary]
    Total: 3ms
    Steps: 1/2 passed
    Status: ✗ Failed
    Error: No items in order
```

#### Context 추적

Debug Mode는 각 Step 실행 전후의 Context 상태를 스냅샷으로 저장하고, 변화만 표시합니다.

**Input**: Step 실행 전의 context 상태 (results 제외)
```javascript
{
  userId: 1,
  orderData: { items: [...] }
}
```

**Context (변화)**: Step 실행 후 ctx에 추가된 데이터만 표시
```javascript
{
  validation: { isValid: true, itemCount: 1 }
}
```

#### 사용 예시

```javascript
// features/create-order/index.js
const numflow = require('numflow')

module.exports = numflow.feature({
  method: 'POST',
  path: '/api/orders',
  steps: './steps',

  contextInitializer: (ctx, req, res) => {
    ctx.userId = req.user?.id
    ctx.orderData = req.body
  },

  onError: async (error, context, req, res) => {
    console.error('Order creation failed:', error)
    res.status(500).json({ error: error.message })
  }
})
```

```javascript
// features/create-order/steps/100-validate-order.js
module.exports = async function(context) {
  const { orderData } = context

  if (!orderData.items || orderData.items.length === 0) {
    throw new Error('No items in order')
  }

  // context에 추가 (Debug Mode에서 표시됨)
  ctx.validation = {
    isValid: true,
    itemCount: orderData.items.length
  }

  // 끝! 자동으로 다음 Step 진행
}
```

#### 로그 제어

```bash
# 모든 로그 비활성화 (테스트 모드)
NODE_ENV=test node server.js

# Feature 로그만 비활성화
DISABLE_FEATURE_LOGS=true node server.js

# Debug Mode 활성화 (상세 로그)
FEATURE_DEBUG=true node server.js
```

#### 장점

1. **시각적 디버깅**: Step 실행 흐름을 한눈에 파악
2. **Context 추적**: 각 Step이 Context를 어떻게 변경하는지 확인
3. **성능 분석**: 각 Step의 실행 시간 측정
4. **에러 추적**: 어느 Step에서 에러가 발생했는지 명확히 파악
5. **개발 생산성**: 디버깅 시간 단축

#### 주의사항

1. **프로덕션 환경**: Debug Mode는 성능에 영향을 줄 수 있으므로 프로덕션에서는 비활성화 권장
2. **민감한 데이터**: Context에 민감한 정보가 포함된 경우 로그에 노출될 수 있으므로 주의
3. **대용량 데이터**: Context가 매우 큰 경우 로그가 잘릴 수 있음 (기본 60자 제한)

---

**마지막 업데이트**: 2025-10-21

**핵심 차별화**:
- Radix Tree Router (10-100배 빠른 라우팅)
- Auto-orchestration (숫자 기반 자동 실행)
- 데이터베이스 독립적 에러 처리 (사용자 제어)
- 중복 라우트 자동 검증 (서버 시작 시)
- JavaScript 완전 지원 (TypeScript는 선택사항)
