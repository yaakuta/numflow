# AsyncTasks 완벽 가이드
> **Numflow Feature API의 비동기 작업 자동 실행 (v0.3.0)**

---

## 📋 목차

1. [AsyncTask란?](#asynctask란)
2. [왜 필요한가?](#왜-필요한가)
3. [실행 타이밍 (언제 실행되는가?)](#실행-타이밍-언제-실행되는가)
4. [AsyncTask 실행 조건 (중요!)](#asynctask-실행-조건-중요)
5. [기본 사용법](#기본-사용법)
6. [실무 사용 사례](#실무-사용-사례)
7. [Context와의 관계](#context와의-관계)
8. [Best Practices](#best-practices)
9. [다른 솔루션과의 비교](#다른-솔루션과의-비교)
10. [FAQ](#faq)

---

## AsyncTask란?

**AsyncTask**는 HTTP 응답을 보낸 후 백그라운드에서 실행되는 비동기 작업입니다.

### 핵심 특징

- ✅ **Fire and Forget 패턴** - HTTP 응답을 기다리지 않고 즉시 반환
- ✅ **자동 실행** - Steps가 모두 성공하면 자동으로 스케줄링
- ✅ **순차 실행** - 파일명 순서대로 하나씩 실행
- ✅ **에러 격리** - 한 AsyncTask 실패가 다른 AsyncTask에 영향 없음
- ✅ **Convention over Configuration** - `async-tasks/` 폴더에 파일만 넣으면 자동 인식

### AsyncTask vs Step 비교

| 구분 | Step | AsyncTask |
|------|------|-----------|
| **실행 시점** | HTTP 응답 전 | HTTP 응답 후 |
| **사용자 대기** | ⏳ 기다림 | ✅ 기다리지 않음 |
| **파라미터** | `(ctx, req, res)` | `(ctx)` only |
| **에러 처리** | 즉시 응답 전송 | 로그만 기록 |
| **트랜잭션** | 포함 | 포함 안 됨 |
| **목적** | 핵심 비즈니스 로직 | 부가 작업 (이메일, 알림 등) |

---

## 왜 필요한가?

### 문제 상황

주문 완료 후 이메일, 푸시 알림, 분석 이벤트를 보내야 한다면?

```javascript
// ❌ 문제: 사용자가 모든 작업을 기다려야 함
async function createOrder(req, res) {
  const order = await db.orders.create(req.body)
  
  await sendEmail(order)          // 1000ms ⏳
  await sendPushNotification(order)  // 500ms ⏳
  await publishAnalytics(order)   // 300ms ⏳
  
  res.json({ orderId: order.id })  // 1800ms 후에야 응답!
}
```

### AsyncTasks로 해결

```javascript
// ✅ 해결: 사용자는 즉시 응답 받음
// features/create-order/index.js
const numflow = require('numflow')
const path = require('path')

module.exports = numflow.feature({
  method: 'POST',
  path: '/api/orders',
  steps: path.join(__dirname, 'steps'),
  asyncTasks: path.join(__dirname, 'async-tasks'),  // 자동 실행!
  contextInitializer: (ctx, req, res) => {
    ctx.userId = req.body.userId
    ctx.orderData = req.body
  }
})
```

```javascript
// steps/300-respond.js - 마지막 Step에서 응답 (v0.4.0)
async function respond(ctx, req, res) {
  res.json({ orderId: ctx.order.id })  // 200ms에 응답!
  return  // ⚠️ return 필수!
}
module.exports = respond
```

```javascript
// async-tasks/send-email.js - 백그라운드에서 실행
async function sendEmail(ctx) {
  const { order } = ctx
  await emailService.send({
    to: order.userEmail,
    subject: `주문 확인 - ${order.id}`
  })
}
module.exports = sendEmail
```

### 이점

1. ⚡ **빠른 응답** - 사용자는 200ms에 응답 받음 (1800ms → 200ms)
2. 🔄 **백그라운드 처리** - 이메일/알림은 백그라운드에서 실행
3. 🎯 **우선순위** - 중요한 것(주문)과 부가 작업(이메일) 분리
4. 📈 **확장성** - 부가 작업 추가해도 응답 속도 영향 없음

---

## 실행 타이밍 (언제 실행되는가?)

AsyncTask는 **Steps가 모두 성공하고 HTTP 응답을 보낸 후** 백그라운드에서 실행됩니다.

### 실행 흐름

```
Request → Steps 실행 → HTTP 응답 → AsyncTasks 백그라운드 실행
```

### 타임라인 예시

```
시간 →

0ms     [Client] POST /api/orders
        ↓
10ms    [Server] Step 1: validate-order ✅
        ↓
50ms    [Server] Step 2: create-order ✅
        ↓
100ms   [Server] Step 3: response (res.json) ✅
        ↓
200ms   [Client] 응답 받음! (200 OK) ← 사용자는 여기서 끝
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        ↓ (사용자는 이미 응답 받음, 서버에서만 계속 실행)
250ms   [Server] AsyncTask: send-email 시작
        ↓
1250ms  [Server] AsyncTask: send-email 완료
        ↓
1300ms  [Server] AsyncTask: send-notification 시작
        ↓
1800ms  [Server] AsyncTask: send-notification 완료
        ↓
1850ms  [Server] AsyncTask: publish-analytics 시작
        ↓
2650ms  [Server] AsyncTask: publish-analytics 완료
```

**핵심**: 사용자는 200ms에 응답을 받고, AsyncTasks는 2650ms까지 실행되지만 **사용자는 기다리지 않습니다**.

### 중요한 규칙

1. **Steps 성공 후에만 실행**
   - Steps 중 하나라도 실패하면 AsyncTasks는 실행 안 됨
   - 예: 결제 실패 → 주문 확인 이메일 안 보냄

2. **순차 실행**
   - AsyncTasks는 파일명 순서대로 하나씩 실행
   - Task 1 완료 → Task 2 시작 → Task 3 시작

3. **에러 격리**
   - AsyncTask 하나가 실패해도 다음 AsyncTask는 계속 실행
   - 이메일 실패 → 푸시 알림은 계속 시도

4. **await 없음 (Fire and Forget)**
   - 서버는 AsyncTasks 완료를 기다리지 않음
   - 백그라운드에서 알아서 실행됨

---

## AsyncTask 실행 조건 (중요!)

AsyncTask가 실행되려면 **모든 Steps가 성공적으로 완료**되어야 합니다. 아래는 구체적인 실행 조건입니다.

### ✅ AsyncTask가 실행되는 경우

#### 1. 모든 Step이 정상 완료 + 응답 전송

```javascript
// steps/100-validate.js (v0.4.0)
async function validate(ctx, req, res) {
  // 검증 로직
  ctx.validated = true
  // 끝! 자동으로 다음 Step 진행
}
module.exports = validate
```

```javascript
// steps/200-create-order.js (v0.4.0)
async function createOrder(ctx, req, res) {
  const order = await db.orders.create(req.body)
  ctx.order = order
  // 끝! 자동으로 다음 Step 진행
}
module.exports = createOrder
```

```javascript
// steps/300-response.js (v0.4.0)
async function response(ctx, req, res) {
  res.json({ orderId: ctx.order.id })  // ✅ 응답 전송
  return  // ⚠️ return 필수!
}
module.exports = response
```

**결과**: ✅ AsyncTask 실행됨!

**조건**:
- 모든 Step에서 에러 없음
- `throw Error` 없음
- **어딘가에서 `res.json()` 등 응답 전송**

#### 2. 조기 응답 (Early Return)

```javascript
// steps/100-validate.js (v0.4.0)
async function validate(ctx, req, res) {
  if (!req.body.productId) {
    // 에러 응답 전송 후 return
    res.status(400).json({ error: 'productId required' })
    return  // ⚠️ return 필수!
  }
  ctx.validated = true
  // 끝! 자동으로 다음 Step 진행
}
module.exports = validate
```

```javascript
// steps/200-create-order.js - 실행 안 됨
async function createOrder(ctx, req, res) {
  // 위에서 에러 응답 보냈으면 여기는 실행 안 됨
  const order = await db.orders.create(req.body)
  ctx.order = order
  res.json({ orderId: order.id })
}
module.exports = createOrder
```

**결과**: ❌ AsyncTask 실행 안 됨 (에러 응답)

**중요**: 
- `res.json()`, `res.send()`, `res.status().json()` 등을 호출하면 **즉시 해당 Step 종료**
- 응답 전송 후 `return`을 명시적으로 써야 다음 Step이 실행 안 됨
- 응답 전송 후에는 나머지 Steps는 건너뛰고 **AsyncTask 실행 여부 결정**

### ❌ AsyncTask가 실행되지 않는 경우

#### 1. Step에서 `throw Error`

```javascript
// steps/100-validate.js (v0.4.0)
async function validate(ctx, req, res) {
  if (!req.body.productId) {
    throw new Error('productId is required')  // ❌ 에러 발생!
  }
  // 끝! 자동으로 다음 Step 진행
}
module.exports = validate
```

**결과**: ❌ AsyncTask 실행 안 됨

**이유**: Step에서 에러 발생 → Feature 중단 → **AsyncTask 실행 안 됨**

#### 2. 응답을 전송하지 않음

```javascript
// steps/100-validate.js (v0.4.0)
async function validate(ctx, req, res) {
  ctx.validated = true
  // 끝! 자동으로 다음 Step 진행
}
module.exports = validate
```

```javascript
// steps/200-create-order.js (v0.4.0)
async function createOrder(ctx, req, res) {
  const order = await db.orders.create(req.body)
  ctx.order = order
  // ❌ res.json()을 호출 안 함!
}
module.exports = createOrder
```

**에러 메시지**:
```
Error: Feature completed without sending a response.
Make sure to call res.json(), res.send(), res.end(), or similar in your steps.
```

**결과**: ❌ AsyncTask 실행 안 됨

**이유**: 모든 Step 완료했는데 응답 안 보냄 → 에러 → **AsyncTask 실행 안 됨**

#### 3. Step 실행 중 예외 발생

```javascript
// steps/200-create-order.js
async function createOrder(ctx, req, res) {
  // DB 연결 에러 등
  const order = await db.orders.create(req.body)  // ❌ DB 에러!
  ctx.order = order
  res.json({ orderId: order.id })
}
module.exports = createOrder
```

**결과**: ❌ AsyncTask 실행 안 됨

**이유**: 예외 발생 → Feature 중단 → **AsyncTask 실행 안 됨**

### 🎯 핵심 규칙

| Step 상태 | 응답 전송 | AsyncTask 실행 |
|----------|---------|--------------|
| ✅ 모두 성공 | ✅ 전송함 | ✅ **실행됨** |
| ✅ 모두 성공 | ❌ 안 함 | ❌ 에러 (응답 안 보냄) |
| ❌ throw Error | - | ❌ 실행 안 됨 |
| ❌ 예외 발생 | - | ❌ 실행 안 됨 |

---

## 기본 사용법

Numflow는 **Convention over Configuration** 철학을 따릅니다.  
`async-tasks/` 폴더에 파일을 넣으면 자동으로 실행됩니다.

### 1. 프로젝트 구조

```
features/
  create-order/
    index.js              # Feature 정의
    steps/
      100-validate.js     # Step 1
      200-create-order.js # Step 2
      300-response.js     # Step 3
    async-tasks/          # ← 이 폴더에 AsyncTask 파일 추가
      send-email.js       # AsyncTask 1
      send-notification.js  # AsyncTask 2
      publish-analytics.js  # AsyncTask 3
```

### 2. Feature 정의

```javascript
// features/create-order/index.js
const numflow = require('numflow')
const path = require('path')

module.exports = numflow.feature({
  method: 'POST',
  path: '/api/orders',
  steps: path.join(__dirname, 'steps'),
  asyncTasks: path.join(__dirname, 'async-tasks'),  // ← 폴더 경로만 지정
  contextInitializer: (ctx, req, res) => {
    ctx.userId = req.body.userId
    ctx.orderData = req.body
  }
})
```

### 3. AsyncTask 파일 작성

```javascript
// async-tasks/send-email.js
/**
 * 주문 확인 이메일 발송
 * 
 * @param {Object} ctx - Context 객체 (Steps에서 생성한 데이터 포함)
 */
async function sendEmail(ctx) {
  const { order } = ctx
  
  await emailService.send({
    to: order.userEmail,
    subject: `주문 확인 - ${order.id}`,
    body: `주문이 성공적으로 완료되었습니다.`
  })
  
  // 선택사항: Context에 결과 저장
  ctx.emailSent = true
  ctx.emailSentAt = new Date()
}

module.exports = sendEmail
```

```javascript
// async-tasks/send-notification.js
/**
 * 푸시 알림 발송
 */
async function sendNotification(ctx) {
  const { order, userId } = ctx
  
  await pushService.send({
    userId,
    title: '주문 완료',
    body: `주문번호 ${order.id}의 결제가 완료되었습니다.`
  })
}

module.exports = sendNotification
```

```javascript
// async-tasks/publish-analytics.js
/**
 * 분석 이벤트 발송
 */
async function publishAnalytics(ctx) {
  const { order, userId } = ctx
  
  await analytics.track({
    event: 'order_completed',
    userId,
    properties: {
      orderId: order.id,
      revenue: order.total,
      itemCount: order.items.length
    }
  })
}

module.exports = publishAnalytics
```

### 4. 실행 순서

AsyncTasks는 **파일명 순서대로** 실행됩니다:

```
1. send-email.js (알파벳 순)
2. send-notification.js
3. publish-analytics.js
```

**순서를 제어하고 싶다면 파일명에 숫자를 추가하세요:**

```
async-tasks/
  100-send-email.js
  200-send-notification.js
  300-publish-analytics.js
```

---

## 실무 사용 사례

### 사례 1: 주문 완료 후 이메일/알림

```javascript
// async-tasks/send-order-email.js
async function sendOrderEmail(ctx) {
  const { order } = ctx
  
  await emailService.send({
    template: 'order-confirmation',
    to: order.userEmail,
    data: {
      orderId: order.id,
      items: order.items,
      total: order.total
    }
  })
}
module.exports = sendOrderEmail
```

### 사례 2: 회원 가입 후 환영 이메일

```javascript
// async-tasks/send-welcome-email.js
async function sendWelcomeEmail(ctx) {
  const { user } = ctx
  
  await emailService.send({
    template: 'welcome',
    to: user.email,
    data: {
      username: user.name,
      verificationLink: `https://example.com/verify?token=${user.verificationToken}`
    }
  })
}
module.exports = sendWelcomeEmail
```

### 사례 3: 분석 이벤트 발송

```javascript
// async-tasks/track-conversion.js
async function trackConversion(ctx) {
  const { order, userId, session } = ctx
  
  await Promise.all([
    // Google Analytics
    analytics.track('purchase', {
      transaction_id: order.id,
      value: order.total,
      currency: 'KRW'
    }),
    
    // Mixpanel
    mixpanel.track('Order Completed', {
      distinct_id: userId,
      order_id: order.id,
      revenue: order.total
    }),
    
    // Amplitude
    amplitude.logEvent('purchase', {
      user_id: userId,
      order_value: order.total
    })
  ])
}
module.exports = trackConversion
```

### 사례 4: 외부 시스템 연동

```javascript
// async-tasks/sync-to-crm.js
async function syncToCRM(ctx) {
  const { user, order } = ctx
  
  // CRM 시스템에 고객 정보 동기화
  await crmService.createOrUpdate({
    customerId: user.id,
    name: user.name,
    email: user.email,
    lastOrderDate: order.createdAt,
    totalSpent: order.total
  })
}
module.exports = syncToCRM
```

### 사례 5: 로그 수집

```javascript
// async-tasks/log-user-activity.js
async function logUserActivity(ctx) {
  const { userId, order, session } = ctx
  
  await logService.write({
    userId,
    action: 'order_created',
    resource: 'orders',
    resourceId: order.id,
    ip: session.ip,
    userAgent: session.userAgent,
    timestamp: new Date()
  })
}
module.exports = logUserActivity
```

### 사례 6: 캐시 무효화

```javascript
// async-tasks/invalidate-cache.js
async function invalidateCache(ctx) {
  const { userId, order } = ctx
  
  // 사용자의 주문 목록 캐시 무효화
  await cache.del(`user:${userId}:orders`)
  
  // 재고 캐시 무효화
  for (const item of order.items) {
    await cache.del(`product:${item.productId}:stock`)
  }
}
module.exports = invalidateCache
```

### 사례 7: Webhook 발송

```javascript
// async-tasks/send-webhooks.js
async function sendWebhooks(ctx) {
  const { order, webhooks } = ctx
  
  // 등록된 모든 Webhook에 이벤트 발송
  await Promise.all(
    webhooks.map(webhook =>
      fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': generateSignature(webhook.secret, order)
        },
        body: JSON.stringify({
          event: 'order.created',
          data: order
        })
      })
    )
  )
}
module.exports = sendWebhooks
```

---

## Context와의 관계

### Context란?

Context는 Steps와 AsyncTasks 간에 데이터를 공유하는 객체입니다.

```javascript
// Context 초기화
contextInitializer: (ctx, req, res) => {
  ctx.userId = req.body.userId
  ctx.orderData = req.body
}
```

### Steps에서 Context 생성

```javascript
// steps/200-create-order.js (v0.4.0)
async function createOrder(ctx, req, res) {
  const order = await db.orders.create(ctx.orderData)

  // Context에 데이터 저장
  ctx.order = order  // ← AsyncTasks에서 사용 가능!

  // 끝! 자동으로 다음 Step 진행
}
module.exports = createOrder
```

### AsyncTasks에서 Context 사용

```javascript
// async-tasks/send-email.js
async function sendEmail(ctx) {
  // Steps에서 저장한 데이터 사용
  const { order, userId } = ctx  // ← Steps에서 생성한 데이터
  
  await emailService.send({
    to: order.userEmail,
    subject: `주문 확인 - ${order.id}`
  })
}
module.exports = sendEmail
```

### 중요한 차이점

| 구분 | StepFunction | AsyncTaskFunction |
|------|--------------|-------------------|
| **시그니처** | `(ctx, req, res)` | `(ctx)` |
| **req, res 접근** | ✅ 가능 | ❌ 불가능 |
| **Context 읽기** | ✅ 가능 | ✅ 가능 |
| **Context 쓰기** | ✅ 가능 | ✅ 가능 (영향 없음) |

**AsyncTask에서 `req`, `res`를 사용할 수 없는 이유:**

AsyncTask는 **HTTP 응답을 보낸 후** 실행되므로 `res.json()` 같은 메서드를 호출할 수 없습니다.  
필요한 데이터는 Steps에서 미리 Context에 저장해야 합니다.

---

## Best Practices

### 1. 필요한 데이터는 Steps에서 미리 Context에 저장

❌ **나쁜 예:**

```javascript
// async-tasks/send-email.js
async function sendEmail(ctx) {
  // req가 없어서 에러!
  const userEmail = req.body.email  // ❌ req is undefined
}
```

✅ **좋은 예:**

```javascript
// steps/100-create-order.js
async function createOrder(ctx, req, res) {
  const order = await db.orders.create(req.body)

  // AsyncTask에 필요한 데이터를 미리 Context에 저장
  ctx.order = order
  ctx.userEmail = req.body.email  // ✅

  // 끝! 자동으로 다음 Step 진행
}
```

```javascript
// async-tasks/send-email.js
async function sendEmail(ctx) {
  const { order, userEmail } = ctx  // ✅
  
  await emailService.send({
    to: userEmail,
    subject: `주문 확인 - ${order.id}`
  })
}
```

### 2. AsyncTask는 멱등성(Idempotent)을 고려

AsyncTask는 실패 시 재시도될 수 있으므로 **멱등성**을 고려하세요.

✅ **좋은 예:**

```javascript
// async-tasks/send-email.js
async function sendEmail(ctx) {
  const { order } = ctx
  
  // 이미 이메일을 보냈는지 확인
  const alreadySent = await db.emailLogs.findOne({
    orderId: order.id,
    type: 'order-confirmation'
  })
  
  if (alreadySent) {
    console.log('이메일이 이미 발송되었습니다.')
    return
  }
  
  // 이메일 발송
  await emailService.send(...)
  
  // 발송 기록 저장
  await db.emailLogs.create({
    orderId: order.id,
    type: 'order-confirmation',
    sentAt: new Date()
  })
}
```

### 3. 에러 처리는 각 AsyncTask에서 개별적으로

```javascript
// async-tasks/send-email.js
async function sendEmail(ctx) {
  try {
    const { order } = ctx
    await emailService.send(...)
    
    // 성공 로그
    console.log(`이메일 발송 성공: ${order.id}`)
  } catch (error) {
    // 실패해도 다음 AsyncTask는 계속 실행됨
    console.error('이메일 발송 실패:', error)
    
    // 모니터링 시스템에 알림
    await monitoring.alert({
      type: 'email_failure',
      orderId: ctx.order.id,
      error: error.message
    })
  }
}
```

### 4. 순서가 중요하다면 파일명에 숫자 사용

```
async-tasks/
  100-send-email.js          # 1번째 실행
  200-send-notification.js   # 2번째 실행
  300-publish-analytics.js   # 3번째 실행
```

### 5. 긴 작업은 큐 시스템 사용 고려

AsyncTask는 순차 실행되므로, 매우 긴 작업은 **메시지 큐**(Redis, RabbitMQ, AWS SQS 등)에 위임하는 것이 좋습니다.

```javascript
// async-tasks/enqueue-video-processing.js
async function enqueueVideoProcessing(ctx) {
  const { videoId } = ctx
  
  // 긴 작업은 큐에 추가만
  await queue.add('video-processing', {
    videoId,
    priority: 'normal'
  })
  
  console.log(`비디오 처리 작업 큐에 추가: ${videoId}`)
}
```

---

## 다른 솔루션과의 비교

### vs Express.js 수동 처리

**Express.js:**

```javascript
// ❌ 수동으로 비동기 작업 관리 필요
app.post('/api/orders', async (req, res) => {
  const order = await db.orders.create(req.body)
  
  res.json({ orderId: order.id })
  
  // Fire and Forget (await 없음)
  sendEmail(order).catch(console.error)
  sendNotification(order).catch(console.error)
  publishAnalytics(order).catch(console.error)
})
```

**문제점:**
- 비동기 작업이 흩어짐
- 관리가 어려움
- 에러 처리 누락 가능

**Numflow:**

```javascript
// ✅ async-tasks/ 폴더에 파일만 넣으면 자동 실행
module.exports = numflow.feature({
  steps: path.join(__dirname, 'steps'),
  asyncTasks: path.join(__dirname, 'async-tasks')  // 자동!
})
```

### vs Bull Queue / Agenda

**Bull Queue:**

```javascript
// ❌ 별도 인프라(Redis) 필요
const queue = new Bull('email-queue', {
  redis: { host: 'localhost', port: 6379 }
})

app.post('/api/orders', async (req, res) => {
  const order = await db.orders.create(req.body)
  
  await queue.add('send-email', { orderId: order.id })
  await queue.add('send-notification', { orderId: order.id })
  
  res.json({ orderId: order.id })
})
```

**Numflow:**

```javascript
// ✅ 인프라 없이 바로 사용 가능 (간단한 작업용)
module.exports = numflow.feature({
  asyncTasks: path.join(__dirname, 'async-tasks')
})
```

**언제 큐 시스템을 사용해야 하나?**

- ✅ **Numflow AsyncTasks**: 빠른 부가 작업 (이메일, 알림, 로그)
- ✅ **Bull/Agenda**: 긴 작업, 재시도 필요, 스케일링 필요

### vs Lambda / Cloud Functions

**AWS Lambda:**

```javascript
// ❌ 별도 배포 및 관리 필요
// functions/send-email.js
exports.handler = async (event) => {
  const { orderId } = JSON.parse(event.body)
  // ...
}
```

**Numflow:**

```javascript
// ✅ 같은 프로젝트 내에서 관리
// async-tasks/send-email.js
async function sendEmail(ctx) {
  const { order } = ctx
  // ...
}
```

---

## FAQ

### Q1. AsyncTask는 병렬 실행되나요?

**A:** 아니요, **순차 실행**됩니다. 파일명 순서대로 하나씩 실행됩니다.

```
send-email.js 완료 → send-notification.js 시작 → 완료 → publish-analytics.js 시작
```

### Q2. AsyncTask에서 에러가 발생하면?

**A:** 해당 AsyncTask만 실패하고, **다음 AsyncTask는 계속 실행**됩니다.

```
send-email.js ✅ 성공
send-notification.js ❌ 실패 (로그 기록)
publish-analytics.js ✅ 계속 실행됨
```

### Q3. AsyncTask 실행 여부를 확인할 수 있나요?

**A:** 현재는 로그를 통해서만 확인 가능합니다. 프로덕션에서는 모니터링 시스템(Datadog, Sentry 등)을 사용하세요.

```javascript
async function sendEmail(ctx) {
  console.log('[AsyncTask] send-email 시작')
  // ...
  console.log('[AsyncTask] send-email 완료')
}
```

### Q4. AsyncTask에서 다른 AsyncTask의 결과를 사용할 수 있나요?

**A:** 네, Context를 통해 공유할 수 있습니다.

```javascript
// async-tasks/100-send-email.js
async function sendEmail(ctx) {
  await emailService.send(...)
  
  ctx.emailSentAt = new Date()  // ← 다음 AsyncTask에서 사용 가능
}
```

```javascript
// async-tasks/200-log-email.js
async function logEmail(ctx) {
  const { emailSentAt } = ctx  // ← 이전 AsyncTask 결과 사용
  
  await db.logs.create({
    event: 'email_sent',
    timestamp: emailSentAt
  })
}
```

### Q5. AsyncTask를 선택적으로 실행할 수 있나요?

**A:** 현재는 모든 AsyncTask가 실행됩니다. 조건부 실행이 필요하다면 AsyncTask 내부에서 분기 처리하세요.

```javascript
// async-tasks/send-coupon.js
async function sendCoupon(ctx) {
  const { order } = ctx
  
  // 조건 확인
  if (order.total < 50000) {
    console.log('주문 금액이 5만원 미만이므로 쿠폰 발송 안 함')
    return
  }
  
  // 쿠폰 발송
  await couponService.send(...)
}
```

### Q6. Steps와 AsyncTasks의 차이가 뭔가요?

**A:**

| 구분 | Steps | AsyncTasks |
|------|-------|------------|
| **실행 시점** | HTTP 응답 전 | HTTP 응답 후 |
| **사용자 대기** | ⏳ 기다림 | ✅ 안 기다림 |
| **파라미터** | `(ctx, req, res)` | `(ctx)` |
| **목적** | 핵심 비즈니스 로직 | 부가 작업 |

### Q7. AsyncTask가 너무 오래 걸리면 어떻게 하나요?

**A:** 메시지 큐 시스템(Bull, Agenda, AWS SQS)을 사용하세요.

```javascript
// async-tasks/enqueue-heavy-task.js
async function enqueueHeavyTask(ctx) {
  const { videoId } = ctx
  
  // 큐에 작업 추가만 하고 바로 종료
  await queue.add('video-processing', { videoId })
}
```

### Q8. AsyncTask는 재시도되나요?

**A:** v0.3.0에서는 **재시도 기능이 없습니다**. 재시도가 필요하다면 메시지 큐 시스템을 사용하세요.

---

## 마무리

AsyncTasks는 Numflow의 **Convention over Configuration** 철학을 따릅니다.

✅ **폴더에 파일만 넣으면 자동으로 실행됩니다.**  
✅ **HTTP 응답 속도를 최적화하면서 부가 작업을 처리할 수 있습니다.**  
✅ **복잡한 설정 없이 바로 사용 가능합니다.**

---

마지막 업데이트: 2025-10-18 (AsyncTasks 가이드 완전 재작성 - v0.3.0)
