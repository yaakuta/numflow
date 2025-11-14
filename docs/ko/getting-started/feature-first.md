# Feature-First Auto-Orchestration

**Feature-First**는 Numflow 프레임워크의 핵심 차별화 기능입니다. 복잡한 비즈니스 로직을 여러 단계(Step)로 분리하고, 자동으로 발견(Discovery)·실행(Execution)·에러 처리(Error Handling)를 수행합니다.

## 목차

- [Feature-First란 무엇인가?](#feature-first란-무엇인가)
- [왜 Feature-First를 사용하는가?](#왜-feature-first를-사용하는가)
- [빠른 시작](#빠른-시작)
- [암묵적 Feature vs 명시적 Feature](#암묵적-feature-vs-명시적-feature)
- [Step 파일 구조](#step-파일-구조)
- [Context](#context)
- [Application 등록](#application-등록)
- [실전 예제](#실전-예제)
- [미들웨어 통합](#미들웨어-통합)
- [에러 처리 (onError)](#에러-처리-onerror)
- [Async Tasks](#async-tasks)
- [디버깅 및 로그 제어](#디버깅-및-로그-제어)
- [Best Practices](#best-practices)

---

## Feature-First란 무엇인가?

**Feature-First Auto-Orchestration**은 복잡한 비즈니스 로직을 다음과 같이 자동화합니다:

### 1. Auto-Discovery (자동 발견)

Step 파일을 자동으로 스캔하고 번호 순으로 정렬합니다.

```
steps/
├── 100-validate.js      ← 자동 발견
├── 200-check-stock.js   ← 자동 발견
├── 300-create-order.js  ← 자동 발견
└── 400-notify.js        ← 자동 발견
```

### 2. Auto-Execution (자동 실행)

번호 순서대로 Step을 자동 실행합니다.

```
100 → 200 → 300 → 400  (순차 실행)
```

### 3. Auto-Error Handling (자동 에러 처리)

에러 발생 시 onError 핸들러를 자동으로 호출하여 사용자 정의 에러 처리를 수행합니다.

```
100 → 200 → 300 (에러 발생)
               ↓
           onError 호출
```

### 4. Context 공유

모든 Step이 동일한 Context 객체를 공유하며 데이터를 전달합니다.

```javascript
// 100-validate.js (ctx, req, res)
ctx.userId = 123

// 200-check-stock.js (ctx, req, res)
console.log(ctx.userId)  // 123
```

---

## 왜 Feature-First를 사용하는가?

### Express 방식의 문제점

```javascript
// ❌ Express: 모든 로직이 한 곳에 집중
app.post('/api/orders', async (req, res) => {
  // 1. Validation
  if (!req.body.productId) {
    return res.status(400).json({ error: 'Missing productId' })
  }

  // 2. Check stock
  const stock = await checkStock(req.body.productId)
  if (stock < req.body.quantity) {
    return res.status(400).json({ error: 'Out of stock' })
  }

  // 3. Begin transaction
  const tx = await db.beginTransaction()

  try {
    // 4. Create order
    const order = await createOrder(req.body, tx)

    // 5. Update stock
    await updateStock(req.body.productId, req.body.quantity, tx)

    // 6. Commit transaction
    await tx.commit()

    // 7. Send notification (async)
    sendNotification(order)

    res.json({ success: true, order })
  } catch (error) {
    await tx.rollback()
    res.status(500).json({ error: error.message })
  }
})
```

**문제점**:
- ❌ 100줄 이상의 복잡한 코드
- ❌ 트랜잭션, 에러 처리를 모두 수동으로 관리
- ❌ 에러 처리 로직이 복잡함
- ❌ 재사용 불가능
- ❌ 테스트하기 어려움

### Feature-First 방식 (Bulk Registration)

**app.js (단 한 줄!)**:
```javascript
// ✅ Feature-First: 폴더 구조로 모든 것을 자동화
const numflow = require('numflow')
const app = numflow()

// 모든 Feature를 자동으로 스캔하고 등록
app.registerFeatures('./features')

// app.listen()은 Feature 등록 완료를 자동으로 대기한 후 서버 시작
app.listen(3000, () => {
  console.log('Server running on port 3000')
})
```

**폴더 구조 (Convention over Configuration)**:
```
features/
└── api/
    └── orders/
        └── @post/                    # POST /api/orders
            ├── index.js             # Feature 설정
            ├── steps/               # Step 파일들 (자동 실행)
            │   ├── 100-validate.js
            │   ├── 200-check-stock.js
            │   ├── 300-create-order.js
            │   └── 400-update-stock.js
            └── async-tasks/         # 비동기 작업 (자동 실행)
                └── send-notification.js
```

**Feature 설정 파일 (features/api/orders/@post/index.js)**:
```javascript
const numflow = require('numflow')

module.exports = numflow.feature({
  // method: 'POST' ← '@post' 폴더명에서 자동 추론!
  // path: '/api/orders' ← 폴더 구조에서 자동 추론!
  // steps: './steps' ← ./steps 디렉토리 자동 인식!
  // asyncTasks: './async-tasks' ← ./async-tasks 디렉토리 자동 인식!

  // 필요한 설정만 추가
  onError: async (error, context, req, res) => {
    if (context.dbClient) {
      await context.dbClient.query('ROLLBACK')
    }
    res.statusCode = 500
    res.end(JSON.stringify({ error: error.message }))
  },
})
```

**Step 파일들 (자동 발견 및 실행)**:
```javascript
// steps/100-validate.js
// Step 함수는 (ctx, req, res) 3개 파라미터 받음
module.exports = async (ctx, req, res) => {
  if (!req.body.productId) {  // req에서 직접 접근
    throw new Error('Missing productId')
  }
  // 끝! 자동으로 다음 Step 진행
}

// steps/200-check-stock.js
module.exports = async (ctx, req, res) => {
  const stock = await checkStock(req.body.productId)  // req에서 직접 접근
  if (stock < req.body.quantity) {
    throw new Error('Out of stock')
  }
  ctx.stock = stock  // ← 명시적으로 context에 저장
  // 끝! 자동으로 다음 Step 진행
}

// steps/300-create-order.js
module.exports = async (ctx, req, res) => {
  const order = await createOrder(req.body)  // req에서 직접 접근
  ctx.order = order  // ← 명시적으로 context에 저장
  // 끝! 자동으로 다음 Step 진행
}

// steps/400-update-stock.js
module.exports = async (ctx, req, res) => {
  await updateStock(req.body.productId, req.body.quantity)  // req에서 직접 접근
  // 끝! 자동으로 다음 Step 진행
}

// async-tasks/send-notification.js (Step 완료 후 비동기)
// AsyncTask 함수는 (ctx) 1개 파라미터만 받음
module.exports = async (ctx) => {
  await sendNotification(ctx.order)  // Context에서 직접 접근
}
```

**장점**:
- ✅ **단 한 줄 (app.registerFeatures)로 모든 Feature 등록**
- ✅ 폴더 구조 = API 구조 (직관적)
- ✅ 새 Feature 추가 시 app.js 수정 불필요 (Zero Edit)
- ✅ 각 Step이 독립적이고 재사용 가능
- ✅ 에러가 자동으로 캐치되어 onError로 전달됨
- ✅ Convention over Configuration (설정 최소화)
- ✅ 테스트하기 쉬움
- ✅ 코드 가독성 및 유지보수성 극대화

---

## 빠른 시작

**Feature-First를 5분 만에 시작하세요!** Bulk Registration을 사용하면 폴더 구조만으로 API를 정의할 수 있습니다.

### 1. 프로젝트 구조 (Convention over Configuration)

```
my-app/
├── features/
│   └── api/
│       └── orders/
│           └── @post/                # ← POST /api/orders
│               ├── index.js         # Feature 설정
│               └── steps/           # Step 파일들
│                   ├── 100-validate.js
│                   ├── 200-check-stock.js
│                   ├── 300-create-order.js
│                   └── 400-update-stock.js
└── app.js
```

**폴더 명명 규칙**:
- `post`, `get`, `put`, `patch`, `delete` → HTTP 메서드
- `[id]` → `:id` (동적 라우트 파라미터)
- 폴더 경로 → API 경로

### 2. Step 파일 작성

Step 함수는 (ctx, req, res) 3개의 파라미터를 받습니다.**

```javascript
// features/api/orders/@post/steps/100-validate.js
module.exports = async (ctx, req, res) => {
  const { productId, quantity } = req.body  // req에서 직접 접근

  if (!productId || !quantity) {
    throw new Error('Missing required fields')
  }

  ctx.validated = true  // ← 명시적으로 context에 저장
  // 끝! 자동으로 다음 Step 진행
}
```

### 3. Feature 설정 파일 작성

```javascript
// features/api/orders/@post/index.js
const numflow = require('numflow')

module.exports = numflow.feature({
  // method와 path는 폴더 구조에서 자동 추론!
  // 'post' 폴더 → POST 메서드
  // 'api/orders/@post' → /api/orders 경로

  // 필요한 경우에만 추가 설정 작성
  // (대부분의 경우 빈 객체 {} 또는 최소 설정만 필요)
})
```

### 4. app.js 작성 (Bulk Registration)

```javascript
// app.js
const numflow = require('numflow')
const app = numflow()

// 모든 Feature를 자동으로 스캔하고 등록
app.registerFeatures('./features')

// app.listen()은 Feature 등록 완료를 자동으로 대기한 후 서버 시작
app.listen(3000, () => {
  console.log('Server running on port 3000')
})
```

**app.listen()이 모든 Feature 등록 완료를 자동으로 대기합니다!**

### 5. 테스트

```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{"productId": "A123", "quantity": 2}'
```

**응답**:

```json
{
  "success": true,
  "data": {
    "validated": true
  }
}
```

---

### 💡 새 Feature 추가하기 (Zero Edit)

새로운 Feature를 추가할 때 **app.js를 수정할 필요가 없습니다!** 폴더만 추가하면 됩니다.

```
features/api/
├── orders/
│   └── @post/...              # 기존 Feature
└── users/                    # ← 새로운 Feature 추가!
    ├── @get/                 # GET /api/users
    │   ├── index.js
    │   └── steps/
    │       └── 100-fetch.js
    └── [id]/
        └── @get/              # GET /api/users/:id
            ├── index.js
            └── steps/
                └── 100-fetch-by-id.js
```

서버를 재시작하면 자동으로 등록됩니다! 🎉

---

## 암묵적 Feature vs 명시적 Feature

Numflow는 **Convention over Configuration** 철학을 따릅니다. Feature는 두 가지 방식으로 정의할 수 있습니다:

### 1. 암묵적 Feature (Implicit Feature) ⭐ 권장

**index.js 없이** `@method` 폴더와 `steps/` 또는 `async-tasks/` 폴더만으로 Feature를 정의합니다.

**폴더 구조**:
```
features/todos/
└── @get/                    # GET /todos
    └── steps/               # ← index.js 없음!
        └── 100-list.js
```

**특징**:
- ✅ **Zero Configuration**: index.js 파일이 필요 없음
- ✅ **100% Convention**: 모든 설정이 폴더 구조에서 자동 추론
- ✅ **최소한의 코드**: Step 파일만 작성하면 됨
- ✅ **빠른 프로토타이핑**: 간단한 CRUD API를 빠르게 구축

**언제 사용하나요?**
- 간단한 CRUD 작업
- 특별한 설정이 필요 없는 경우
- contextInitializer, 미들웨어, onError 등이 필요 없는 경우
- 대부분의 일반적인 API 엔드포인트

**예제**:
```javascript
// features/todos/@get/steps/100-list.js
module.exports = async (ctx, req, res) => {
  const todos = await db.todos.findAll()
  ctx.todos = todos
}

// features/todos/@get/steps/200-response.js
module.exports = async (ctx, req, res) => {
  res.json({ success: true, data: ctx.todos })
}
```

**자동으로 추론되는 것들**:
- HTTP Method: `@get` → GET
- API Path: `features/todos/@get` → `/todos`
- Steps: `./steps` 디렉토리 자동 인식
- Async Tasks: `./async-tasks` 디렉토리 자동 인식 (있는 경우)

---

### 2. 명시적 Feature (Explicit Feature)

**index.js 파일로** 추가 설정을 제공합니다.

**폴더 구조**:
```
features/api/orders/
└── @post/                   # POST /api/orders
    ├── index.js             # ← 추가 설정
    ├── steps/
    │   ├── 100-validate.js
    │   └── 200-create.js
    └── async-tasks/
        └── send-email.js
```

**index.js 예제**:
```javascript
// features/api/orders/@post/index.js
const numflow = require('numflow')

module.exports = numflow.feature({
  // Convention은 여전히 자동 추론됨!
  // method: 'POST' ← '@post' 폴더에서 자동 추론
  // path: '/api/orders' ← 폴더 구조에서 자동 추론
  // steps: './steps' ← 자동 인식
  // asyncTasks: './async-tasks' ← 자동 인식

  // 필요한 설정만 추가
  contextInitializer: (ctx, req, res) => {
    ctx.userId = req.user?.id
    ctx.timestamp = Date.now()
  },

  onError: async (error, context, req, res) => {
    if (context.dbClient) {
      await context.dbClient.query('ROLLBACK')
    }
    res.status(500).json({ error: error.message })
  },

  middlewares: [
    requireAuth,
    validateOrderSchema
  ]
})
```

**언제 사용하나요?**
- `contextInitializer`가 필요한 경우 (초기 context 설정)
- 커스텀 `onError` 핸들러가 필요한 경우
- Feature별 미들웨어가 필요한 경우
- Convention을 덮어쓰고 싶은 경우 (권장하지 않음)

---

### 3. 비교표

| 특징 | 암묵적 Feature | 명시적 Feature |
|------|---------------|---------------|
| **index.js** | ❌ 불필요 | ✅ 필요 |
| **설정** | 0줄 | 필요한 만큼 |
| **Convention** | 100% | 100% (덮어쓰기 가능) |
| **contextInitializer** | ❌ 사용 불가 | ✅ 사용 가능 |
| **onError** | ❌ 사용 불가 | ✅ 사용 가능 |
| **Feature 미들웨어** | ❌ 사용 불가 | ✅ 사용 가능 |
| **사용 케이스** | 간단한 CRUD | 복잡한 비즈니스 로직 |

---

### 4. 하이브리드 사용

같은 프로젝트에서 두 방식을 혼용할 수 있습니다!

```
features/
├── todos/
│   ├── @get/               # 암묵적 Feature (간단)
│   │   └── steps/
│   └── @post/              # 명시적 Feature (복잡)
│       ├── index.js
│       └── steps/
└── users/
    ├── @get/               # 암묵적 Feature
    │   └── steps/
    └── [id]/
        └── @put/           # 명시적 Feature
            ├── index.js
            └── steps/
```

**권장 사항**:
- 기본적으로 **암묵적 Feature**로 시작하세요
- 추가 설정이 필요할 때만 index.js를 추가하세요
- 대부분의 경우 암묵적 Feature만으로 충분합니다!

---


---

## Step 파일 구조

### 파일명 규칙

Step 파일은 다음 형식을 따라야 합니다:

```
<숫자>-<설명>.js
```

**예제**:
- ✅ `100-validate.js`
- ✅ `200-check-stock.js`
- ✅ `300-create-order.js`
- ❌ `validate.js` (숫자 없음)
- ❌ `100_validate.js` (하이픈 대신 언더스코어)

### 번호 규칙

- 번호는 **고유**해야 합니다 (중복 불가)
- 번호는 **10 단위** 또는 **100 단위**로 증가하는 것을 권장
- 나중에 중간 Step을 추가할 여지를 남김

**왜 크기 기반 정렬인가?**

```
# 순차적 번호 사용 시 (문제)
steps/
├── 01-validate.js
├── 02-process.js      → 중간에 추가하려면?
└── 03-complete.js     → 모든 파일 이름 변경! 😱

# 크기 기반 정렬 사용 시 (해결)
steps/
├── 100-validate.js
├── 150-new-step.js    ← 그냥 추가! ✅
├── 200-process.js     ← 변경 없음
└── 300-complete.js    ← 변경 없음
```

### Step 함수 형식

Step 함수는 (ctx, req, res) 3개의 파라미터를 받습니다.**

**CommonJS (JavaScript)**:

```javascript
// module.exports로 내보내기
module.exports = async (ctx, req, res) => {
  // Step 로직
  const data = req.body  // req에서 직접 접근
  ctx.something = 'value'  // ← 명시적으로 context에 저장
  // 끝! 자동으로 다음 Step 진행
}
```

**ESM (JavaScript)**:

```javascript
// export default로 내보내기
export default async (ctx, req, res) => {
  // Step 로직
  const data = req.body  // req에서 직접 접근
  ctx.something = 'value'  // ← 명시적으로 context에 저장
  // 끝! 자동으로 다음 Step 진행
}
```

**TypeScript**:

```typescript
import { Context } from 'numflow'
import { IncomingMessage, ServerResponse } from 'http'

export default async (
  ctx: Context,
  req: IncomingMessage,
  res: ServerResponse
): Promise<void> => {
  // Step 로직
  const data = req.body  // req에서 직접 접근
  ctx.something = 'value'  // ← 명시적으로 context에 저장
  // 끝! 자동으로 다음 Step 진행
}
```

### 흐름 제어

**Step 함수의 흐름 제어는 JavaScript 기본 동작을 따릅니다:**

1. **함수가 끝까지 실행** → 자동으로 다음 Step 진행
2. **`throw Error`** → 즉시 onError 핸들러로, 나머지 Step 실행 안 됨
3. **`return` (함수 종료)** → Step 종료 후:
   - `res.headersSent === true` → 다음 Step 스킵 (조기 응답)
   - `res.headersSent === false` → 다음 Step 진행

**✨ 핵심: return 값은 완전히 무시됩니다.**

**올바른 사용 예제**:
```javascript
// 100-get-user.js - 일반적인 사용 (99%)
module.exports = async (ctx, req, res) => {
  const user = await getUser(req.params.id)  // req에서 직접 접근
  ctx.user = user  // ← 명시적으로 context에 저장
  // 끝! 자동으로 다음 Step
}

// 200-get-orders.js
module.exports = async (ctx, req, res) => {
  const orders = await getOrders(ctx.user.id)  // ctx에서 이전 Step 결과 접근
  ctx.orders = orders  // ← 명시적으로 context에 저장
  // 끝! 자동으로 다음 Step
}

// 300-respond.js - 최종 응답
module.exports = async (ctx, req, res) => {
  res.json({ success: true, data: { user: ctx.user, orders: ctx.orders } })
}
```

**에러 처리 예제:**
```javascript
// 에러 발생 시 즉시 중지
module.exports = async (ctx, req, res) => {
  if (!ctx.user) {
    throw new Error('User not found')  // ← onError 핸들러로
  }
  ctx.validated = true
  // 끝! 다음 Step
}
```

**조기 응답 예제:**
```javascript
// 캐시가 있으면 조기 응답
module.exports = async (ctx, req, res) => {
  const cached = cache.get(req.url)
  if (cached) {
    return res.json(cached)  // ← 응답 + 즉시 종료 (return 필수!)
  }
  ctx.fresh = await fetchData()
  // 끝! 다음 Step
}
```

**⚠️ 중요**: `res.json()`만으로는 함수가 멈추지 않습니다! 반드시 `return`이 필요합니다.

---

## 조기 Response 처리 (Early Response)

Feature-First에서 **조기 Response**는 마지막 Step이 아닌 중간 Step(100, 200 등)에서 HTTP 응답을 보내는 것을 의미합니다. 이는 유효성 검사 실패, 권한 부족, 캐시 히트 등의 상황에서 유용합니다.

### 🎯 핵심 동작 원리

```
Step 100 → Response 전송 → [Step 200, 300 건너뜀] → Async-tasks 실행 ✅
```

**중요한 규칙:**
1. ✅ **Response를 보낸 Step 이후의 모든 Steps는 자동으로 건너뜁니다**
2. ✅ **Async-tasks는 정상적으로 실행됩니다** (정상 종료로 간주)
3. ✅ **`res.headersSent` 플래그로 자동 감지**

### res.headersSent 메커니즘

Numflow는 각 Step 실행 후 `res.headersSent`를 체크하여 응답이 전송되었는지 확인합니다.

```typescript
// 내부 동작 (src/feature/auto-executor.ts:108-112)
await step.fn(context, req, res)

// Response가 이미 전송되었는가?
if (res.headersSent) {
  // 나머지 Steps 건너뛰고 종료
  return context  // ← 정상 종료로 간주 → Async-tasks 실행됨
}
```

### 실전 예제

#### 예제 1: 유효성 검사 실패 (400 Bad Request)

```javascript
// steps/100-validate.js
module.exports = async (ctx, req, res) => {
  if (!req.body.userId) {
    // 조기 Response!
    res.status(400).json({ error: 'userId required' })
    return  // ⚠️ return 필수!
  }
  ctx.validated = true
}

// steps/200-create-order.js - 실행 안 됨 ❌
module.exports = async (ctx, req, res) => {
  // 위에서 400 응답을 보냈으므로 여기는 실행되지 않음
  const order = await db.orders.create(req.body)
  ctx.order = order
}

// steps/300-response.js - 실행 안 됨 ❌
module.exports = async (ctx, req, res) => {
  res.json({ orderId: ctx.order.id })
}

// async-tasks/send-email.js - 실행 안 됨 ❌
module.exports = async (ctx) => {
  // 에러 응답이므로 Async-tasks 실행 안 됨
  await sendEmail(ctx.order)
}
```

**결과:**
- Step 100만 실행
- 클라이언트는 `400 Bad Request` 응답 받음
- Steps 200, 300 건너뜀
- **Async-tasks 실행 안 됨** (에러 응답이므로)

#### 예제 2: 캐시 히트 (200 OK)

```javascript
// steps/100-check-cache.js
module.exports = async (ctx, req, res) => {
  const cached = await cache.get(`user:${req.params.id}`)

  if (cached) {
    // 캐시가 있으면 조기 Response!
    res.json(cached)  // 200 OK
    return  // ⚠️ return 필수!
  }

  // 캐시가 없으면 다음 Step 진행
}

// steps/200-fetch-from-db.js - 캐시 히트 시 실행 안 됨 ❌
module.exports = async (ctx, req, res) => {
  const user = await db.users.findById(req.params.id)
  ctx.user = user
}

// steps/300-response.js - 캐시 히트 시 실행 안 됨 ❌
module.exports = async (ctx, req, res) => {
  res.json(ctx.user)
}

// async-tasks/log-access.js - 캐시 히트 시에도 실행됨 ✅
module.exports = async (ctx) => {
  // 정상 응답(200 OK)이므로 Async-tasks 실행됨!
  await logService.write({
    action: 'user_viewed',
    userId: ctx.userId,
    timestamp: new Date()
  })
}
```

**결과 (캐시 히트 시):**
- Step 100만 실행
- 클라이언트는 `200 OK` + 캐시 데이터 받음
- Steps 200, 300 건너뜀
- **Async-tasks 실행됨 ✅** (정상 응답이므로)

#### 예제 3: 권한 체크 실패 (403 Forbidden)

```javascript
// steps/100-check-permission.js
module.exports = async (ctx, req, res) => {
  const user = await getUser(req.userId)

  if (!user.isAdmin) {
    // 권한 없음 → 조기 Response!
    res.status(403).json({ error: 'Admin only' })
    return  // ⚠️ return 필수!
  }

  ctx.user = user
}

// steps/200-delete-user.js - 권한 없으면 실행 안 됨 ❌
module.exports = async (ctx, req, res) => {
  await db.users.delete(req.params.id)
  ctx.deleted = true
}

// steps/300-response.js - 권한 없으면 실행 안 됨 ❌
module.exports = async (ctx, req, res) => {
  res.json({ success: true })
}

// async-tasks/send-notification.js - 실행 안 됨 ❌
module.exports = async (ctx) => {
  // 에러 응답이므로 Async-tasks 실행 안 됨
  await notify('User deleted')
}
```

**결과 (권한 없을 시):**
- Step 100만 실행
- 클라이언트는 `403 Forbidden` 응답 받음
- Steps 200, 300 건너뜀
- **Async-tasks 실행 안 됨** (에러 응답이므로)

### 📊 조기 Response vs 에러 발생 비교

| 상황 | 코드 | 나머지 Steps | Async-tasks |
|------|------|-------------|-------------|
| **조기 정상 응답 (200)** | `res.json(...); return` | ❌ 건너뜀 | ✅ **실행됨** |
| **조기 에러 응답 (4xx/5xx)** | `res.status(400).json(...); return` | ❌ 건너뜀 | ❌ 실행 안 됨 |
| **throw Error** | `throw new Error(...)` | ❌ 건너뜀 | ❌ 실행 안 됨 |
| **정상 흐름** | 모든 Steps 실행 | ✅ 모두 실행 | ✅ 실행됨 |

### ⚠️ 주의사항

#### 1. return 필수

```javascript
// ❌ 잘못된 예: return 없음
module.exports = async (ctx, req, res) => {
  if (cached) {
    res.json(cached)  // ← return 없음!
    // 함수가 계속 실행됨! 다음 Step도 실행 시도!
  }
  ctx.data = await fetchData()
}

// ✅ 올바른 예: return 있음
module.exports = async (ctx, req, res) => {
  if (cached) {
    res.json(cached)
    return  // ← return 필수!
  }
  ctx.data = await fetchData()
}
```

#### 2. Async-tasks는 응답 상태 코드를 모름

Async-tasks는 응답이 성공(200)인지 실패(4xx/5xx)인지 **구분하지 못합니다**. 조건부 실행이 필요하다면 Context에 플래그를 저장하세요.

```javascript
// steps/100-validate.js
module.exports = async (ctx, req, res) => {
  if (!req.body.userId) {
    ctx.isError = true  // ← 플래그 설정
    res.status(400).json({ error: 'userId required' })
    return
  }
  ctx.validated = true
}

// async-tasks/send-email.js
module.exports = async (ctx) => {
  // 에러 응답 시 이메일 보내지 않기
  if (ctx.isError) {
    console.log('Error response, skipping email')
    return
  }

  await sendEmail(ctx.order)
}
```

#### 3. 조기 Response 후 Context는 불완전할 수 있음

Step 100에서 응답을 보내면 Steps 200, 300이 실행되지 않으므로 그곳에서 설정할 Context 데이터가 없습니다.

```javascript
// steps/100-check-cache.js
module.exports = async (ctx, req, res) => {
  const cached = await cache.get(key)
  if (cached) {
    res.json(cached)
    return  // ← Step 200 실행 안 됨
  }
}

// steps/200-create-order.js - 실행 안 됨
module.exports = async (ctx, req, res) => {
  ctx.order = await createOrder()  // ← 캐시 히트 시 설정 안 됨
}

// async-tasks/send-email.js
module.exports = async (ctx) => {
  // ⚠️ ctx.order가 undefined일 수 있음!
  if (!ctx.order) {
    console.log('No order created, skipping email')
    return
  }

  await sendEmail(ctx.order)
}
```

### 🎯 Best Practices

#### 1. 조기 Response는 빠른 실패(Fail-Fast)에 사용

```javascript
// ✅ 좋은 예: 유효성 검사 실패 시 즉시 응답
module.exports = async (ctx, req, res) => {
  if (!req.body.email) {
    res.status(400).json({ error: 'Email required' })
    return
  }
  // 나머지 로직
}
```

#### 2. 성능 최적화에 활용

```javascript
// ✅ 좋은 예: 캐시 히트 시 불필요한 DB 조회 건너뛰기
module.exports = async (ctx, req, res) => {
  const cached = await cache.get(key)
  if (cached) {
    res.json(cached)  // 빠른 응답!
    return
  }
  // 캐시 미스 시에만 DB 조회
}
```

#### 3. Async-tasks에서 Context 검증

```javascript
// ✅ 좋은 예: 필요한 데이터가 있는지 확인
module.exports = async (ctx) => {
  if (!ctx.order) {
    console.log('No order in context, skipping notification')
    return
  }

  await sendNotification(ctx.order)
}
```

### 🔍 디버깅 팁

조기 Response가 의도대로 동작하는지 확인하려면 Debug Mode를 활성화하세요:

```bash
DEBUG=numflow:* npm start
```

로그 출력 예시:
```
[Feature] POST /api/orders
  [Step 100] validate (2ms) ✓
    └─ Context: (no changes)
  [Step 100] Early response detected (res.headersSent = true)
  [Step 200] Skipped (early response)
  [Step 300] Skipped (early response)
  [AsyncTask] send-email ✓ (150ms)
```

---

## Context

### Context 객체

Context는 순수 비즈니스 데이터만 포함합니다.** req와 res는 Step 함수의 파라미터로 직접 전달됩니다.

```typescript
// Context 인터페이스
interface Context {
  [key: string]: any  // 순수 비즈니스 데이터 (req, res는 제거됨)
}

// Step 함수 시그니처
type StepFunction = (
  context: Context,        // 순수 비즈니스 데이터
  req: IncomingMessage,    // HTTP Request (별도 파라미터)
  res: ServerResponse      // HTTP Response (별도 파라미터)
) => Promise<void> | void
```

### 데이터 저장 및 접근

모든 데이터는 Context에 직접 저장됩니다.** Context는 순수 비즈니스 데이터만 포함합니다.

```javascript
// 100-validate.js
module.exports = async (ctx, req, res) => {
  ctx.validated = true  // ← Context에 직접 저장
}

// 200-check-stock.js
module.exports = async (ctx, req, res) => {
  ctx.stock = 100  // ← Context에 직접 저장
}

// 300-create-order.js
module.exports = async (ctx, req, res) => {
  // 이전 Step의 결과 사용 (Context에서 직접 접근)
  console.log(ctx.validated)  // true
  console.log(ctx.stock)      // 100

  ctx.orderId = 'ORDER-123'  // ← Context에 직접 저장
}

// 900-respond.js
module.exports = async (ctx, req, res) => {
  res.status(200).json({  // res 파라미터에서 직접 접근
    success: true,
    data: {
      validated: ctx.validated,
      stock: ctx.stock,
      orderId: ctx.orderId
    }
  })
}
```

**최종 응답**:

```json
{
  "success": true,
  "data": {
    "validated": true,
    "stock": 100,
    "orderId": "ORDER-123"
  }
}
```

### Request 데이터 접근

req 파라미터에서 직접 접근합니다.**

```javascript
module.exports = async (ctx, req, res) => {
  // URL 파라미터
  const userId = req.params.userId

  // Query 문자열
  const page = req.query.page

  // Request Body
  const { productId, quantity } = req.body

  // Headers
  const token = req.headers.authorization

  // 끝! 자동으로 다음 Step 진행
}
```

---

## Application 등록

Feature를 애플리케이션에 등록하려면 **app.registerFeatures()**를 사용합니다.

### Bulk 등록 (app.registerFeatures)

features 디렉토리를 재귀적으로 스캔하여 모든 Feature를 자동으로 등록합니다. **Convention over Configuration** 원칙을 따릅니다.

**사용법**:

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

**폴더 구조**:

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

**Convention 규칙** (자동 추론):
- **HTTP Method**: 폴더명 (get, post, put, patch, delete) → 해당 HTTP 메서드
- **Path**: 폴더 구조 → API path
  - `features/api/v1/orders/@post` → `/api/v1/orders`
- **Dynamic Route**: `[id]` → `:id`
  - `features/users/[id]/@get` → `/users/:id`
- **Steps**: `./steps` 디렉토리가 있으면 자동 인식
- **Async Tasks**: `./async-tasks` 디렉토리가 있으면 자동 인식

**각 Feature 파일** (features/api/v1/orders/@post/index.js):

```javascript
const numflow = require('numflow')

module.exports = numflow.feature({
  // method와 path는 Convention으로 자동 추론!
  // steps와 asyncTasks도 폴더 존재 시 자동 인식!

  // 필요한 경우 추가 설정만 작성
  middlewares: [authenticate],
  onError: async (error, context, req, res) => {
    // 에러 처리
    res.statusCode = 500
    res.end(JSON.stringify({ error: error.message }))
  },
})
```

**옵션 사용**:

```javascript
app.registerFeatures('./features', {
  indexPatterns: ['index.js', 'feature.js'],  // 스캔할 파일명 패턴
  excludeDirs: ['__tests__', 'utils'],        // 제외할 디렉토리
  debug: true,                                 // 디버그 로그 활성화
})
```

**다중 Features 디렉토리 등록**:

여러 개의 features 디렉토리를 등록할 수 있습니다. 디렉토리 이름은 'features'가 아니어도 됩니다.

```javascript
const numflow = require('numflow')
const app = numflow()

// 여러 디렉토리를 각각 등록 가능
app.registerFeatures('./features')           // 기본 features
app.registerFeatures('./admin-features')     // 관리자 features
app.registerFeatures('./api-v2')             // API v2 features

app.listen(3000, () => {
  console.log('Server running on port 3000')
})
```

**경로 추론 방식**:

각 디렉토리는 독립적으로 경로를 추론합니다:

```
features/api/users/@get          → GET /api/users
admin-features/api/users/@get    → GET /api/users (충돌!)
api-v2/users/@get                → GET /users
```

**사용 시나리오**:

1. **API 버전 분리**:
   ```javascript
   app.registerFeatures('./features-v1')  // v1 API
   app.registerFeatures('./features-v2')  // v2 API
   ```

2. **권한별 분리**:
   ```javascript
   app.registerFeatures('./public-api')   // 공개 API
   app.registerFeatures('./admin-api')    // 관리자 API
   ```

3. **도메인별 분리**:
   ```javascript
   app.registerFeatures('./user-features')     // 사용자 도메인
   app.registerFeatures('./payment-features')  // 결제 도메인
   app.registerFeatures('./order-features')    // 주문 도메인
   ```

**⚠️ 라우트 충돌 주의**:

같은 `method:path` 조합이 여러 디렉토리에 중복되면 **Fail-Fast** 정책에 따라 프로그램이 즉시 종료됩니다.

```javascript
// ❌ 충돌 발생 예시
app.registerFeatures('./features-dir1')
// features-dir1/api/user/@get → GET /api/user

app.registerFeatures('./features-dir2')
// features-dir2/api/user/@get → GET /api/user (충돌!)

app.listen(3000)  // → Error: Feature already registered: GET:/api/user
```

**충돌 해결 방법**:

1. **서로 다른 경로 사용**:
   ```javascript
   // features-dir1/api/users/@get → GET /api/users
   // features-dir2/api/products/@get → GET /api/products
   ```

2. **네임스페이스 추가**:
   ```javascript
   // features-v1/api/user/@get → GET /api/user
   // features-v2/api/user/@get → GET /api/user (충돌!)

   // 해결: 네임스페이스 추가
   // features-v1/v1/api/user/@get → GET /v1/api/user
   // features-v2/v2/api/user/@get → GET /v2/api/user
   ```

3. **서로 다른 메서드 사용**:
   ```javascript
   // features-dir1/api/user/@get → GET /api/user
   // features-dir2/api/user/@post → POST /api/user (OK, 메서드 다름)
   ```

자세한 내용은 [Feature API 문서 - 다중 디렉토리 등록](../api/feature.md#다중-features-디렉토리-등록)과 [Error Handling - 라우트 충돌 에러](../api/errors.md#feature-라우트-충돌-에러)를 참고하세요.

**장점**:
- ✅ **단 한 줄**로 수백 개 Feature 등록 가능
- ✅ 폴더 구조만으로 API 구조를 한눈에 파악
- ✅ 새 Feature 추가 시 app.js 수정 불필요 (Zero Edit)
- ✅ 각 Feature가 독립적인 디렉토리에 격리
- ✅ 확장성 및 유지보수성 극대화
- ✅ 여러 디렉토리 등록으로 모듈화 및 팀 협업 강화

**단점**:
- ❌ Convention을 따라야 함 (유연성 제약)
- ❌ 비동기 스캔으로 인한 약간의 서버 시작 지연 (1초)

**적합한 경우**:
- Feature가 10개 이상인 중대규모 프로젝트
- REST API 서버
- 마이크로서비스
- 확장 가능한 아키텍처가 필요한 경우

**예제**: [05-bulk-registration](../../examples/07-feature-first/05-bulk-registration/)

---

### 🔥 실전 예시: 100개 Feature 등록하기

**Bulk 등록 방식 (app.registerFeatures)**

```javascript
// app.js (단 6줄!)
const numflow = require('numflow')
const app = numflow()

app.registerFeatures('./features')
app.listen(3000, () => {
  console.log('Server running on port 3000')
})
```

**폴더 구조로 모든 것을 표현**:

```
features/
└── api/v1/
    ├── users/
    │   ├── post/index.js        → POST /api/v1/users
    │   ├── [id]/@get/index.js    → GET /api/v1/users/:id
    │   └── [id]/@put/index.js    → PUT /api/v1/users/:id
    ├── orders/
    │   ├── post/index.js        → POST /api/v1/orders
    │   └── [id]/@get/index.js    → GET /api/v1/orders/:id
    └── products/
        ├── get/index.js         → GET /api/v1/products
        └── [id]/@get/index.js    → GET /api/v1/products/:id
```

**장점**:
- ✅ **코드량 99% 감소** (400줄 → 8줄)
- ✅ 새 Feature 추가 시 폴더만 생성 (Zero Edit)
- ✅ 폴더 구조 = API 구조 (시각적 파악)
- ✅ 오타 가능성 제로

---

### numflow.feature() API (Convention over Configuration) ⭐

`numflow.feature()`는 Feature를 정의하는 함수입니다. **Convention over Configuration** 원칙을 따라 폴더 구조에서 자동으로 설정을 추론합니다.

**기본 사용법**:

```javascript
// features/api/v1/orders/@post/index.js
const numflow = require('numflow')

module.exports = numflow.feature({
  // method: 'POST' ← '@post' 폴더명에서 자동 추론
  // path: '/api/v1/orders' ← 폴더 구조에서 자동 추론
  // steps: './steps' ← ./steps 디렉토리 자동 인식
  // asyncTasks: './async-tasks' ← ./async-tasks 디렉토리 자동 인식

  // 필요한 경우만 추가 설정 작성
  middlewares: [authenticate, authorize],
  contextInitializer: (req, res) => ({
    userId: req.user?.id,
  }),
  onError: async (error, context, req, res) => {
    if (context.dbClient) {
      await context.dbClient.query('ROLLBACK')
    }
    res.statusCode = 500
    res.end(JSON.stringify({ error: error.message }))
  },
})
```

**폴더 구조**:

```
features/api/v1/orders/@post/
├── index.js            ← Feature 정의
├── steps/              ← 자동 인식
│   ├── 100-validate.js
│   └── 200-create.js
└── async-tasks/        ← 자동 인식
    └── send-email.js
```

**Convention 규칙**:
- **Method**: 폴더명 (get, post, put, patch, delete)
- **Path**: `/api/v1/orders` (method 폴더 이전 경로)
- **Steps**: `./steps` 디렉토리 (있으면 자동 인식)
- **Async Tasks**: `./async-tasks` 디렉토리 (있으면 자동 인식)

**수동 오버라이드**:

Convention을 무시하고 수동으로 설정할 수도 있습니다.

```javascript
// Convention을 무시하고 수동 설정
module.exports = numflow.feature({
  method: 'POST',            // 수동 설정
  path: '/custom/path',      // 수동 설정
  steps: './my-steps',       // 수동 설정
})
```

---

### contextInitializer

요청 데이터를 Context에 초기화하는 함수입니다.

**사용법**:

```javascript
// numflow.feature()에서 사용
module.exports = numflow.feature({
  contextInitializer: (ctx, req, res) => {
    ctx.userId = req.user?.id
    ctx.username = req.user?.username
    ctx.role = req.user?.role
  },
})
```

이제 모든 Step에서 `ctx.userId`, `ctx.username`, `ctx.role`에 접근할 수 있습니다.

```javascript
// steps/100-validate.js
module.exports = async (ctx, req, res) => {
  console.log(`User ${ctx.username} (${ctx.userId}) is creating a profile`)

  if (ctx.role !== 'admin') {
    throw new Error('Unauthorized')
  }
  // 끝! 자동으로 다음 Step 진행
}
```

---

## 실전 예제

실제 프로젝트에서 Feature-First를 사용하는 예제입니다. **Bulk Registration을 기본으로 사용**합니다.

### 사용자 등록 API (Bulk Registration)

**프로젝트 구조**:
```
my-app/
├── features/
│   └── api/
│       └── users/
│           └── register/
│               └── @post/                # POST /api/users/register
│                   ├── index.js         # Feature 설정
│                   └── steps/
│                       ├── 100-validate.js
│                       ├── 200-check-duplicates.js
│                       ├── 300-hash-password.js
│                       └── 400-create-user.js
└── app.js
```

**app.js (Bulk Registration)**:
```javascript
const numflow = require('numflow')
const app = numflow()

// 모든 Feature를 자동으로 스캔하고 등록
app.registerFeatures('./features')

// app.listen()은 Feature 등록 완료를 자동으로 대기한 후 서버 시작
app.listen(3000, () => {
  console.log('Server running on port 3000')
})
```

**Feature 설정 (features/api/users/register/@post/index.js)**:
```javascript
const numflow = require('numflow')

module.exports = numflow.feature({
  // method와 path는 폴더 구조에서 자동 추론!
  // method: 'POST'
  // path: '/api/users/register'

  onError: async (error, context, req, res) => {
    console.error('User registration failed:', error)
    res.statusCode = 500
    res.end(JSON.stringify({ error: error.message }))
  },
})
```

**Step 파일들**:
```javascript
// steps/100-validate.js
const Joi = require('joi')

const schema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  username: Joi.string().alphanum().min(3).max(30).required(),
})

module.exports = async (ctx, req, res) => {
  const { error, value} = schema.validate(req.body)  // req에서 직접 접근

  if (error) {
    throw new Error(`Validation failed: ${error.message}`)
  }

  ctx.validated = value  // ← 명시적으로 context에 저장
  // 끝! 자동으로 다음 Step 진행
}
```

```javascript
// steps/200-check-duplicates.js
const User = require('../../../../../models/User')

module.exports = async (ctx, req, res) => {
  const { email, username } = ctx.validated  // ← Context에서 직접 접근

  const existingUser = await User.findOne({
    $or: [{ email }, { username }]
  })

  if (existingUser) {
    throw new Error('Email or username already exists')
  }
  // 끝! 자동으로 다음 Step 진행
}
```

```javascript
// steps/300-hash-password.js
const bcrypt = require('bcrypt')

module.exports = async (ctx, req, res) => {
  const { password } = ctx.validated  // ← Context에서 직접 접근
  const hashedPassword = await bcrypt.hash(password, 10)

  ctx.hashedPassword = hashedPassword  // ← 명시적으로 context에 저장
  // 끝! 자동으로 다음 Step 진행
}
```

```javascript
// steps/400-create-user.js
const User = require('../../../../../models/User')

module.exports = async (ctx, req, res) => {
  const { email, username } = ctx.validated  // ← Context에서 직접 접근
  const { hashedPassword } = ctx  // ← Context에서 직접 접근

  const user = await User.create({
    email,
    username,
    password: hashedPassword,
  })

  ctx.user = {  // ← 명시적으로 context에 저장
    id: user.id,
    email: user.email,
    username: user.username,
  }
  // 끝! 자동으로 다음 Step 진행
}
```

---

## 미들웨어 통합

Feature에 미들웨어를 추가할 수 있습니다.

### 미들웨어 정의

```javascript
// middlewares/authenticate.js
module.exports = (req, res, next) => {
  const token = req.headers.authorization
  if (!token) {
    res.statusCode = 401
    res.end(JSON.stringify({ error: 'Unauthorized' }))
    return
  }
  req.user = verifyToken(token)
  next()
}

// middlewares/authorize.js
module.exports = (req, res, next) => {
  if (req.user.role !== 'admin') {
    res.statusCode = 403
    res.end(JSON.stringify({ error: 'Forbidden' }))
    return
  }
  next()
}
```

### Feature 레벨 미들웨어

```javascript
// features/api/admin/users/@post/index.js
const numflow = require('numflow')
const authenticate = require('../../../../../middlewares/authenticate')
const authorize = require('../../../../../middlewares/authorize')

module.exports = numflow.feature({
  // method: 'POST' (폴더명에서 자동 추론)
  // path: '/api/admin/users' (폴더 구조에서 자동 추론)

  middlewares: [authenticate, authorize],  // ← Feature 레벨 미들웨어
})
```

### 실행 순서

```
Global middlewares (app.use)
         ↓
Feature middlewares (numflow.feature)
         ↓
contextInitializer
         ↓
Steps (100 → 200 → 300 → ...)
```

---

## 에러 처리 (onError)

Feature 실행 중 발생한 에러를 사용자가 직접 처리할 수 있습니다.

### onError 핸들러

```javascript
// features/api/orders/@post/index.js
const numflow = require('numflow')

module.exports = numflow.feature({
  // method와 path는 폴더 구조에서 자동 추론

  onError: async (error, context, req, res) => {
    // 1. 에러 로깅
    console.error('Order creation failed:', error)

    // 2. 트랜잭션 롤백 (사용자가 직접 구현)
    if (context.dbClient) {
      await context.dbClient.query('ROLLBACK')
    }

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

### PostgreSQL 사용 시

```javascript
onError: async (error, context, req, res) => {
  // 트랜잭션 롤백
  if (context.client) {
    await context.client.query('ROLLBACK')
    context.client.release()
  }

  // 에러 응답
  res.statusCode = 500
  res.end(JSON.stringify({ error: error.message }))
}
```

### MongoDB 사용 시

```javascript
onError: async (error, context, req, res) => {
  // 트랜잭션 롤백
  if (context.session) {
    await context.session.abortTransaction()
    context.session.endSession()
  }

  // 에러 응답
  res.statusCode = 500
  res.end(JSON.stringify({ error: error.message }))
}
```

### Prisma 사용 시

```javascript
onError: async (error, context, req, res) => {
  // Prisma는 자동으로 롤백되므로 추가 작업 불필요

  // 에러 응답
  res.statusCode = 500
  res.end(JSON.stringify({ error: error.message }))
}
```

### contextInitializer에서 트랜잭션 시작

```javascript
// features/api/orders/@post/index.js
const numflow = require('numflow')

module.exports = numflow.feature({
  contextInitializer: async (ctx, req, res) => {
    // PostgreSQL 트랜잭션 시작
    const client = await pool.connect()
    await client.query('BEGIN')

    ctx.userId = req.user?.id
    ctx.client = client  // Step에서 사용 가능
  },
  onError: async (error, context, req, res) => {
    // 에러 발생 시 롤백
    if (context.client) {
      await context.client.query('ROLLBACK')
      context.client.release()
    }
    res.statusCode = 500
    res.end(JSON.stringify({ error: error.message }))
  },
})
```

### 에러 타입별 처리

```javascript
onError: async (error, context, req, res) => {
  // 트랜잭션 롤백
  if (context.client) {
    await context.client.query('ROLLBACK')
  }

  // 에러 타입별 처리
  if (error.message.includes('stock')) {
    res.statusCode = 400
    res.end(JSON.stringify({ error: 'Insufficient stock' }))
  } else if (error.message.includes('payment')) {
    res.statusCode = 402
    res.end(JSON.stringify({ error: 'Payment failed' }))
  } else {
    res.statusCode = 500
    res.end(JSON.stringify({ error: 'Internal server error' }))
  }
}
```

---

## Async Tasks

Step 실행 완료 후 비동기로 실행되는 작업입니다.

### 사용 시나리오

- ✅ 이메일 전송
- ✅ 푸시 알림
- ✅ Webhook 호출
- ✅ 로그 기록
- ✅ 캐시 업데이트
- ✅ 분석 데이터 전송

### 사용 방법

**폴더 구조**:
```
features/api/orders/@post/
├── index.js
├── steps/
│   ├── 100-validate.js
│   └── 200-create-order.js
└── async-tasks/         # ← 이 폴더가 있으면 자동 인식!
    ├── send-confirmation-email.js
    └── notify-slack.js
```

**Feature 설정 파일** (features/api/orders/@post/index.js):
```javascript
const numflow = require('numflow')

module.exports = numflow.feature({
  // asyncTasks: './async-tasks' ← 폴더가 있으면 자동 인식!
})
```

**Async Task 파일들**:
```javascript
// async-tasks/send-confirmation-email.js
const Email = require('../../../../../services/Email')

// AsyncTask 함수는 (ctx) 1개 파라미터만 받음
module.exports = async (ctx) => {
  const { order } = ctx  // ← Context에서 직접 접근

  await Email.send({
    to: order.userEmail,
    subject: 'Order Confirmation',
    template: 'order-confirmation',
    data: { order },
  })
}
```

```javascript
// async-tasks/notify-slack.js
const Slack = require('../../../../../services/Slack')

// AsyncTask 함수는 (ctx) 1개 파라미터만 받음
module.exports = async (ctx) => {
  const { order } = ctx  // ← Context에서 직접 접근

  await Slack.send({
    channel: '#orders',
    message: `New order: ${order.id}`,
  })
}
```

### 실행 순서

```
Steps 실행 → Steps 완료 → Async Tasks 큐잉
```

**중요**: Async Tasks는 모든 Step이 **성공적으로 완료된 후**에만 실행됩니다.

---

## 디버깅 및 로그 제어

Feature 실행 중 AutoExecutor는 각 step의 실행 상태를 자동으로 로깅합니다.

### 로그 출력 예시

개발 환경에서 Feature를 실행하면 다음과 같은 로그를 볼 수 있습니다:

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

**에러 발생 시:**

```
[AutoExecutor] [POST /api/orders] Executing 3 steps...
[AutoExecutor] [POST /api/orders] Executing step 100: 100-validate.js
[AutoExecutor] [POST /api/orders] ERROR: Step 100 failed: 주문 상품이 없습니다
```

### 로그 비활성화하기

프로덕션 환경에서는 Feature 로그를 비활성화할 수 있습니다.

**환경변수 설정:**

```bash
# 프로덕션 환경
DISABLE_FEATURE_LOGS=true node app.js

# 또는 .env 파일
DISABLE_FEATURE_LOGS=true
```

**테스트 환경에서는 자동 비활성화:**

```bash
# NODE_ENV=test일 때 자동으로 로그 비활성화
NODE_ENV=test npm test
```

**package.json 설정 예시:**

```json
{
  "scripts": {
    "start": "node app.js",
    "start:prod": "DISABLE_FEATURE_LOGS=true node app.js",
    "test": "NODE_ENV=test jest"
  }
}
```

더 자세한 내용은 [Feature API 문서 - 디버깅 및 로그 제어](../api/feature.md#디버깅-및-로그-제어)를 참고하세요.

---

## Best Practices

### 1. Step 번호는 100 단위로

```javascript
// ✅ Good
100-validate.js
200-check-stock.js
300-create-order.js

// ❌ Bad
1-validate.js
2-check-stock.js
3-create-order.js
```

**이유**: 나중에 중간 Step을 추가할 여지를 남김 (150, 250...)

### 2. 한 Step은 한 가지 일만

```javascript
// ✅ Good: 하나의 책임
// 100-validate.js
module.exports = async (ctx, req, res) => {
  validateEmail(req.body.email)  // req에서 직접 접근
  // 끝! 자동으로 다음 Step 진행
}

// 200-check-duplicate.js
module.exports = async (ctx, req, res) => {
  checkDuplicate(req.body.email)  // req에서 직접 접근
  // 끝! 자동으로 다음 Step 진행
}

// ❌ Bad: 여러 책임
// 100-validate-and-check.js
module.exports = async (ctx, req, res) => {
  validateEmail(req.body.email)
  checkDuplicate(req.body.email)  // 다른 책임
  // (여러 책임을 한 Step에 넣지 마세요)
}
```

### 3. Context 필드를 명확하게 명명

```javascript
// ✅ Good
ctx.order = order
ctx.payment = payment
ctx.invoice = invoice

// ❌ Bad
ctx.data = order
ctx.result = payment
ctx.obj = invoice
```

### 4. onError에서 적절한 에러 처리

```javascript
// ✅ Good: 트랜잭션 롤백 및 에러 타입별 응답
onError: async (error, context, req, res) => {
  // 트랜잭션 롤백
  if (context.client) {
    await context.client.query('ROLLBACK')
  }

  // 에러 타입별 처리
  if (error.message.includes('validation')) {
    res.statusCode = 400
  } else {
    res.statusCode = 500
  }
  res.end(JSON.stringify({ error: error.message }))
}

// ❌ Bad: 에러 처리 없음
onError: async (error, context, req, res) => {
  res.statusCode = 500
  res.end('Error')
}
```

### 5. Async Tasks는 멱등성 보장

```javascript
// ✅ Good: 중복 실행해도 안전
// AsyncTask 함수는 (ctx) 1개 파라미터만 받음
module.exports = async (ctx) => {
  const { orderId } = ctx.order  // ← Context에서 직접 접근

  // 이미 전송했는지 확인
  const sent = await EmailLog.findOne({ orderId })
  if (sent) return

  await sendEmail(orderId)
  await EmailLog.create({ orderId })
}

// ❌ Bad: 중복 실행 시 문제 발생
module.exports = async (ctx) => {
  await sendEmail(ctx.order.id)
}
```

### 6. 테스트 작성

각 Step을 독립적으로 테스트할 수 있습니다.

```javascript
// __tests__/100-validate.test.js
const validate = require('../steps/100-validate')

describe('100-validate', () => {
  it('should validate email', async () => {
    // Step 함수는 (ctx, req, res) 3개 파라미터
    const ctx = {}
    const req = { body: { email: 'test@example.com' } }
    const res = {}

    const result = await validate(ctx, req, res)
    expect(result).toBe(true)
    expect(ctx.validated).toBe(true)  // ← Context에서 직접 확인
  })

  it('should throw error if email is missing', async () => {
    const ctx = {}
    const req = { body: {} }
    const res = {}

    await expect(validate(ctx, req, res)).rejects.toThrow('Email is required')
  })
})
```

---

## 다음 단계

- **[Feature API 문서](../api/feature.md)** - 상세한 API 레퍼런스
- **[Application API](../api/application.md)** - app.registerFeatures() API
- **[Examples](../../examples/)** - 실전 예제 코드
- **[프로젝트 구조 가이드](PROJECT_STRUCTURE.md)** - Feature-First 아키텍처 상세 가이드

---

**마지막 업데이트**: 2025-11-10 (다중 Features 디렉토리 등록 및 라우트 충돌 처리 가이드 추가)
**이전**: 2025-10-18 `, AsyncTask 함수 `(ctx)`, 모든 예제 수정)
**이전**: [목차](./README.md)
