# 에러 처리 (Error Handling)

## 목차

- [자동 에러 처리](#자동-에러-처리)
- [에러 클래스](#에러-클래스)
  - [ValidationError (검증 에러)](#validationerror-검증-에러)
  - [BusinessError (비즈니스 로직 에러)](#businesserror-비즈니스-로직-에러)
  - [기타 에러 클래스](#기타-에러-클래스)
- [글로벌 에러 핸들러](#글로벌-에러-핸들러)
- [실전 예제: 사용자 관리 API](#실전-예제-사용자-관리-api)
- [테스트](#테스트)
- [Feature 에러 처리](#feature-에러-처리)
  - [Feature 에러 재시도 (Retry)](#feature-에러-재시도-retry)
- [개발 vs 프로덕션](#개발-vs-프로덕션)
- [핵심 장점](#핵심-장점)

---

Numflow는 통합 에러 처리 시스템을 제공합니다. **try-catch 없이도** 에러를 자동으로 캐치하고 적절한 HTTP 응답으로 변환합니다.

## 자동 에러 처리

비동기 핸들러와 동기 핸들러에서 발생한 에러는 자동으로 캐치됩니다.

```javascript
const numflow = require('numflow')
const { NotFoundError } = numflow
const app = numflow()

// try-catch 불필요! 자동으로 에러 캐치
app.get('/users/:id', async (req, res) => {
  const user = await db.findUser(req.params.id)  // Promise rejection 자동 캐치

  if (!user) {
    throw new NotFoundError('User not found')  // 자동으로 404 응답
  }

  res.json(user)
})

// 동기 에러도 자동 캐치
app.get('/sync-error', (req, res) => {
  throw new Error('Sync error')  // 자동으로 500 응답
})
```

## 에러 클래스

Numflow는 12개의 HTTP 에러 클래스를 제공합니다:

```javascript
const {
  ValidationError,      // 400 - 검증 에러
  BusinessError,        // 400 - 비즈니스 로직 에러
  UnauthorizedError,    // 401 - 인증 필요
  ForbiddenError,       // 403 - 권한 없음
  NotFoundError,        // 404 - 리소스 없음
  ConflictError,        // 409 - 충돌
  PayloadTooLargeError, // 413 - 페이로드 크기 초과
  TooManyRequestsError, // 429 - 요청 제한 초과
  InternalServerError,  // 500 - 서버 에러
  NotImplementedError,  // 501 - 미구현
  ServiceUnavailableError, // 503 - 서비스 이용 불가
} = require('numflow')
```

### ValidationError (검증 에러)

필드별 에러 메시지를 포함할 수 있습니다:

```javascript
const { ValidationError } = require('numflow')

app.post('/register', (req, res) => {
  const { email, password } = req.body

  const errors = {}
  if (!email) errors.email = ['Email is required']
  if (!password || password.length < 8) {
    errors.password = ['Password must be at least 8 characters']
  }

  if (Object.keys(errors).length > 0) {
    throw new ValidationError('Validation failed', errors)
  }

  res.json({ success: true })
})
```

**응답:**
```json
{
  "error": {
    "message": "Validation failed",
    "statusCode": 400,
    "validationErrors": {
      "email": ["Email is required"],
      "password": ["Password must be at least 8 characters"]
    }
  }
}
```

### BusinessError (비즈니스 로직 에러)

에러 코드를 포함할 수 있습니다:

```javascript
const { BusinessError } = require('numflow')

app.post('/withdraw', (req, res) => {
  const { amount } = req.body
  const balance = 100  // 실제로는 DB에서 조회

  if (amount > balance) {
    throw new BusinessError('Insufficient balance', 'INSUFFICIENT_BALANCE')
  }

  res.json({ success: true })
})
```

**응답:**
```json
{
  "error": {
    "message": "Insufficient balance",
    "statusCode": 400,
    "code": "INSUFFICIENT_BALANCE"
  }
}
```

### 기타 에러 클래스

```javascript
const {
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
} = require('numflow')

// 인증 필요
app.get('/protected', (req, res) => {
  if (!req.get('Authorization')) {
    throw new UnauthorizedError('Authorization required')
  }
  res.json({ data: 'protected' })
})

// 권한 없음
app.delete('/admin/users/:id', (req, res) => {
  if (!req.user.isAdmin) {
    throw new ForbiddenError('Admin access required')
  }
  res.json({ success: true })
})

// 리소스 없음
app.get('/users/:id', async (req, res) => {
  const user = await db.findUser(req.params.id)
  if (!user) {
    throw new NotFoundError('User not found')
  }
  res.json(user)
})

// 충돌
app.post('/users', async (req, res) => {
  const exists = await db.findUserByEmail(req.body.email)
  if (exists) {
    throw new ConflictError('Email already exists')
  }
  res.status(201).json({ success: true })
})
```

## 글로벌 에러 핸들러

`app.onError()`로 중앙 집중식 에러 처리를 구현할 수 있습니다:

```javascript
const numflow = require('numflow')
const {
  ValidationError,
  NotFoundError,
  BusinessError,
  UnauthorizedError,
} = numflow

const app = numflow()

// 글로벌 에러 핸들러
app.onError((err, req, res) => {
  console.error('Error:', err)

  const statusCode = err.statusCode || 500
  const errorResponse = {
    error: {
      message: err.message,
      statusCode
    }
  }

  // ValidationError: 필드별 에러 포함
  if (err.validationErrors) {
    errorResponse.error.validationErrors = err.validationErrors
  }

  // BusinessError: 에러 코드 포함
  if (err.code) {
    errorResponse.error.code = err.code
  }

  // 개발 환경: 스택 트레이스 포함
  if (process.env.NODE_ENV !== 'production') {
    errorResponse.error.stack = err.stack
  }

  res.statusCode = statusCode
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(errorResponse))
})
```

## 실전 예제: 사용자 관리 API

```javascript
const numflow = require('numflow')
const {
  ValidationError,
  NotFoundError,
  ConflictError,
  UnauthorizedError,
} = numflow

const app = numflow()

// 사용자 생성
app.post('/api/users', async (req, res) => {
  const { email, password, name } = req.body

  // 검증
  const errors = {}
  if (!email?.includes('@')) errors.email = ['Invalid email']
  if (!password || password.length < 8) {
    errors.password = ['Password must be at least 8 characters']
  }
  if (!name) errors.name = ['Name is required']

  if (Object.keys(errors).length > 0) {
    throw new ValidationError('Validation failed', errors)
  }

  // 중복 확인
  const exists = await db.findUserByEmail(email)
  if (exists) {
    throw new ConflictError('Email already exists')
  }

  // 사용자 생성
  const user = await db.createUser({ email, password, name })
  res.status(201).json({ user })
})

// 사용자 조회
app.get('/api/users/:id', async (req, res) => {
  const user = await db.findUser(req.params.id)

  if (!user) {
    throw new NotFoundError('User not found')
  }

  res.json({ user })
})

// 사용자 수정 (인증 필요)
app.put('/api/users/:id', async (req, res) => {
  const token = req.get('Authorization')
  if (!token) {
    throw new UnauthorizedError('Authorization required')
  }

  const user = await db.findUser(req.params.id)
  if (!user) {
    throw new NotFoundError('User not found')
  }

  // 업데이트
  await db.updateUser(req.params.id, req.body)
  res.json({ success: true })
})

// 글로벌 에러 핸들러
app.onError((err, req, res) => {
  const statusCode = err.statusCode || 500

  res.status(statusCode).json({
    error: {
      message: err.message,
      statusCode,
      ...(err.validationErrors && { validationErrors: err.validationErrors }),
      ...(err.code && { code: err.code }),
    }
  })
})

app.listen(3000)
```

## 테스트

```bash
# 성공 케이스
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"password123","name":"Alice"}'

# 검증 에러 (400)
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"email":"invalid","password":"123"}'

# 사용자 없음 (404)
curl http://localhost:3000/api/users/999

# 인증 필요 (401)
curl -X PUT http://localhost:3000/api/users/1 \
  -H "Content-Type: application/json" \
  -d '{"name":"Updated Name"}'
```

## Feature 에러 처리

Feature-First Auto-Orchestration에서도 에러 처리가 자동으로 통합됩니다:

```javascript
// features/create-order/steps/100-validate-order.js
const { ValidationError } = require('numflow')

async function validateOrder(context) {
  const { orderData } = context

  if (!orderData.productId) {
    throw new ValidationError('Validation failed', {
      productId: ['Product ID is required']
    })
  }

  ctx.validated = true
  // 끝! 자동으로 다음 Step 진행
}

module.exports = validateOrder
```

**에러 발생 시:**
- Feature Step 에러가 `FeatureExecutionError`로 자동 래핑
- Step 정보 포함
- 글로벌 에러 핸들러로 전달
- onError를 통한 롤백 처리 (사용자 정의)

**응답 형식:**
```json
{
  "error": {
    "message": "Validation failed",
    "statusCode": 400,
    "step": {
      "number": 100,
      "name": "100-validate-order.js"
    },
    "validationErrors": {
      "productId": ["Product ID is required"]
    }
  }
}
```

### 커스텀 에러 처리와 originalError 보존

Numflow는 Step에서 throw된 에러를 FeatureError로 래핑할 때 **원본 에러를 자동으로 보존**합니다. 이를 통해 커스텀 에러의 모든 속성(`code`, `validationErrors` 등)을 잃지 않고 그대로 사용할 수 있습니다.

#### Step에서 커스텀 에러 던지기

Step에서 그냥 에러를 throw하면 됩니다. 모든 커스텀 속성이 자동으로 보존됩니다:

```javascript
// features/api/orders/post/steps/100-check-stock.js
const { BusinessError } = require('numflow')

module.exports = async (ctx, req, res) => {
  const stock = await db.getStock(ctx.productId)

  if (stock === 0) {
    // ✅ code 속성이 자동으로 보존됩니다!
    throw new BusinessError('Out of stock', 'OUT_OF_STOCK')
  }

  ctx.stockLevel = stock
}
```

**자동 응답:**
```json
{
  "error": {
    "message": "Out of stock",
    "statusCode": 400,
    "code": "OUT_OF_STOCK",
    "step": {
      "number": 100,
      "name": "100-check-stock.js"
    }
  }
}
```

#### onError에서 originalError 접근하기

Feature의 `onError` 핸들러에서 `error.originalError`를 통해 커스텀 속성에 접근할 수 있습니다:

```javascript
// features/api/payments/post/index.js
const numflow = require('numflow')

module.exports = numflow.feature({
  onError: async (error, ctx, req, res) => {
    // ✅ originalError.code로 에러 코드 확인
    if (error.originalError && error.originalError.code === 'NETWORK_ERROR') {
      // Fallback provider로 전환 후 재시도
      ctx.fallbackProvider = 'backup'
      return numflow.retry({ delay: 10, maxAttempts: 2 })
    }

    // ✅ originalError.validationErrors 접근
    if (error.originalError && error.originalError.validationErrors) {
      res.statusCode = 400
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({
        success: false,
        errors: error.originalError.validationErrors
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

#### 커스텀 에러 클래스 만들기

HttpError를 확장하여 자신만의 에러 클래스를 만들 수 있습니다. **모든 커스텀 속성이 자동으로 응답에 포함됩니다:**

```javascript
// errors/PaymentError.js
const { HttpError } = require('numflow')

class PaymentError extends HttpError {
  constructor(message, transactionId, provider) {
    super(message, 400)
    this.transactionId = transactionId  // 커스텀 속성 1
    this.provider = provider            // 커스텀 속성 2
    this.retryable = true               // 커스텀 속성 3
  }
}

module.exports = PaymentError
```

**Step에서 사용:**
```javascript
// features/api/orders/get/steps/100-fetch.js
const PaymentError = require('../../../../errors/PaymentError.js')

module.exports = async (ctx, req, res) => {
  const result = await processPayment()

  if (!result.success) {
    throw new PaymentError('Payment failed', 'tx_123', 'stripe')
  }
}
```

**자동 응답 (모든 커스텀 속성 포함!):**
```json
{
  "error": {
    "message": "Payment failed",
    "statusCode": 400,
    "transactionId": "tx_123",
    "provider": "stripe",
    "retryable": true,
    "step": {
      "number": 100,
      "name": "100-fetch.js"
    }
  }
}
```

#### onError에서 커스텀 속성 활용

```javascript
// features/api/orders/get/index.js
const numflow = require('numflow')

module.exports = numflow.feature({
  onError: async (error, ctx, req, res) => {
    // ✅ 커스텀 에러의 모든 속성 접근 가능!
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
  }
})
```

#### 핵심 장점

✅ **자동 속성 보존**: Step에서 throw한 모든 커스텀 속성이 자동으로 보존됨
✅ **onError 접근**: `error.originalError`를 통해 모든 커스텀 속성에 접근 가능
✅ **재시도 로직**: 에러 코드에 따라 조건부 재시도 구현 가능
✅ **확장 가능**: 새로운 커스텀 에러를 만들어도 코드 수정 불필요 (자동으로 작동!)
✅ **글로벌 응답**: 글로벌 에러 핸들러도 자동으로 커스텀 속성 포함

#### 주의사항

⚠️ **표준 Error 속성 제외**: `message`, `stack`, `name` 등은 자동으로 제외됨 (중복 방지)
⚠️ **onError 우선**: onError에서 응답을 직접 보내면 글로벌 에러 핸들러는 실행되지 않음

---

### onError와 글로벌 에러 핸들러 통합

`onError`가 전역 에러 핸들러(`app.onError` 또는 `app.use((err, req, res, next) => {...})`)와 어떻게 상호작용하는지 이해하는 것이 중요합니다.

#### 에러 흐름 의사결정 트리

```
Step에서 에러 발생
    ↓
Feature에 onError가 있는가?
    ├─ NO  → 자동으로 FeatureExecutionError로 래핑
    │         → 글로벌 에러 핸들러로 전달 ✅
    │
    └─ YES → onError 실행
              ↓
              onError가 무엇을 반환하는가?
              ├─ 응답 전송 (res.json/send/end)
              │   → 글로벌 에러 핸들러 실행 안 됨 ❌
              │
              ├─ RETRY 시그널 반환
              │   → Feature 재시도 (글로벌 에러 핸들러 없음)
              │
              └─ 에러 throw (throw error)
                  → 글로벌 에러 핸들러로 전달 ✅
```

---

#### 패턴 1: onError에서 응답 전송 (글로벌 핸들러 실행 안 됨)

`onError`에서 응답을 보내면 요청이 즉시 종료되고 글로벌 에러 핸들러는 **실행되지 않습니다**.

```javascript
// Feature 설정
const numflow = require('numflow')

module.exports = numflow.feature({
  onError: async (error, ctx, req, res) => {
    // Cleanup (예: 트랜잭션 롤백)
    if (ctx.transaction) {
      await ctx.transaction.rollback()
    }

    // 응답 전송 → 글로벌 에러 핸들러 실행 안 됨
    res.status(500).json({
      error: error.message,
      orderId: ctx.orderId
    })

    // 암묵적 return → 여기서 실행 종료
  }
})

// 글로벌 에러 핸들러
app.use((err, req, res, next) => {
  // ❌ 실행되지 않음!
  console.log('글로벌 에러 핸들러:', err)
})
```

**사용 시나리오:**
- Feature별 커스텀 에러 응답
- Feature마다 다른 에러 포맷
- 비즈니스 도메인별로 다른 에러 처리 로직

---

#### 패턴 2: onError에서 throw (글로벌 핸들러 실행됨)

`onError`에서 에러를 throw하면 글로벌 에러 핸들러로 전달됩니다.

```javascript
// Feature 설정
const numflow = require('numflow')

module.exports = numflow.feature({
  onError: async (error, ctx, req, res) => {
    // Cleanup만 수행 (응답 없음)
    if (ctx.transaction) {
      await ctx.transaction.rollback()
    }

    // 에러 throw → 글로벌 에러 핸들러로 전달
    throw error
  }
})

// 글로벌 에러 핸들러
app.use((err, req, res, next) => {
  // ✅ 실행됨!
  console.log('글로벌 에러 핸들러:', err)

  // 통합 에러 로깅
  logger.error('에러 발생', {
    message: err.message,
    stack: err.stack,
    path: req.path
  })

  // 통합 에러 응답
  res.status(err.statusCode || 500).json({
    error: err.message,
    code: err.code || 'INTERNAL_ERROR',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  })
})
```

**사용 시나리오:**
- 중앙집중식 에러 로깅
- 통일된 에러 응답 포맷
- Feature에서는 cleanup만, 응답은 글로벌 핸들러에서

---

#### 패턴 3: onError 없음 (글로벌 핸들러 자동 실행)

Feature에 `onError` 핸들러가 없으면 에러가 자동으로 글로벌 에러 핸들러로 전달됩니다.

**소스 코드 참조:**
```typescript
// src/feature/index.ts (line 267-279)
// Pass to Global Error Handler if no custom error handler
// Wrap with FeatureExecutionError
throw new FeatureExecutionError(error as Error, step)
```

**예제:**

```javascript
// Feature 설정 - onError 없음
const numflow = require('numflow')

module.exports = numflow.feature({
  // onError 핸들러 없음
  contextInitializer: (ctx, req, res) => {
    ctx.userId = req.user?.id
  }
})

// Step에서 에러 발생
// steps/100-validate.js
const { ValidationError } = require('numflow')

module.exports = async (ctx, req, res) => {
  if (!ctx.userId) {
    throw new ValidationError('User ID is required', {
      userId: ['사용자 인증이 필요합니다']
    })
  }
}

// 글로벌 에러 핸들러
app.use((err, req, res, next) => {
  // ✅ 실행됨!
  // err는 FeatureExecutionError로 래핑됨
  // err.originalError에 ValidationError가 있음

  const original = err.originalError || err

  res.status(original.statusCode || 500).json({
    error: original.message,
    validationErrors: original.validationErrors,
    step: err.step  // { number: 100, name: "100-validate.js" }
  })
})
```

**사용 시나리오:**
- cleanup 로직이 필요 없는 간단한 Feature
- 중앙집중식 에러 처리
- 트랜잭션 관리가 필요 없는 경우

---

#### 비교 테이블

| 패턴 | onError 핸들러 | 응답 전송 위치 | 글로벌 핸들러 실행 | 사용 시나리오 |
|------|---------------|---------------|------------------|---------------|
| **1. 응답 전송** | ✅ 있음 | onError에서 | ❌ **실행 안 됨** | Feature별 커스텀 응답 포맷 |
| **2. throw** | ✅ 있음 | 글로벌 핸들러에서 | ✅ **실행됨** | Cleanup + 통합 응답 |
| **3. onError 없음** | ❌ 없음 | 글로벌 핸들러에서 | ✅ **실행됨** | 간단한 Feature, 중앙집중식 처리 |

---

#### 권장 방법

**권장: 패턴 2 (Cleanup + Throw)**

```javascript
// Feature는 cleanup만, 글로벌 핸들러가 응답 담당
module.exports = numflow.feature({
  contextInitializer: async (ctx, req, res) => {
    ctx.transaction = await sequelize.transaction()
  },

  onError: async (error, ctx, req, res) => {
    // ✅ Cleanup만 수행
    if (ctx.transaction) {
      await ctx.transaction.rollback()
    }

    // ✅ 글로벌 핸들러로 throw
    throw error
  }
})

// 글로벌 핸들러: 통합 로깅 + 응답
app.use((err, req, res, next) => {
  // 중앙집중식 로깅
  logger.error({
    message: err.message,
    path: req.path,
    userId: req.user?.id
  })

  // 중앙집중식 응답 포맷
  res.status(err.statusCode || 500).json({
    error: err.message,
    code: err.code
  })
})
```

**장점:**
- ✅ 관심사 분리 (cleanup vs 응답)
- ✅ 중앙집중식 에러 로깅
- ✅ 통일된 에러 응답 포맷
- ✅ 유지보수 용이

---

#### 안티패턴: 응답 + Throw

**❌ 하지 말아야 할 것:**

```javascript
onError: async (error, ctx, req, res) => {
  await ctx.transaction.rollback()

  res.status(500).json({ error: error.message })  // ← 응답 전송

  throw error  // ← ❌ 응답 후 throw!
  // 글로벌 핸들러가 실행되지만 응답을 보낼 수 없음 (헤더 이미 전송됨)
  // "Error: Cannot set headers after they are sent" 경고 발생 가능
}
```

**✅ 올바른 방법:**

```javascript
// 방법 1: 응답만 전송
onError: async (error, ctx, req, res) => {
  await ctx.transaction.rollback()
  res.status(500).json({ error: error.message })
  return  // ← 명시적 return (throw 없음)
}

// 방법 2: throw만 (응답은 글로벌 핸들러에서)
onError: async (error, ctx, req, res) => {
  await ctx.transaction.rollback()
  throw error  // ← 여기서는 응답 없음
}
```

---

### Feature 에러 재시도 (Retry)

Feature의 onError 핸들러에서 `numflow.retry()`를 반환하면 Feature를 자동으로 재시도합니다.

**기본 사용법:**

```javascript
// features/api/chat/post/index.js
const numflow = require('numflow')

module.exports = numflow.feature({
  contextInitializer: (ctx, req, res) => {
    ctx.currentProvider = 'openai'
    ctx.retryCount = 0
  },

  onError: async (error, ctx, req, res) => {
    // Rate limit 에러 → Provider 변경 후 재시도
    if (error.message.includes('rate_limit')) {
      ctx.currentProvider = 'openrouter'
      return numflow.retry({ delay: 500 })
    }

    // Timeout 에러 → Exponential backoff로 재시도
    if (error.message.includes('timeout')) {
      ctx.retryCount++
      if (ctx.retryCount <= 3) {
        const delay = 1000 * Math.pow(2, ctx.retryCount - 1)
        return numflow.retry({ delay })
      }
    }

    // 재시도 불가능한 에러 → 응답 반환
    res.status(500).json({ error: error.message })
  }
})
```

**주요 특징:**
- ✅ Context 유지: Provider fallback, retry count 등 저장 가능
- ✅ delay 옵션: 재시도 전 대기 시간 지정
- ✅ maxAttempts 옵션: 최대 재시도 횟수 제한
- ✅ 초고속 성능: Symbol 기반 (0.005µs)

**상세 문서:** [Feature API - 에러 재시도](../api/feature.md#에러-재시도-retry-)

## 개발 vs 프로덕션

```javascript
// 개발 환경: 상세한 에러 정보
if (process.env.NODE_ENV !== 'production') {
  app.onError((err, req, res) => {
    res.status(err.statusCode || 500).json({
      error: {
        message: err.message,
        statusCode: err.statusCode || 500,
        stack: err.stack,  // 스택 트레이스 포함
      }
    })
  })
} else {
  // 프로덕션 환경: 안전한 메시지만
  app.onError((err, req, res) => {
    // 에러 로깅 (외부 서비스로 전송)
    logger.error({
      message: err.message,
      stack: err.stack,
      timestamp: new Date(),
    })

    // 사용자에게는 안전한 메시지만
    res.status(err.statusCode || 500).json({
      error: {
        message: err.message || 'Internal server error',
        statusCode: err.statusCode || 500,
      }
    })
  })
}
```

## 핵심 장점

✅ **try-catch 불필요**: 비동기/동기 에러 자동 캐치
✅ **타입별 HTTP 응답**: 에러 클래스마다 적절한 statusCode 자동 설정
✅ **상세한 에러 정보**: ValidationError는 필드별 에러, BusinessError는 에러 코드 포함
✅ **Feature 통합**: Feature Step 에러도 자동으로 글로벌 핸들러로 전달
✅ **중앙 집중식 처리**: app.onError()로 모든 에러를 한 곳에서 관리

---

**마지막 업데이트**: 2025-11-17 (커스텀 에러 originalError 보존 기능 추가)
**이전 업데이트**: 2025-10-20 (retry 기능 추가)

**이전**: [목차](./README.md)
