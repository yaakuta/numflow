# 에러 처리 (Error Handling)

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

**마지막 업데이트**: 2025-10-20 (retry 기능 추가)
**이전 업데이트**: 2025-10-16 (transaction 제거, onError 패턴 적용)

**이전**: [목차](./README.md)
