# 에러 처리 (Error Handling)

Numflow는 Express와 동일한 방식의 단순한 에러 처리를 제공합니다.

## 목차

- [기본 에러 처리](#기본-에러-처리)
- [statusCode 지정하기](#statuscode-지정하기)
- [Feature의 onError 핸들러](#feature의-onerror-핸들러)
- [글로벌 에러 핸들러](#글로벌-에러-핸들러)
- [Step 정보 확인하기](#step-정보-확인하기)
- [원본 에러 접근하기](#원본-에러-접근하기)
- [재시도 (Retry)](#재시도-retry)
- [개발 vs 프로덕션](#개발-vs-프로덕션)

---

## 기본 에러 처리

Step에서 에러를 던지면 자동으로 처리됩니다.

```javascript
// features/api/users/@get/steps/100-fetch.js
module.exports = async (ctx, req, res) => {
  const user = await db.findUser(req.params.id)

  if (!user) {
    throw new Error('User not found')  // 500 에러로 처리됨
  }

  ctx.user = user
}
```

**자동 응답 (500 Internal Server Error):**
```json
{
  "error": {
    "message": "User not found",
    "statusCode": 500
  }
}
```

---

## statusCode 지정하기

에러에 `statusCode` 속성을 추가하면 해당 상태 코드로 응답합니다.

```javascript
// features/api/users/@get/steps/100-fetch.js
module.exports = async (ctx, req, res) => {
  const user = await db.findUser(req.params.id)

  if (!user) {
    const error = new Error('User not found')
    error.statusCode = 404  // 404로 응답
    throw error
  }

  ctx.user = user
}
```

**응답 (404 Not Found):**
```json
{
  "error": {
    "message": "User not found",
    "statusCode": 404
  }
}
```

### 헬퍼 함수 만들기

반복적인 코드를 줄이려면 헬퍼 함수를 만들어 사용하세요:

```javascript
// utils/errors.js
function createError(message, statusCode) {
  const error = new Error(message)
  error.statusCode = statusCode
  return error
}

module.exports = { createError }
```

```javascript
// Step에서 사용
const { createError } = require('../../utils/errors')

module.exports = async (ctx, req, res) => {
  const user = await db.findUser(req.params.id)

  if (!user) {
    throw createError('User not found', 404)
  }

  ctx.user = user
}
```

---

## Feature의 onError 핸들러

Feature별로 에러를 처리할 수 있습니다. **ctx에 접근 가능**하여 트랜잭션 롤백 등을 할 수 있습니다.

```javascript
// features/api/orders/@post/index.js
const numflow = require('numflow')

module.exports = numflow.feature({
  contextInitializer: async (ctx, req, res) => {
    ctx.transaction = await db.beginTransaction()
  },

  onError: async (error, ctx, req, res) => {
    console.log('에러 발생:', error.message)

    // 트랜잭션 롤백
    if (ctx.transaction) {
      await ctx.transaction.rollback()
    }

    // 직접 응답 보내기
    const statusCode = error.statusCode || 500
    res.statusCode = statusCode
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({
      success: false,
      error: error.message
    }))
  }
})
```

### onError에서 글로벌 핸들러로 위임

```javascript
// features/api/orders/@post/index.js
module.exports = numflow.feature({
  onError: async (error, ctx, req, res) => {
    // 트랜잭션 롤백만 수행
    if (ctx.transaction) {
      await ctx.transaction.rollback()
    }

    // 글로벌 핸들러로 위임
    throw error
  }
})
```

---

## 글로벌 에러 핸들러

Express 스타일 에러 미들웨어를 사용하여 모든 라우트와 Feature에서 발생하는 에러를 한 곳에서 처리합니다.

```javascript
// app.js
const numflow = require('numflow')
const app = numflow()

// 글로벌 에러 핸들러 (Express 스타일, 4개의 매개변수)
app.use((err, req, res, next) => {
  console.error('에러:', err.message)

  const statusCode = err.statusCode || 500

  res.status(statusCode).json({
    success: false,
    error: err.message
  })
})

app.registerFeatures('./features')
app.listen(3000)
```

**중요:** 에러 미들웨어는 정확히 4개의 매개변수 `(err, req, res, next)`를 가져야 합니다. 이것이 Numflow (그리고 Express)가 에러 미들웨어를 일반 미들웨어와 구분하는 방법입니다.

---

## Step 정보 확인하기

Feature에서 에러가 발생하면 자동으로 **FeatureError**로 래핑되어 Step 정보가 포함됩니다.

```javascript
// 에러 미들웨어에서 Step 정보 확인
app.use((err, req, res, next) => {
  // FeatureError인 경우 step 정보 포함
  if (err.step) {
    console.error(`에러 발생 위치: Step ${err.step.number} (${err.step.name})`)
    // 출력: 에러 발생 위치: Step 300 (300-check-stock.js)
  }

  const statusCode = err.statusCode || 500
  res.status(statusCode).json({
    error: err.message,
    ...(err.step && { step: err.step })  // 응답에 step 정보 포함
  })
})
```

**에러 응답 예시:**
```json
{
  "error": "Out of stock",
  "step": {
    "number": 300,
    "name": "300-check-stock.js"
  }
}
```

---

## 원본 에러 접근하기

FeatureError는 원본 에러를 `originalError` 속성에 보존합니다. 직접 접근할 수 있습니다.

```javascript
app.use((err, req, res, next) => {
  // 원본 에러 직접 접근
  const originalError = err.originalError || err

  // 원본 에러의 커스텀 속성 접근
  const statusCode = originalError.statusCode || 500
  const code = originalError.code  // 커스텀 code 속성

  res.status(statusCode).json({
    error: originalError.message,
    ...(code && { code })
  })
})
```

---

## 재시도 (Retry)

`onError`에서 `numflow.retry()`를 반환하면 Feature를 재시도합니다.

```javascript
// features/api/chat/@post/index.js
const numflow = require('numflow')

module.exports = numflow.feature({
  contextInitializer: (ctx, req, res) => {
    ctx.provider = 'openai'
    ctx.retryCount = 0
  },

  onError: async (error, ctx, req, res) => {
    // Rate limit 에러 → Provider 변경 후 재시도
    if (error.message.includes('rate_limit')) {
      const providers = ['openai', 'anthropic', 'gemini']
      const currentIndex = providers.indexOf(ctx.provider)

      if (currentIndex < providers.length - 1) {
        ctx.provider = providers[currentIndex + 1]
        return numflow.retry({ delay: 500 })  // 0.5초 후 재시도
      }
    }

    // Timeout 에러 → Exponential backoff
    if (error.message.includes('timeout')) {
      ctx.retryCount++
      if (ctx.retryCount <= 3) {
        const delay = 1000 * Math.pow(2, ctx.retryCount - 1)  // 1s, 2s, 4s
        return numflow.retry({ delay, maxAttempts: 3 })
      }
    }

    // 재시도 불가능 → 글로벌 핸들러로
    throw error
  }
})
```

**retry() 옵션:**
- `delay`: 재시도 전 대기 시간 (ms)
- `maxAttempts`: 최대 재시도 횟수

---

## 개발 vs 프로덕션

```javascript
// app.js
const numflow = require('numflow')
const app = numflow()

const isProd = process.env.NODE_ENV === 'production'

app.use((err, req, res, next) => {
  // 로깅
  if (isProd) {
    // 프로덕션: 외부 서비스로 전송
    errorTracker.capture(err, { req })
  } else {
    // 개발: 콘솔 출력
    console.error(err.stack)
  }

  // 응답
  const statusCode = err.statusCode || 500

  res.status(statusCode).json({
    success: false,
    error: isProd ? 'Internal Server Error' : err.message,
    // 개발 환경에서만 스택 포함
    ...(!isProd && { stack: err.stack })
  })
})
```

---

## 요약

| 핸들러 | 범위 | ctx 접근 | 용도 |
|--------|------|----------|------|
| **Feature onError** | Feature 전용 | 가능 | 트랜잭션 롤백, 재시도 |
| **에러 미들웨어** | 전체 앱 | 불가 | 통합 로깅, 응답 포맷 |

---

## 에러 처리 흐름

```
Step에서 throw new Error()
         ↓
    Feature에 onError 있음?
         ↓
    ┌────┴────┐
   Yes        No
    ↓          ↓
onError()   FeatureError로 wrap (step 정보 포함)
실행          ↓
    ↓      에러 미들웨어로 전달
    │
    ├─ 응답 전송 (res.json/end)
    │   → 끝 (에러 미들웨어 실행 안 됨)
    │
    ├─ numflow.retry() 반환
    │   → Feature 재시도
    │
    └─ throw error
        → 에러 미들웨어로 전달 (app.use 4개 매개변수)
```

---

**마지막 업데이트**: 2025-11-27 (getOriginalError() 제거, err.originalError 직접 접근)

**이전**: [목차](./README.md)
