# Debug Mode 🐛

Numflow의 Debug Mode는 Feature-First Auto-Orchestration의 실행 흐름을 시각적으로 추적할 수 있는 강력한 디버깅 도구입니다.

> **참고**: Debug Mode는 Feature-First 패턴에서만 작동합니다. 일반 라우트에서는 동작하지 않습니다.

---

## 📑 목차

- [Debug Mode란?](#debug-mode란)
- [왜 필요한가?](#왜-필요한가)
- [활성화/비활성화](#활성화비활성화)
- [출력 형식](#출력-형식)
- [Context 추적](#context-추적)
- [실전 사용 예시](#실전-사용-예시)
- [로그 제어](#로그-제어)
- [성능 고려사항](#성능-고려사항)
- [Best Practices](#best-practices)

---

## Debug Mode란?

Debug Mode는 Feature의 각 Step 실행 흐름을 **트리 형식**으로 표시하고, **Context 변화**를 추적하여 디버깅을 쉽게 만드는 기능입니다.

**기본적으로 비활성화**되어 있으며, 필요할 때 환경 변수로 활성화할 수 있습니다.

### 주요 기능

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

---

## 왜 필요한가?

Feature-First 패턴에서는 여러 Step이 순차적으로 실행되면서 Context를 공유합니다. Debug Mode가 없다면:

```javascript
// ❌ Debug Mode 없이는...
// - 어느 Step에서 에러가 발생했는지 알기 어려움
// - 각 Step이 Context를 어떻게 변경하는지 보이지 않음
// - 성능 병목을 찾기 어려움
// - 복잡한 비즈니스 로직 디버깅이 어려움

features/create-order/steps/
  100-validate-order.js    // 어디서 멈췄지?
  200-check-inventory.js   // Context가 제대로 전달됐나?
  300-reserve-stock.js     // 이 Step이 너무 느린데?
  400-process-payment.js   // 에러가 여기서 난 건가?
```

**Debug Mode를 사용하면:**

```bash
# ✅ Debug Mode로 한눈에 파악!
[Feature] POST /api/orders
  [Step 100] validate-order (2ms) ✓
    ├─ Input: {"userId":1,"orderData":{...}}
    └─ Context: {"validation":{"isValid":true}}

  [Step 200] check-inventory (15ms) ✓
    ├─ Input: {"userId":1,"orderData":{...}}
    └─ Context: {"inventory":{"available":true}}

  [Step 300] reserve-stock (150ms) ✓  ← 여기가 느리네!
    └─ Context: {"reservation":{"id":"123"}}

  [Step 400] process-payment (8ms) ✗  ← 에러 발생!
    └─ Error: Payment gateway timeout

  [Summary]
    Total: 175ms
    Steps: 3/4 passed
    Status: ✗ Failed
```

---

## 활성화/비활성화

### 기본 상태 (비활성화됨)

Debug Mode는 **기본적으로 비활성화**되어 있습니다. 별도 설정 없이 Feature를 실행하면 로그가 출력되지 않습니다.

```javascript
// features/create-order/index.js
const numflow = require('numflow')

module.exports = numflow.feature({
  method: 'POST',
  path: '/api/orders',
  steps: './steps'
})

// 서버 실행 시 Debug Mode 로그 없음
// node server.js
```

### 활성화 방법

개발 환경이나 디버깅이 필요할 때 활성화할 수 있습니다.

```bash
# 방법 1: 환경 변수로 활성화
FEATURE_DEBUG=true node server.js

# 방법 2: .env 파일에 추가
echo "FEATURE_DEBUG=true" >> .env
node server.js

# 방법 3: package.json 스크립트
{
  "scripts": {
    "dev": "FEATURE_DEBUG=true node server.js",  // 개발 시 Debug Mode 활성화
    "start": "node server.js"                     // 프로덕션 (비활성화)
  }
}
```

### 다른 로그 제어

```bash
# 모든 Feature 로그 비활성화 (테스트용)
DISABLE_FEATURE_LOGS=true node server.js

# 테스트 모드 (모든 로그 자동 비활성화)
NODE_ENV=test npm test
```

---

## 출력 형식

### 성공 케이스

```bash
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

### 에러 케이스

```bash
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

### 출력 요소 설명

| 요소 | 설명 |
|------|------|
| `[Feature]` | Feature 헤더 (HTTP 메서드 + 경로) |
| `[Step 100]` | Step 번호 (파일명에서 추출) |
| `validate-order` | Step 이름 (파일명에서 추출, 확장자 제거) |
| `(2ms)` | Step 실행 시간 (밀리초) |
| `✓` / `✗` | 성공/실패 아이콘 |
| `├─ Input` | Step 실행 전 context 상태 (results 제외) |
| `└─ Context` | Step 실행 후 ctx 변화 |
| `└─ Error` | 에러 발생 시 에러 메시지 |
| `[Summary]` | 전체 실행 통계 |

---

## Context 추적

Debug Mode의 핵심 기능은 **Context 변화 추적**입니다.

### Input vs Context

**Input (실행 전)**
- Step 실행 전의 context 상태
- `ctx`는 제외
- 이전 Step들에서 전달된 데이터

```javascript
// Input 예시
{
  userId: 1,
  orderData: { items: [...] }
}
```

**Context (실행 후 변화)**
- Step 실행 후 `ctx`에 추가된 데이터만 표시
- 새로 추가된 키만 표시

```javascript
// Context 예시 (새로 추가된 데이터)
{
  validation: { isValid: true, itemCount: 1 }
}
```

### 예제: Context 흐름 추적

```javascript
// features/create-order/steps/100-validate-order.js
module.exports = async function(context) {
  const { orderData } = context

  // 검증 로직
  const isValid = orderData.items && orderData.items.length > 0

  // ctx에 추가 (Debug Mode에서 표시됨)
  ctx.validation = {
    isValid,
    itemCount: orderData.items?.length || 0
  }

  if (!isValid) {
    throw new Error('Invalid order')
  }
}
```

```javascript
// features/create-order/steps/200-check-inventory.js
module.exports = async function(context) {
  // 이전 Step 결과 사용
  const { validation } = ctx

  if (!validation.isValid) {
    throw new Error('Cannot check inventory for invalid order')
  }

  // 재고 확인 로직
  const stock = await db.getStock(context.orderData.items)

  // 새로운 결과 추가
  ctx.inventory = {
    available: stock.available,
    stock: stock.quantity
  }
}
```

**Debug 출력:**

```bash
[Step 100] validate-order (2ms) ✓
  ├─ Input: {"userId":1,"orderData":{"items":[...]}}
  └─ Context: {"validation":{"isValid":true,"itemCount":1}}  ← 새로 추가됨

[Step 200] check-inventory (15ms) ✓
  ├─ Input: {"userId":1,"orderData":{...},"results":{"validation":{...}}}
  └─ Context: {"inventory":{"available":true,"stock":50}}  ← 새로 추가됨
```

---

## 실전 사용 예시

### 예시 1: 주문 생성 디버깅

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
    throw new Error('Order must have at least one item')
  }

  ctx.validation = {
    isValid: true,
    itemCount: orderData.items.length,
    totalAmount: orderData.items.reduce((sum, item) =>
      sum + (item.price * item.quantity), 0
    )
  }
}
```

```javascript
// features/create-order/steps/200-check-inventory.js
module.exports = async function(context) {
  const { orderData, results } = context
  const { validation } = results

  // 재고 확인 로직
  const outOfStock = []

  for (const item of orderData.items) {
    const stock = await inventoryService.getStock(item.id)
    if (stock < item.quantity) {
      outOfStock.push({
        itemId: item.id,
        requested: item.quantity,
        available: stock
      })
    }
  }

  if (outOfStock.length > 0) {
    throw new Error(`Items out of stock: ${JSON.stringify(outOfStock)}`)
  }

  ctx.inventory = {
    checked: true,
    timestamp: new Date().toISOString()
  }
}
```

**Debug 출력 (성공 케이스):**

```bash
[Feature] POST /api/orders
  [Step 100] validate-order (3ms) ✓
    ├─ Input: {"userId":1,"orderData":{"items":[{"id":1,"price":100,"quantity":2}]}}
    └─ Context: {"validation":{"isValid":true,"itemCount":1,"totalAmount":200}}

  [Step 200] check-inventory (45ms) ✓
    ├─ Input: {"userId":1,"orderData":{...}}
    └─ Context: {"inventory":{"checked":true,"timestamp":"2025-10-16..."}}

  [Summary]
    Total: 48ms
    Steps: 2/2 passed
    Status: ✓ Success
```

**Debug 출력 (재고 부족):**

```bash
[Feature] POST /api/orders
  [Step 100] validate-order (2ms) ✓
    └─ Context: {"validation":{"isValid":true,"itemCount":1,"totalAmount":200}}

  [Step 200] check-inventory (35ms) ✗
    └─ Error: Items out of stock: [{"itemId":1,"requested":2,"available":0}]

  [Summary]
    Total: 37ms
    Steps: 1/2 passed
    Status: ✗ Failed
    Error: Items out of stock: [{"itemId":1,"requested":2,"available":0}]
```

### 예시 2: 성능 병목 찾기

Debug Mode는 각 Step의 실행 시간을 측정하므로, 느린 Step을 쉽게 찾을 수 있습니다.

```bash
[Feature] POST /api/orders
  [Step 100] validate-order (2ms) ✓
  [Step 200] check-inventory (850ms) ✓  ← 여기가 느림!
  [Step 300] create-order (5ms) ✓
  [Step 400] send-notification (1200ms) ✓  ← 여기도 느림!

  [Summary]
    Total: 2057ms
    Steps: 4/4 passed
    Status: ✓ Success
```

**해결책:**
- Step 200: 재고 확인 쿼리 최적화 (인덱스 추가)
- Step 400: 알림을 async-tasks로 이동

---

## 로그 제어

### 환경 변수

| 환경 변수 | 기본값 | 설명 |
|----------|--------|------|
| `FEATURE_DEBUG` | `false` (비활성화) | `true`로 설정 시 Debug Mode 활성화 |
| `DISABLE_FEATURE_LOGS` | `false` (활성화) | `true`로 설정 시 모든 Feature 로그 비활성화 |
| `NODE_ENV` | - | `test`일 때 모든 로그 자동 비활성화 |

### 시나리오별 설정

**개발 환경 (상세 로그)**
```bash
# Debug Mode 활성화
FEATURE_DEBUG=true node server.js
```

**프로덕션 환경 (로그 최소화)**
```bash
# Debug Mode 비활성화 (기본값)
node server.js
```

**테스트 환경 (로그 없음)**
```bash
# 모든 로그 자동 비활성화
NODE_ENV=test npm test
```

**특정 상황 (Feature 로그만 끄기)**
```bash
# Feature 로그는 끄고 앱 로그만 보기
DISABLE_FEATURE_LOGS=true node server.js
```

---

## 성능 고려사항

### Context 스냅샷 오버헤드

Debug Mode는 각 Step 실행 전후에 Context를 복사(스냅샷)합니다. 이로 인한 성능 영향은 **무시할 수 있는 수준**입니다.

**성능 측정 (10 Steps Feature):**
- Debug Mode OFF: 42,104 req/s
- Debug Mode ON: ~41,000 req/s (약 2.6% 오버헤드)

### Context 크기 제한

Debug Mode는 Context를 JSON.stringify로 변환하여 표시합니다. 기본적으로 60자로 제한됩니다.

```javascript
// Context가 크면 자동으로 잘림
{
  validation: { isValid: true, itemCount: 1, items: [...] }
}

// 출력 예시
└─ Context: {"validation":{"isValid":true,"itemCount":1,"items":[...
```

### 프로덕션 권장사항

1. **프로덕션에서는 비활성화 유지 (기본값)**
   ```bash
   # Debug Mode는 기본적으로 비활성화되어 있으므로
   # 별도 설정 없이 실행하면 됩니다
   npm start
   ```

2. **민감한 데이터 주의**
   - Context에 비밀번호, API 키 등이 포함되지 않도록 주의
   - 필요시 onError에서 민감한 데이터 필터링

3. **로그 수집기 사용**
   - Debug 로그를 파일로 저장: `node server.js > debug.log 2>&1`
   - 구조화된 로깅: Winston, Pino 등 사용

---

## Best Practices

### 1. Context 설계

```javascript
// ✅ 좋은 예: 불변성 유지
module.exports = async function(context) {
  // 새로운 데이터는 results에만 추가
  ctx.validation = { isValid: true }
}

// ❌ 나쁜 예: 기존 데이터 수정
module.exports = async function(context) {
  // 기존 orderData 수정 (추적 어려움)
  context.orderData.status = 'validated'
}
```

### 2. 의미 있는 결과 저장

```javascript
// ✅ 좋은 예: 상세한 정보
ctx.payment = {
  transactionId: '12345',
  amount: 100,
  method: 'credit_card',
  timestamp: new Date().toISOString()
}

// ❌ 나쁜 예: 불명확한 정보
ctx.payment = true
```

### 3. 에러 메시지 명확하게

```javascript
// ✅ 좋은 예: 구체적인 에러
throw new Error(`Insufficient inventory for item ${itemId}: requested ${qty}, available ${stock}`)

// ❌ 나쁜 예: 모호한 에러
throw new Error('Inventory error')
```

### 4. Step 실행 시간 최적화

```javascript
// Debug Mode로 느린 Step 확인 후 최적화

// Before (느림)
[Step 200] check-inventory (850ms) ✓

// After (빠름)
[Step 200] check-inventory (12ms) ✓

// 최적화 방법:
// - DB 쿼리 최적화 (인덱스 추가)
// - 병렬 처리 (Promise.all)
// - 캐싱 (Redis)
```

### 5. 개발 vs 프로덕션

```javascript
// package.json
{
  "scripts": {
    "dev": "FEATURE_DEBUG=true node server.js",  // 개발 (Debug Mode 활성화)
    "start": "node server.js",  // 프로덕션 (비활성화, 기본값)
    "test": "NODE_ENV=test jest"  // 테스트 (로그 없음)
  }
}
```

---

## 다음 단계

- **[Feature-First Auto-Orchestration](./feature-first.md)** - Feature-First 패턴 전체 가이드
- **[에러 처리](./error-handling.md)** - onError 핸들러 활용
- **[프로젝트 구조](./project-structure.md)** - Feature 폴더 구조 설계

---

**마지막 업데이트**: 2025-10-16 (Debug Mode 문서 작성)
