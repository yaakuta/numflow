# Feature-First Auto-Orchestration ⭐

Numflow의 핵심 차별화 기능으로, **폴더 구조만으로** 복잡한 비즈니스 로직을 자동 실행합니다.

## 목차

- [빠른 시작 - Convention over Configuration](#빠른-시작---convention-over-configuration)
- [암묵적 Feature vs 명시적 Feature](#암묵적-feature-vs-명시적-feature)
  - [암묵적 Feature (Implicit Feature)](#암묵적-feature-implicit-feature--권장)
  - [명시적 Feature (Explicit Feature)](#명시적-feature-explicit-feature)
- [Convention over Configuration 규칙](#convention-over-configuration-규칙)
  - [HTTP Method 자동 추론](#http-method-자동-추론)
  - [Path 자동 추론](#path-자동-추론)
  - [Dynamic Route - [파라미터명] 표기](#dynamic-route---파라미터명-표기)
  - [Steps/AsyncTasks 자동 인식](#stepsasynctasks-자동-인식)
- [Step 함수 작성](#step-함수-작성)
- [조기 Response 처리 (Early Response)](#조기-response-처리-early-response)
- [Context 객체](#context-객체)
- [비동기 작업](#비동기-작업)
- [Feature 등록 방법](#feature-등록-방법)
  - [Feature 등록 - app.registerFeatures()](#feature-등록---appregisterfeatures)
- [다중 Features 디렉토리 등록](#다중-features-디렉토리-등록)
- [라우트 충돌 감지 및 처리](#라우트-충돌-감지-및-처리)
- [고급 설정 - Convention 덮어쓰기](#고급-설정---convention-덮어쓰기)
  - [numflow.feature(options)](#numflowfeatureoptions)
- [옵션 상세 설명](#옵션-상세-설명)
  - [method](#method)
  - [path](#path)
  - [middlewares](#middlewares)
  - [steps](#steps)
  - [asyncTasks](#asynctasks)
  - [onError](#onerror)
  - [에러 재시도 (Retry)](#에러-재시도-retry-)
  - [validation](#validation)
  - [contextInitializer](#contextinitializer)
- [일반적인 패턴 (Common Patterns)](#일반적인-패턴-common-patterns)
  - [트랜잭션 관리](#트랜잭션-관리)
  - [로깅 및 모니터링](#로깅-및-모니터링)
  - [인증 및 권한 부여](#인증-및-권한-부여)
  - [리소스 정리 (Cleanup)](#리소스-정리-cleanup)
  - [Rate Limiting](#rate-limiting)
  - [입력 검증 (Input Validation)](#입력-검증-input-validation)
  - [캐싱 (Caching)](#캐싱-caching)
  - [요약](#요약)
- [완전한 예제](#완전한-예제)
- [디버깅 및 로그 제어](#디버깅-및-로그-제어)
  - [AutoExecutor 로그](#autoexecutor-로그)
  - [로그 비활성화](#로그-비활성화)
- [디버그 모드 (Debug Mode)](#디버그-모드-debug-mode)
- [장점](#장점)

---

## 빠른 시작 - Convention over Configuration

### 1. 폴더 구조 만들기 (index.js 없이!)

```
features/
└── api/
    └── v1/
        └── orders/
            └── @post/                   # POST /api/v1/orders
                └── steps/              # ← index.js 없음! 자동 발견!
                    ├── 100-validate.js
                    ├── 200-create.js
                    └── 300-notify.js
```

**암묵적 Feature**: `@method` 폴더 + `steps/` 폴더만 있으면 자동으로 Feature가 생성됩니다!

### 2. Step 파일 작성

```javascript
// features/api/v1/orders/@post/steps/100-validate.js
async function validate(ctx, req, res) {
  if (!ctx.orderData) {
    throw new Error('주문 데이터가 없습니다')
  }
  ctx.validation = { isValid: true }
}
module.exports = validate

// features/api/v1/orders/@post/steps/200-create.js
async function create(ctx, req, res) {
  const order = await db.orders.create(ctx.orderData)
  ctx.order = order
}
module.exports = create
```

### 3. 앱에서 자동 등록

```javascript
// app.js
const numflow = require('numflow')
const app = numflow()

// 모든 Feature 등록! 🎉
app.registerFeatures('./features')

// app.listen()은 Feature 등록 완료를 자동으로 대기한 후 서버 시작
app.listen(3000, () => {
  console.log('Server running on port 3000')
})
```

**끝!** 🎉 수백 개의 API도 폴더만 만들면 자동 등록됩니다.

---

## 암묵적 Feature vs 명시적 Feature

Numflow는 두 가지 방식으로 Feature를 정의할 수 있습니다.

### 암묵적 Feature (Implicit Feature) ⭐ 권장

**index.js 없이** `@method` 폴더와 `steps/` 폴더만으로 Feature를 정의합니다.

```
features/todos/
└── @get/                    # GET /todos
    └── steps/               # ← index.js 없음!
        ├── 100-list.js
        └── 200-response.js
```

**자동 추론**:
- HTTP Method: `@get` → GET
- API Path: `/todos`
- Steps: `./steps` 디렉토리
- Async Tasks: `./async-tasks` 디렉토리 (있는 경우)

**사용 케이스**:
- 간단한 CRUD API
- 특별한 설정이 필요 없는 경우
- contextInitializer, onError 등이 필요 없는 경우

### 명시적 Feature (Explicit Feature)

**index.js 파일로** 추가 설정을 제공합니다.

```
features/api/orders/
└── @post/                   # POST /api/orders
    ├── index.js             # ← 추가 설정
    └── steps/
        └── 100-create.js
```

```javascript
// features/api/orders/@post/index.js
const numflow = require('numflow')

module.exports = numflow.feature({
  // Convention은 여전히 자동 추론됨!
  // method: 'POST' ← '@post'에서 추론
  // path: '/api/orders' ← 폴더 구조에서 추론
  // steps: './steps' ← 자동 인식

  // 필요한 설정만 추가
  contextInitializer: (ctx, req, res) => {
    ctx.userId = req.user?.id
  },

  onError: async (error, ctx, req, res) => {
    // 커스텀 에러 처리
  }
})
```

**사용 케이스**:
- contextInitializer 필요
- 커스텀 onError 핸들러 필요
- Feature별 미들웨어 필요

---

## Convention over Configuration 규칙

### HTTP Method 자동 추론

폴더명이 HTTP Method가 됩니다.

```
features/
├── api/
│   └── users/
│       ├── get/          → GET /api/users
│       ├── post/         → POST /api/users
│       └── [id]/
│           ├── get/      → GET /api/users/:id
│           ├── put/      → PUT /api/users/:id
│           └── @delete/   → DELETE /api/users/:id
```

**지원 메서드**: `get`, `post`, `put`, `patch`, `delete`

### Path 자동 추론

폴더 구조가 그대로 API Path가 됩니다.

| 폴더 경로 | API Path |
|----------|----------|
| `features/api/v1/orders/@post` | `/api/v1/orders` |
| `features/users/@get` | `/users` |
| `features/api/posts/[id]/@get` | `/api/posts/:id` |

### Dynamic Route - `[파라미터명]` 표기

대괄호로 감싼 폴더명은 라우트 파라미터가 됩니다.

```
features/
└── api/
    └── users/
        └── [userId]/
            └── posts/
                └── [postId]/
                    └── @get/
```

→ `GET /api/users/:userId/posts/:postId`

### Steps/AsyncTasks 자동 인식

각 Feature 디렉토리에 `steps/` 또는 `async-tasks/` 폴더가 있으면 자동 인식됩니다.

```
features/api/orders/@post/
├── index.js
├── steps/              # 자동 인식!
│   ├── 100-validate.js
│   ├── 200-create.js
│   └── 300-process.js
└── async-tasks/        # 자동 인식!
    ├── send-email.js
    └── send-sms.js
```

---

## Step 함수 작성

모든 step 함수는 다음 형태를 따릅니다.

**JavaScript:**
```javascript
// features/create-order/steps/100-validate-order.js

/**
 * @param {import('numflow').Context} context - 순수 비즈니스 데이터 저장소
 * @param {import('http').IncomingMessage} req - HTTP Request 객체
 * @param {import('http').ServerResponse} res - HTTP Response 객체
 */
async function validateOrder(ctx, req, res) {
  // 1. 입력 데이터 접근 (req에서 직접 접근)
  const orderData = req.body

  // 2. 검증 로직
  if (!orderData.items || orderData.items.length === 0) {
    res.status(400).json({ error: '주문 상품이 없습니다' })
    return  // void - 에러 응답 전송
  }

  // 3. 결과 저장 (명시적으로 context에 저장)
  ctx.validation = {
    isValid: true,
    validatedAt: new Date(),
  }

  // 끝! 자동으로 다음 Step 진행
}

module.exports = validateOrder
```

**TypeScript:**
```typescript
// features/create-order/steps/100-validate-order.ts
import { Context } from 'numflow'
import { IncomingMessage, ServerResponse } from 'http'

async function validateOrder(
  ctx: Context,
  req: IncomingMessage,
  res: ServerResponse
): Promise<boolean | void> {
  const orderData = req.body

  if (!orderData.items || orderData.items.length === 0) {
    res.status(400).json({ error: '주문 상품이 없습니다' })
    return  // void
  }

  // 명시적으로 context에 저장
  ctx.validation = {
    isValid: true,
    validatedAt: new Date(),
  }

  // 끝! 자동으로 다음 Step 진행
}

export default validateOrder
```

**파일명 규칙:**
- 숫자로 시작: `100-`, `200-`, `300-`
- 하이픈 필수: `-`
- .js 확장자: `.js`
- 정규식: `/^\d+-.*\.js$/`

**정렬 방식:**
- 숫자 크기로 정렬 (순차적 아님!)
- 100, 200, 300 → 100, 150, 200, 300 (중간 삽입 가능)

---

## 조기 Response 처리 (Early Response)

중간 Step에서 HTTP 응답을 보내면 나머지 Steps는 자동으로 건너뜁니다.

### 메커니즘

```typescript
// 내부 동작 (src/feature/auto-executor.ts:108-112)
await step.fn(context, req, res)

if (res.headersSent) {
  return context  // 정상 종료로 간주
}
```

각 Step 실행 후 `res.headersSent` 플래그를 체크하여 응답 전송 여부를 자동 감지합니다.

### Async-tasks 실행 규칙

| 응답 상태 | 나머지 Steps | Async-tasks |
|----------|-------------|-------------|
| **200 OK** (조기) | ❌ 건너뜀 | ✅ **실행됨** |
| **4xx/5xx** (조기) | ❌ 건너뜀 | ❌ 실행 안 됨 |
| **throw Error** | ❌ 건너뜀 | ❌ 실행 안 됨 |

**핵심**: 조기 정상 응답(200 OK)은 "정상 종료"로 간주되어 Async-tasks가 실행됩니다.

### 예제

```javascript
// steps/100-check-cache.js
module.exports = async (ctx, req, res) => {
  const cached = await cache.get(key)

  if (cached) {
    res.json(cached)  // 200 OK → Steps 200, 300 건너뜀 → Async-tasks 실행됨 ✅
    return  // ⚠️ return 필수!
  }

  // 캐시 미스 → 다음 Step 진행
}
```

```javascript
// steps/100-validate.js
module.exports = async (ctx, req, res) => {
  if (!req.body.userId) {
    res.status(400).json({ error: 'Invalid' })  // 400 → Async-tasks 실행 안 됨 ❌
    return  // ⚠️ return 필수!
  }

  // 검증 통과 → 다음 Step 진행
}
```

**주의**: `res.json()` 호출 후 반드시 `return`을 명시해야 합니다. `return` 없이 함수가 계속 실행되면 의도치 않은 동작이 발생할 수 있습니다.

### 참고 문서

- [Feature-First: 조기 Response 처리](../getting-started/feature-first.md#조기-response-처리-early-response) - 상세 가이드 및 Best Practices
- [AsyncTasks: 실행 조건](../getting-started/async-tasks.md#asynctask-실행-조건-중요) - Async-tasks 실행 조건 상세

---

## Context 객체

모든 step이 공유하는 순수 비즈니스 데이터 저장소입니다.

Context에서 `req`, `res`가 제거되어 순수 비즈니스 데이터만 포함합니다. HTTP 계층(`req`, `res`)은 Step 함수의 별도 파라미터로 전달됩니다.

```javascript
const context = {
  // 순수 비즈니스 데이터만 포함
  userId: 1,
  orderData: { /* ... */ },
  validated: true,
  validation: { /* ... */ },
  inventory: { /* ... */ },
  // 사용자가 저장한 모든 필드들...
}

// Step 함수 시그니처
module.exports = async (ctx, req, res) => {
  // ctx: 순수 비즈니스 데이터
  // req: HTTP Request 객체
  // res: HTTP Response 객체
}
```

---

## 비동기 작업

비동기 작업은 Step 실행 완료 후 자동으로 큐에 추가됩니다.

AsyncTask 함수는 Context만 받습니다 (req, res 없음). Context에서 필요한 데이터를 직접 읽으세요.

**JavaScript:**
```javascript
// features/create-order/async-tasks/send-email.js

/**
 * @param {import('numflow').Context} context - 순수 비즈니스 데이터
 */
async function sendEmail(context) {
  // Context에서 직접 데이터 읽기 (root level)
  const { userId, order } = context

  // 이메일 발송 로직
  await emailService.send({
    to: order.userEmail,
    subject: `주문 확인 (${order.id})`,
    template: 'order-confirmation',
    data: order,
  })

  // AsyncTask는 반환값 무시됨 (저장되지 않음)
}

module.exports = sendEmail
```

---

## Feature 등록 방법

### Feature 등록 - app.registerFeatures()

features 디렉토리의 모든 Feature를 재귀적으로 스캔하여 자동으로 등록합니다.

**기본 사용법:**
```javascript
const numflow = require('numflow')
const app = numflow()

// features 디렉토리의 모든 Feature를 재귀적으로 스캔하고 등록
app.registerFeatures('./features')

// app.listen()은 Feature 등록 완료를 자동으로 대기한 후 서버 시작
app.listen(3000, () => {
  console.log('Server running on port 3000')
})
```

**폴더 구조 예시:**
```
features/
└── api/
    └── v1/
        ├── orders/
        │   ├── post/                   # POST /api/v1/orders
        │   │   ├── index.js
        │   │   └── steps/
        │   │       ├── 100-validate.js
        │   │       └── 200-create.js
        │   └── [id]/
        │       └── @get/                # GET /api/v1/orders/:id
        │           └── index.js
        └── users/
            └── @get/                    # GET /api/v1/users
                └── index.js
```

**옵션:**
```javascript
app.registerFeatures('./features', {
  indexPatterns: ['index.js', 'feature.js'],  // 스캔할 파일명 패턴
  excludeDirs: ['__tests__', 'utils'],        // 제외할 디렉토리
  debug: true,                                 // 디버그 로그 활성화
})

app.listen(3000)
```

**장점:**
- ✅ 수백 개의 Feature도 한 줄로 등록 가능
- ✅ 폴더 구조만으로 API 구조 파악 가능
- ✅ 각 Feature가 독립적인 디렉토리에 격리
- ✅ 확장성 및 유지보수성 향상

**예제:** [05-bulk-registration](../../examples/07-feature-first/05-bulk-registration/)

---

## 다중 Features 디렉토리 등록

`app.registerFeatures()`는 여러 번 호출하여 다양한 디렉토리에서 Features를 등록할 수 있습니다.

### 기본 사용법

```javascript
const numflow = require('numflow')
const app = numflow()

// 여러 디렉토리에서 Features 등록
app.registerFeatures('./features-public')   // 공개 API
app.registerFeatures('./features-admin')    // 관리자 API
app.registerFeatures('./features-internal') // 내부 API

app.listen(3000)
```

### 디렉토리 이름 자유롭게 사용 가능

Features 디렉토리 이름은 **'features'로 고정되지 않습니다**. 어떤 이름이든 사용 가능합니다:

```javascript
// ✅ 모두 지원됩니다
app.registerFeatures('./features')
app.registerFeatures('./features-dir')
app.registerFeatures('./api')
app.registerFeatures('./my-api')
app.registerFeatures('./backend-features')
```

**경로 추론 방식:**

등록한 디렉토리가 base directory가 되어 하위 경로를 추론합니다.

```
features-public/
└── api/
    └── users/
        └── @get/  → GET /api/users

features-admin/
└── api/
    └── users/
        └── @delete/  → DELETE /api/users
```

### 사용 예시 1: API 버전별 분리

```javascript
app.registerFeatures('./features-v1')  // v1 API
app.registerFeatures('./features-v2')  // v2 API
```

```
features-v1/
└── api/
    └── users/
        └── @get/  → GET /api/users (v1)

features-v2/
└── api/
    └── users/
        └── @get/  → GET /api/users (v2)
```

⚠️ **주의**: 같은 method + path 조합은 충돌합니다! (아래 "라우트 충돌 감지" 참조)

### 사용 예시 2: 접근 권한별 분리

```javascript
// 공개 API
app.registerFeatures('./features/public')

// 인증 필요 API
app.registerFeatures('./features/authenticated')

// 관리자 전용 API
app.registerFeatures('./features/admin')
```

### 사용 예시 3: 도메인별 분리

```javascript
// 사용자 관리
app.registerFeatures('./features/users')

// 주문 관리
app.registerFeatures('./features/orders')

// 결제 관리
app.registerFeatures('./features/payments')
```

### 장점

1. **모듈화**: 기능별로 디렉토리를 분리하여 관리 용이
2. **팀 협업**: 팀별로 독립적인 디렉토리에서 작업 가능
3. **점진적 마이그레이션**: 기존 코드를 단계적으로 Feature-First로 전환
4. **명확한 구조**: 디렉토리 이름으로 API 용도를 명확히 표현

---

## 라우트 충돌 감지 및 처리

Numflow는 **Fail-Fast 원칙**을 따라 라우트 충돌을 즉시 감지하고 프로그램을 종료합니다.

### 충돌 발생 조건

**같은 HTTP method + 같은 path** 조합이 중복 등록되면 충돌이 발생합니다.

```javascript
// ❌ 에러 발생!
app.registerFeatures('./features-dir1')
// features-dir1/api/user/@get → GET /api/user

app.registerFeatures('./features-dir2')
// features-dir2/api/user/@get → GET /api/user (충돌!)

app.listen(3000)
// Error: Feature already registered: GET:/api/user
// 프로그램 종료 (process.exit(1))
```

### 충돌 감지 메커니즘

1. **고유 키 생성**: `${method}:${path}` 형태로 각 라우트의 고유 키 생성
2. **중복 체크**: 이미 등록된 키인지 확인
3. **즉시 에러**: 중복 감지 시 에러 throw
4. **Fail-Fast**: `app.listen()` 시점에 프로그램 종료

```typescript
// 내부 동작 (참고용)
const key = `${method}:${path}`  // 예: "GET:/api/user"

if (this.features.has(key)) {
  throw new Error(`Feature already registered: ${key}`)
}
```

### 에러 메시지

```
Failed to register feature from api/user/@get:
  Error: Feature already registered: GET:/api/user

Failed to register features:
  Error: Feature already registered: GET:/api/user

[프로그램 종료: exit code 1]
```

### 올바른 사용 방법

#### ✅ 방법 1: 서로 다른 경로 사용

```javascript
app.registerFeatures('./features-dir1')
// features-dir1/api/users/@get → GET /api/users

app.registerFeatures('./features-dir2')
// features-dir2/api/products/@get → GET /api/products

app.listen(3000)  // ✅ 성공
```

#### ✅ 방법 2: 같은 경로, 다른 메서드

```javascript
app.registerFeatures('./features-dir1')
// features-dir1/api/user/@get → GET /api/user

app.registerFeatures('./features-dir2')
// features-dir2/api/user/@post → POST /api/user

app.listen(3000)  // ✅ 성공
```

#### ✅ 방법 3: 네임스페이스/버전 추가

```javascript
app.registerFeatures('./features-v1')
// features-v1/api/user/@get → GET /api/user

app.registerFeatures('./features-v2')
// features-v2/v2/api/user/@get → GET /v2/api/user

app.listen(3000)  // ✅ 성공
```

### 왜 Fail-Fast인가?

Numflow는 안전성을 최우선으로 합니다:

| 측면 | 설명 |
|------|------|
| **조기 발견** | 개발 단계에서 설정 오류를 즉시 발견 |
| **예측 가능성** | 나중 등록으로 덮어쓰기 방지 (예측 불가능한 동작 방지) |
| **디버깅 용이** | 명확한 에러 메시지로 문제 원인 즉시 파악 |
| **안전한 배포** | 잘못된 설정으로 서버가 시작되는 것을 원천 차단 |

### 라우트 고유성 확인

각 라우트는 고유한 `method:path` 조합을 가져야 합니다:

```javascript
// ✅ 허용되는 조합
'GET:/api/user'     // GET /api/user
'POST:/api/user'    // POST /api/user (method 다름)
'GET:/api/users'    // GET /api/users (path 다름)
'GET:/v2/api/user'  // GET /v2/api/user (path 다름)

// ❌ 중복 (에러!)
'GET:/api/user'     // GET /api/user (첫 번째 등록)
'GET:/api/user'     // GET /api/user (중복! 에러 발생)
```

### 충돌 해결 방법

라우트 충돌 에러가 발생하면:

**1단계: 에러 메시지 확인**
```
Error: Feature already registered: GET:/api/user
```
→ `GET /api/user` 라우트가 중복 등록되었음

**2단계: 충돌하는 경로 찾기**
```bash
# 충돌하는 feature 검색
find features-dir1 -path "*api/user/@get"
find features-dir2 -path "*api/user/@get"
```

**3단계: 해결 방법 선택**
- 경로 변경: `api/user-v2/@get`
- 네임스페이스 추가: `v2/api/user/@get`
- 하나만 사용: 중복 feature 제거

---

## 고급 설정 - Convention 덮어쓰기

Convention으로 자동 추론되는 값을 수동으로 덮어쓸 수 있습니다.

### numflow.feature(options)

Feature를 정의하고 자동으로 실행 흐름을 관리합니다.

**JavaScript (CommonJS):**
```javascript
// features/create-order/index.js
const numflow = require('numflow')

module.exports = numflow.feature({
  // Convention 덮어쓰기 (선택)
  method: 'POST',                // 폴더명 대신 명시적 지정
  path: '/api/orders',           // 폴더 구조 대신 명시적 지정

  // Auto-orchestration
  steps: './steps',              // 100, 200, 300... 자동 실행
  asyncTasks: './async-tasks',   // 비동기 작업 자동 큐잉

  // 에러 핸들러 (사용자 정의 트랜잭션 로직 구현 가능)
  onError: async (error, context, req, res) => {
    // PostgreSQL 예제
    // await context.dbClient.query('ROLLBACK')

    // MongoDB 예제
    // await context.session.abortTransaction()

    res.statusCode = 500
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: error.message }))
  },
})
```

**JavaScript (ESM):**
```javascript
import numflow from 'numflow'

export default numflow.feature({
  method: 'POST',
  path: '/api/orders',
  steps: './steps',
  onError: async (error, context, req, res) => {
    // 사용자 정의 에러 처리
    console.error('Feature error:', error)
    res.statusCode = 500
    res.end(JSON.stringify({ error: error.message }))
  },
})
```

**TypeScript:**
```typescript
import numflow from 'numflow'
import type { FeatureConfig, Context } from 'numflow'

interface OrderContext extends Context {
  orderData: OrderData
  results: {
    validation?: ValidationResult
    inventory?: InventoryResult
    // ...
  }
}

export default numflow.feature<OrderContext>({
  method: 'POST',
  path: '/api/orders',
  steps: './steps',
  onError: async (error, context, req, res) => {
    // 타입 안전한 에러 처리
    console.error('Order creation failed:', error)
    res.statusCode = 500
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: error.message }))
  },
})
```

---

## 옵션 상세 설명

### method

HTTP 메서드를 지정합니다.

```javascript
method: 'POST'  // 'GET', 'POST', 'PUT', 'DELETE', 'PATCH'
```

### path

라우트 경로를 지정합니다.

```javascript
path: '/api/orders'
path: '/api/orders/:id'
```

### middlewares

Feature-level 미들웨어 배열을 지정합니다.

```javascript
middlewares: [authenticate, authorize]  // contextInitializer 실행 전에 실행됨
```

**실행 순서:**
```
1. Global middlewares (app.use()로 등록된 미들웨어)
2. Feature middlewares (이 옵션)
3. contextInitializer
4. Steps
```

**예제:**
```javascript
// features/create-order/index.js
const numflow = require('numflow')
const { authenticate, authorize } = require('../../middlewares/auth')

module.exports = numflow.feature({
  // 인증 및 권한 검증
  middlewares: [authenticate, authorize('admin')],

  // 인증된 사용자 정보를 context에 추가
  contextInitializer: (ctx, req, res) => {
    ctx.userId = req.user.id
    ctx.userRole = req.user.role
    ctx.orderData = req.body
  },

  steps: './steps',
})
```

**미들웨어 함수 형태:**
```javascript
// middlewares/auth.js
function authenticate(req, res, next) {
  const token = req.headers.authorization

  if (!token) {
    res.statusCode = 401
    res.end(JSON.stringify({ error: 'Unauthorized' }))
    return
  }

  try {
    req.user = verifyToken(token)
    next()
  } catch (error) {
    res.statusCode = 401
    res.end(JSON.stringify({ error: 'Invalid token' }))
  }
}

function authorize(role) {
  return (req, res, next) => {
    if (req.user.role !== role) {
      res.statusCode = 403
      res.end(JSON.stringify({ error: 'Forbidden' }))
      return
    }
    next()
  }
}

module.exports = { authenticate, authorize }
```

### steps

Step 폴더 경로를 지정합니다. 상대 경로로 지정합니다.

**Convention over Configuration:**
- `steps` 옵션을 생략하면 `'./steps'` 디렉토리를 자동으로 인식합니다.
- 명시적으로 지정하려면 `steps: './steps'` 사용

**폴더 경로 지정:**
```javascript
steps: './steps'  // 또는 생략 (자동 인식)
```

**파일 구조:**
```
features/create-order/
├── index.js
└── steps/                      ← 자동 인식!
    ├── 100-validate-order.js   ← 순서대로 실행
    ├── 200-check-inventory.js
    ├── 300-reserve-stock.js
    └── 400-process-payment.js
```

**파일명 규칙:**
- 숫자로 시작: `100-`, `200-`, `300-`
- 하이픈 필수: `-`
- 숫자 크기순으로 자동 정렬

### asyncTasks

비동기 작업 폴더 경로를 지정합니다. Step 실행 완료 후 자동으로 큐에 추가됩니다.

**Convention over Configuration:**
- `asyncTasks` 옵션을 생략하면 `'./async-tasks'` 디렉토리를 자동으로 인식합니다.
- 명시적으로 지정하려면 `asyncTasks: './async-tasks'` 사용

**폴더 경로 지정:**
```javascript
asyncTasks: './async-tasks'  // 또는 생략 (자동 인식)
```

**파일 구조:**
```
features/create-order/
├── index.js
├── steps/
└── async-tasks/               ← 자동 인식!
    ├── send-email.js          ← 비동기 실행
    ├── send-notification.js
    └── publish-analytics.js
```

**AsyncTask 함수 형태:**
```javascript
// async-tasks/send-email.js
module.exports = async (ctx) => {
  // Context만 받음 (req, res 없음)
  await emailService.send(ctx.order)
}
```

### onError

에러 발생 시 호출되는 사용자 정의 에러 핸들러입니다. 이를 통해 데이터베이스 트랜잭션 롤백 등 사용자가 원하는 방식으로 에러를 처리할 수 있습니다.

**함수 시그니처:**
```typescript
onError?: (
  error: Error,
  context: Context,
  req: IncomingMessage,
  res: ServerResponse
) => Promise<void> | void
```

**PostgreSQL 예제:**
```javascript
onError: async (error, context, req, res) => {
  // PostgreSQL 트랜잭션 롤백
  if (context.dbClient) {
    await context.dbClient.query('ROLLBACK')
  }

  res.statusCode = 500
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify({ error: error.message }))
}
```

**MongoDB 예제:**
```javascript
onError: async (error, context, req, res) => {
  // MongoDB 트랜잭션 롤백
  if (context.session) {
    await context.session.abortTransaction()
    await context.session.endSession()
  }

  res.statusCode = 500
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify({ error: error.message }))
}
```

**Prisma 예제:**
```javascript
onError: async (error, context, req, res) => {
  // Prisma는 자동으로 롤백되므로 에러 응답만 처리
  console.error('Feature error:', error)

  res.statusCode = 500
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify({ error: error.message }))
}
```

**참고**: onError 핸들러가 없으면 에러는 글로벌 에러 핸들러로 전달됩니다.

#### originalError 접근 ⭐

onError 핸들러에서 `error.originalError`를 통해 Step에서 throw된 원본 에러의 모든 커스텀 속성에 접근할 수 있습니다:

```javascript
const numflow = require('numflow')
const { BusinessError } = require('numflow')

module.exports = numflow.feature({
  onError: async (error, ctx, req, res) => {
    // ✅ BusinessError의 code 속성 접근
    if (error.originalError && error.originalError.code === 'OUT_OF_STOCK') {
      res.statusCode = 400
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({
        success: false,
        errorCode: error.originalError.code,
        message: 'Stock not available',
        step: error.step?.name
      }))
      return
    }

    // ✅ ValidationError의 validationErrors 속성 접근
    if (error.originalError && error.originalError.validationErrors) {
      res.statusCode = 400
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({
        success: false,
        errors: error.originalError.validationErrors
      }))
      return
    }

    // ✅ 커스텀 에러의 모든 속성 접근
    if (error.originalError && error.originalError.transactionId) {
      res.statusCode = 400
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({
        success: false,
        transactionId: error.originalError.transactionId,
        provider: error.originalError.provider,
        retryable: error.originalError.retryable
      }))
      return
    }

    // 기본 에러 응답
    res.statusCode = 500
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: error.message }))
  }
})
```

**핵심 장점:**
- ✅ Step에서 throw한 모든 커스텀 속성이 자동으로 보존됨
- ✅ `error.originalError`를 통해 접근 가능
- ✅ 에러 코드 기반 조건부 재시도 구현 가능
- ✅ 글로벌 에러 응답에도 자동으로 포함됨

**자세한 내용**: [에러 처리 가이드 - 커스텀 에러 처리](../getting-started/error-handling.md#커스텀-에러-처리와-originalerror-보존)

### 에러 재시도 (Retry) ⭐

onError 핸들러에서 `numflow.retry()`를 반환하면 Feature를 자동으로 재시도합니다.

**기본 사용법:**

```javascript
const numflow = require('numflow')

module.exports = numflow.feature({
  onError: async (error, ctx, req, res) => {
    // 즉시 재시도
    if (error.message.includes('rate_limit')) {
      ctx.fallbackProvider = 'openrouter'
      return numflow.retry()
    }

    // 1초 후 재시도
    if (error.message.includes('timeout')) {
      return numflow.retry({ delay: 1000 })
    }

    // 최대 3번까지 재시도
    if (error.message.includes('temporary_error')) {
      return numflow.retry({ maxAttempts: 3 })
    }

    // 재시도하지 않고 에러 응답
    res.status(500).json({ error: error.message })
  }
})
```

**성능:**
- `numflow.retry()` (옵션 없음): Symbol 반환, 초고속 (0.005µs)
- `numflow.retry({ delay: 1000 })`: 객체 반환, 초고속 (0.005µs)
- throw 방식보다 70배 빠름

**LLM Provider Fallback 예제:**

```javascript
// features/api/chat/post/index.js
const numflow = require('numflow')

module.exports = numflow.feature({
  contextInitializer: (ctx, req, res) => {
    ctx.currentProvider = 'openai'
    ctx.providers = ['openai', 'openrouter', 'gemini']
  },

  onError: async (error, ctx, req, res) => {
    const { providers, currentProvider } = ctx
    const currentIndex = providers.indexOf(currentProvider)
    const nextProvider = providers[currentIndex + 1]

    // Rate limit → 다음 Provider로 Fallback
    if (error.message.includes('rate_limit') && nextProvider) {
      console.log(`[Retry] Switching provider: ${currentProvider} → ${nextProvider}`)
      ctx.currentProvider = nextProvider
      return numflow.retry({ delay: 500 })
    }

    // 모든 Provider 실패
    res.status(503).json({ error: 'All LLM providers unavailable' })
  }
})
```

**Exponential Backoff 예제:**

```javascript
module.exports = numflow.feature({
  contextInitializer: (ctx, req, res) => {
    ctx.retryCount = 0
  },

  onError: async (error, ctx, req, res) => {
    // Timeout 에러만 재시도
    if (error.message.includes('timeout')) {
      ctx.retryCount++

      // 최대 3번까지 재시도
      if (ctx.retryCount <= 3) {
        // 1s, 2s, 4s (Exponential Backoff)
        const delay = 1000 * Math.pow(2, ctx.retryCount - 1)
        console.log(`[Retry] Attempt ${ctx.retryCount} after ${delay}ms`)
        return numflow.retry({ delay, maxAttempts: 3 })
      }
    }

    // 최대 재시도 횟수 초과 또는 다른 에러
    res.status(504).json({ error: 'Request timeout' })
  }
})
```

**옵션:**

| 옵션 | 타입 | 설명 | 예제 |
|------|------|------|------|
| `delay` | `number` | 재시도 전 대기 시간 (밀리초) | `{ delay: 1000 }` |
| `maxAttempts` | `number` | 최대 재시도 횟수 | `{ maxAttempts: 3 }` |

**주의사항:**
- 최대 전체 재시도 횟수: 10회 (무한 루프 방지)
- 재시도 시 전체 Step이 처음부터 다시 실행됨
- Context는 재시도 간 유지됨 (Provider fallback, retry count 등 저장 가능)

**TypeScript:**

```typescript
import numflow from 'numflow'
import type { Context } from 'numflow'

interface ChatContext extends Context {
  currentProvider: 'openai' | 'openrouter' | 'gemini'
  providers: string[]
  retryCount?: number
}

export default numflow.feature<ChatContext>({
  contextInitializer: (ctx, req, res) => {
    ctx.currentProvider = 'openai'
    ctx.providers = ['openai', 'openrouter', 'gemini']
  },

  onError: async (error, ctx, req, res) => {
    if (error.message.includes('rate_limit')) {
      const currentIndex = ctx.providers.indexOf(ctx.currentProvider)
      const nextProvider = ctx.providers[currentIndex + 1]

      if (nextProvider) {
        ctx.currentProvider = nextProvider as any
        return numflow.retry({ delay: 500 })
      }
    }

    res.status(503).json({ error: 'Service unavailable' })
  }
})
```

### validation

파일명 검증 옵션을 지정합니다.

```javascript
validation: {
  allowDuplicates: false,  // 중복 번호 허용 안 함 (기본값)
  requireHyphen: true,     // 하이픈 필수 (기본값)
}
```

### contextInitializer

HTTP 요청 데이터를 기반으로 Context 객체의 초기값을 설정합니다.

```javascript
contextInitializer: (ctx, req, res) => {
  ctx.userId = req.body.userId || 1
  ctx.orderData = req.body
}
```

**함수 시그니처:**
```typescript
contextInitializer?: (
  ctx: Context,
  req: IncomingMessage,
  res: ServerResponse
) => Promise<void> | void
```

**파라미터**: Context 객체를 받아서 직접 수정합니다

**예제:**
```javascript
// 인증 정보 추출
contextInitializer: (ctx, req, res) => {
  const token = req.headers.authorization
  const userId = validateToken(token)

  ctx.userId = userId
  ctx.userRole = getUserRole(userId)
}

// 비동기 초기화
contextInitializer: async (ctx, req, res) => {
  const user = await db.getUserFromToken(req.headers.authorization)

  ctx.user = user
  ctx.permissions = user.permissions
}
```

---

## 일반적인 패턴 (Common Patterns)

기존 라이프사이클 훅(contextInitializer, onError, middlewares)을 사용한 일반적인 사용 사례의 실용적인 해결 방법입니다.

### 트랜잭션 관리

`contextInitializer` + `onError` + 마지막 step을 사용하여 트랜잭션 라이프사이클을 관리합니다.

**PostgreSQL 예제:**
```javascript
const numflow = require('numflow')

module.exports = numflow.feature({
  // 트랜잭션 시작
  contextInitializer: async (ctx, req, res) => {
    ctx.dbClient = await db.connect()
    await ctx.dbClient.query('BEGIN')
    ctx.transactionStarted = true
  },

  onError: async (error, ctx, req, res) => {
    // 에러 시 롤백
    if (ctx.transactionStarted && ctx.dbClient) {
      await ctx.dbClient.query('ROLLBACK')
      await ctx.dbClient.release()
    }

    res.status(500).json({ error: error.message })
  }
})

// 마지막 step에서 커밋
// features/.../steps/900-respond.js
module.exports = async (ctx, req, res) => {
  // 트랜잭션 커밋
  if (ctx.transactionStarted && ctx.dbClient) {
    await ctx.dbClient.query('COMMIT')
    await ctx.dbClient.release()
  }

  res.json({ success: true, order: ctx.order })
}
```

**MongoDB 예제:**
```javascript
const numflow = require('numflow')

module.exports = numflow.feature({
  contextInitializer: async (ctx, req, res) => {
    ctx.session = await mongoose.startSession()
    ctx.session.startTransaction()
  },

  onError: async (error, ctx, req, res) => {
    // 에러 시 롤백
    if (ctx.session) {
      await ctx.session.abortTransaction()
      await ctx.session.endSession()
    }

    res.status(500).json({ error: error.message })
  }
})

// 마지막 step에서 커밋
// features/.../steps/900-respond.js
module.exports = async (ctx, req, res) => {
  // 트랜잭션 커밋
  if (ctx.session) {
    await ctx.session.commitTransaction()
    await ctx.session.endSession()
  }

  res.json({ success: true })
}
```

**핵심 포인트:**
- ✅ `contextInitializer`에서 트랜잭션 시작
- ✅ `onError`에서 롤백
- ✅ 마지막 step(예: `900-respond.js`)에서 커밋
- ✅ 모든 step이 트랜잭션 범위 내에서 실행됨

---

### 로깅 및 모니터링

요청/응답 로깅은 middlewares를 사용하고, 타이밍은 contextInitializer를 사용합니다.

**미들웨어를 사용한 요청 로깅:**
```javascript
const numflow = require('numflow')

// 로깅 미들웨어 생성
function requestLogger(req, res, next) {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`)
  next()
}

module.exports = numflow.feature({
  middlewares: [requestLogger],

  // ... 나머지 설정
})
```

**성능 모니터링:**
```javascript
const numflow = require('numflow')

module.exports = numflow.feature({
  contextInitializer: (ctx, req, res) => {
    // 타이머 시작
    ctx.startTime = Date.now()
    ctx.requestId = generateRequestId()
  }
})

// 마지막 step에서 소요 시간 로깅
// features/.../steps/900-respond.js
module.exports = async (ctx, req, res) => {
  const duration = Date.now() - ctx.startTime

  console.log({
    requestId: ctx.requestId,
    method: req.method,
    path: req.url,
    duration: `${duration}ms`,
    status: 200
  })

  res.json({ success: true })
}
```

**구조화된 로깅:**
```javascript
const numflow = require('numflow')
const logger = require('./logger') // Winston, Pino 등

module.exports = numflow.feature({
  contextInitializer: (ctx, req, res) => {
    ctx.logger = logger.child({
      requestId: generateRequestId(),
      userId: req.user?.id,
      path: req.url,
      method: req.method
    })

    ctx.logger.info('Request started')
  },

  onError: async (error, ctx, req, res) => {
    ctx.logger?.error('Request failed', { error: error.message })
    res.status(500).json({ error: error.message })
  }
})

// step에서 ctx.logger 사용
// features/.../steps/100-validate.js
module.exports = async (ctx, req, res) => {
  ctx.logger.info('Validating order')
  // ... 검증 로직
}
```

---

### 인증 및 권한 부여

인증은 middlewares를 사용하고, 사용자 데이터는 contextInitializer에서 처리합니다.

**기본 인증:**
```javascript
const numflow = require('numflow')

function authenticate(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '')

  if (!token) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  try {
    req.user = verifyToken(token)
    next()
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' })
  }
}

module.exports = numflow.feature({
  middlewares: [authenticate],

  contextInitializer: (ctx, req, res) => {
    // 미들웨어에서 이미 인증된 사용자
    ctx.userId = req.user.id
    ctx.userRole = req.user.role
    ctx.permissions = req.user.permissions
  }
})
```

**역할 기반 권한 부여:**
```javascript
const numflow = require('numflow')

function requireRole(role) {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      res.status(403).json({ error: 'Forbidden' })
      return
    }
    next()
  }
}

module.exports = numflow.feature({
  middlewares: [
    authenticate,
    requireRole('admin')
  ],

  contextInitializer: (ctx, req, res) => {
    ctx.adminId = req.user.id
  }
})
```

---

### 리소스 정리 (Cleanup)

에러 발생 시 정리 로직은 `onError`를 사용합니다.

**데이터베이스 연결 정리:**
```javascript
const numflow = require('numflow')

module.exports = numflow.feature({
  contextInitializer: async (ctx, req, res) => {
    ctx.dbConnection = await db.connect()
  },

  onError: async (error, ctx, req, res) => {
    // 항상 리소스 정리
    if (ctx.dbConnection) {
      await ctx.dbConnection.close()
    }

    res.status(500).json({ error: error.message })
  }
})

// 성공 시에도 마지막 step에서 정리
// features/.../steps/900-respond.js
module.exports = async (ctx, req, res) => {
  // 성공 후 정리
  if (ctx.dbConnection) {
    await ctx.dbConnection.close()
  }

  res.json({ success: true })
}
```

**파일 업로드 정리:**
```javascript
const numflow = require('numflow')
const fs = require('fs').promises

module.exports = numflow.feature({
  contextInitializer: async (ctx, req, res) => {
    ctx.tempFiles = []
  },

  onError: async (error, ctx, req, res) => {
    // 에러 시 임시 파일 삭제
    if (ctx.tempFiles && ctx.tempFiles.length > 0) {
      await Promise.all(
        ctx.tempFiles.map(file =>
          fs.unlink(file).catch(() => {})
        )
      )
    }

    res.status(500).json({ error: error.message })
  }
})
```

---

### Rate Limiting

Rate limiting은 middlewares를 사용합니다.

**간단한 Rate Limiter:**
```javascript
const numflow = require('numflow')
const rateLimit = require('express-rate-limit')

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 100, // IP당 15분에 100개 요청으로 제한
  message: 'Too many requests from this IP'
})

module.exports = numflow.feature({
  middlewares: [limiter],

  // ... 나머지 설정
})
```

---

### 입력 검증 (Input Validation)

첫 번째 step이나 contextInitializer에서 입력을 검증합니다.

**첫 번째 Step에서 검증:**
```javascript
// features/.../steps/100-validate.js
module.exports = async (ctx, req, res) => {
  const { email, password } = req.body

  const errors = []

  if (!email || !email.includes('@')) {
    errors.push('Invalid email')
  }

  if (!password || password.length < 8) {
    errors.push('Password must be at least 8 characters')
  }

  if (errors.length > 0) {
    res.status(400).json({ errors })
    return // 실행 중단
  }

  // 검증된 데이터 저장
  ctx.validatedInput = { email, password }
}
```

**검증 라이브러리 사용 (Joi, Zod 등):**
```javascript
const Joi = require('joi')

// features/.../steps/100-validate.js
const schema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  name: Joi.string().min(2).max(50)
})

module.exports = async (ctx, req, res) => {
  const { error, value } = schema.validate(req.body)

  if (error) {
    res.status(400).json({
      errors: error.details.map(d => d.message)
    })
    return
  }

  ctx.validatedInput = value
}
```

---

### 캐싱 (Caching)

초기 step에서 캐싱을 구현하여 불필요한 처리를 건너뜁니다.

**간단한 캐시 확인:**
```javascript
// features/.../steps/100-check-cache.js
const cache = require('./cache') // Redis, memory cache 등

module.exports = async (ctx, req, res) => {
  const cacheKey = `order:${req.params.id}`
  const cached = await cache.get(cacheKey)

  if (cached) {
    // 캐시 히트 - 응답 전송 및 나머지 step 건너뛰기
    res.json(JSON.parse(cached))
    return // 나머지 step 건너뜀, async task는 실행됨
  }

  // 캐시 미스 - 다음 step으로 진행
  ctx.cacheKey = cacheKey
}

// features/.../steps/200-fetch-data.js
module.exports = async (ctx, req, res) => {
  const order = await db.orders.findById(req.params.id)
  ctx.order = order
}

// features/.../steps/900-respond.js
module.exports = async (ctx, req, res) => {
  // 결과 캐싱
  await cache.set(ctx.cacheKey, JSON.stringify(ctx.order), { ttl: 300 })

  res.json(ctx.order)
}
```

---

### 요약

**모든 일반적인 패턴은 기존 메커니즘으로 해결 가능합니다:**

| 패턴 | 해결 방법 |
|------|----------|
| 트랜잭션 관리 | `contextInitializer` + `onError` + 마지막 step |
| 로깅 | Middlewares + `contextInitializer` |
| 인증/권한 부여 | Middlewares + `contextInitializer` |
| 리소스 정리 | `onError` + 마지막 step |
| Rate Limiting | Middlewares |
| 입력 검증 | 첫 번째 step (100-validate.js) |
| 캐싱 | 초기 step + 마지막 step |
| 성능 모니터링 | `contextInitializer` + 마지막 step |

**추가 라이프사이클 훅이 필요 없습니다!** ✅

---

## 완전한 예제

```javascript
// features/create-order/index.js
module.exports = numflow.feature({
  method: 'POST',
  path: '/api/orders',
  steps: './steps',
  asyncTasks: './async-tasks',
  onError: async (error, context, req, res) => {
    // 사용자 정의 에러 처리 (예: DB 롤백)
    console.error('Error in create-order:', error)
    res.statusCode = 500
    res.end(JSON.stringify({ error: error.message }))
  },
})

// features/create-order/steps/100-validate-order.js
async function validateOrder(ctx, req, res) {
  // 검증 로직
  const orderData = req.body
  ctx.validated = true  // 명시적 저장
  // 끝! 자동으로 다음 Step 진행
}
module.exports = validateOrder

// features/create-order/steps/200-check-inventory.js
async function checkInventory(ctx, req, res) {
  // 재고 확인 로직
  ctx.inventoryChecked = true  // 명시적 저장
  // 끝! 자동으로 다음 Step 진행
}
module.exports = checkInventory

// features/create-order/async-tasks/send-email.js
async function sendEmail(ctx) {
  // Context에서 직접 데이터 읽기
  const { userId, order } = ctx
  // 이메일 발송
  await emailService.send({
    to: order.userEmail,
    orderId: order.id,
  })
}
module.exports = sendEmail

// app.js
const numflow = require('numflow')
const app = numflow()

app.registerFeatures('./features')

app.listen(3000, () => {
  console.log('Server running on port 3000')
})
```

---

## 디버깅 및 로그 제어

### AutoExecutor 로그

Feature 실행 중 AutoExecutor는 각 step의 실행 상태를 자동으로 로깅합니다.

**로그 포맷:**
```
[AutoExecutor] [METHOD /path] message
```

**로그 예시:**
```
[AutoExecutor] [POST /api/orders] Executing 3 steps...
[AutoExecutor] [POST /api/orders] Executing step 100: 100-validate.js
[AutoExecutor] [POST /api/orders] Step 100 completed in 2ms
[AutoExecutor] [POST /api/orders] Executing step 200: 200-create.js
[AutoExecutor] [POST /api/orders] Step 200 completed in 15ms
[AutoExecutor] [POST /api/orders] Executing step 300: 300-notify.js
[AutoExecutor] [POST /api/orders] Step 300 completed in 5ms
[AutoExecutor] [POST /api/orders] All 3 steps executed successfully
```

**에러 로그 예시:**
```
[AutoExecutor] [POST /api/orders] Executing 3 steps...
[AutoExecutor] [POST /api/orders] Executing step 100: 100-validate.js
[AutoExecutor] [POST /api/orders] ERROR: Step 100 failed: 주문 상품이 없습니다
```

### 로그 제어

Feature 로그는 환경에 따라 자동으로 제어되며, 필요시 수동으로 켜거나 끌 수 있습니다.

#### 로그 출력 규칙

**간단한 3가지 규칙:**

1. ❌ **Test 환경**: 항상 로그 OFF (깔끔한 테스트 출력)
2. ✅ **명시적 제어**: `FEATURE_LOGS=true/false` (최우선)
3. ✅ **기본 동작**: `development` ON, `production` OFF

#### 로그 출력 조건표

| 환경 | FEATURE_LOGS | 로그 출력 | 설명 |
|------|-------------|----------|------|
| **test** | (무시됨) | ❌ | 테스트는 항상 로그 OFF |
| **development** | (미설정) | ✅ **ON** | 개발 환경 기본값 |
| **development** | `false` | ❌ | 명시적으로 끄기 |
| **production** | (미설정) | ❌ | 프로덕션 기본값 |
| **production** | `true` | ✅ **ON** | 디버깅 모드 |

#### 사용 예시

**시나리오 1: 로컬 개발 (자동 로그 출력)**
```bash
# 아무것도 설정 안 함 → 로그 자동 출력
npm run dev
```

**시나리오 2: 로컬 개발 중 로그 끄기**
```bash
# FEATURE_LOGS=false로 명시적으로 끄기
FEATURE_LOGS=false npm run dev
```

**시나리오 3: 프로덕션 디버깅**
```bash
# FEATURE_LOGS=true로 명시적으로 켜기
NODE_ENV=production FEATURE_LOGS=true node app.js
```

**시나리오 4: 테스트 실행**
```bash
# 항상 로그 OFF (깔끔한 테스트 출력)
npm test
```

#### package.json 스크립트 예시

```json
{
  "scripts": {
    "start": "node app.js",
    "dev": "node app.js",                          // development: 로그 ON
    "dev:quiet": "FEATURE_LOGS=false node app.js", // 로그 끄기
    "start:prod": "NODE_ENV=production node app.js", // production: 로그 OFF
    "prod:debug": "NODE_ENV=production FEATURE_LOGS=true node app.js", // production 디버깅
    "test": "NODE_ENV=test jest"                   // test: 항상 로그 OFF
  }
}
```

#### Docker 환경 예시

```dockerfile
# Dockerfile (production - 로그 OFF)
FROM node:20-alpine
ENV NODE_ENV=production
# FEATURE_LOGS 설정 안 함 → 기본 OFF
CMD ["node", "app.js"]
```

```dockerfile
# Dockerfile (production debug - 로그 ON)
FROM node:20-alpine
ENV NODE_ENV=production
ENV FEATURE_LOGS=true
CMD ["node", "app.js"]
```

#### 환경 변수

| 변수 | 기본값 | 설명 |
|-----|--------|------|
| `FEATURE_LOGS` | (미설정) | `true`: 강제 ON, `false`: 강제 OFF |
| `NODE_ENV` | - | `development`: 기본 ON, `production`: 기본 OFF, `test`: 항상 OFF |

#### 성능 최적화

로그 제어는 클래스 로드 시점에 한 번만 평가되므로 **성능 오버헤드가 거의 없습니다** (0.01% 미만).


---

## 장점

### 1. Convention over Configuration ⭐
폴더 구조만 만들면 자동으로 API가 등록됩니다.

### 2. Bulk Registration
수백 개의 Feature도 한 줄로 등록 가능하며, 폴더 구조만으로 API 구조를 파악할 수 있습니다.

### 3. 자동 실행
Orchestrator 클래스를 작성할 필요가 없습니다.

### 4. 시각적 흐름
파일 목록만 봐도 전체 흐름을 이해할 수 있습니다.

### 5. 유연한 확장
중간에 step 추가 시 다른 파일 수정이 불필요합니다.

### 6. 유연한 에러 처리
onError 핸들러로 데이터베이스 독립적인 에러 처리가 가능합니다.

### 7. 자동 에러 캐치
try-catch 없이 에러를 자동으로 캐치하여 onError 핸들러로 전달합니다.

---

**마지막 업데이트**: 2025-11-10 (다중 Features 디렉토리 등록 및 라우트 충돌 감지 섹션 추가)
**이전 업데이트**: 2025-11-09 (Debug Mode 섹션 추가)
**이전**: [목차](./README.md)
