# Numflow

> Express 5.x 호환 고성능 Node.js 웹 프레임워크

Numflow는 Express 5.x API와 완전히 호환되면서 평균 3배 빠른 성능을 제공하는 Node.js 웹 프레임워크입니다.

[![npm version](https://img.shields.io/npm/v/numflow.svg)](https://www.npmjs.com/package/numflow)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Tests: 779 passing](https://img.shields.io/badge/tests-779%20passing-brightgreen.svg)](https://github.com/gazerkr/numflow)

---

## 주요 특징

### Express 5.x 완전 호환

Numflow는 Express 5.x와 100% API 호환성을 제공합니다.

```javascript
// Express
const express = require('express')
const app = express()

// Numflow - require 문만 변경
const numflow = require('numflow')
const app = numflow()
```

기존 Express 코드와 미들웨어를 수정 없이 사용할 수 있습니다:
- express.json() / express.urlencoded()
- cookie-parser, helmet, morgan, cors
- passport, multer, express-session
- 기타 모든 Express 미들웨어

### 고성능

Radix Tree 기반 라우팅을 통해 Express 대비 평균 211% 빠른 성능을 제공합니다.

| 시나리오 | Express | Numflow | Fastify |
|---------|---------|---------|---------|
| Hello World | 15,041 req/s | 54,922 req/s | 52,191 req/s |
| JSON Response (GET) | 14,383 req/s | 43,923 req/s | 53,043 req/s |
| JSON Parse (POST) | 12,422 req/s | 36,682 req/s | 32,339 req/s |
| 평균 | 14,124 req/s | 43,865 req/s | 49,030 req/s |

성능 향상:
- Express 대비: +211% (평균 3배)
- Fastify 대비: -11% (일부 시나리오에서 Numflow가 더 빠름)

### Feature-First Architecture

설정 파일 없이 폴더 구조만으로 복잡한 비즈니스 로직을 자동 실행하는 아키텍처를 제공합니다.

**Zero Configuration**: `index.js` 파일 생성 불필요. 폴더와 파일명만으로 API가 자동 생성됩니다.

**폴더 구조 (Implicit Feature - index.js 불필요):**
```
features/
  api/
    orders/
      @post/              # POST /api/orders (@ prefix로 HTTP method 명시)
        steps/            # 파일명 숫자 순서대로 자동 실행
          100-validate.js       # 1번째 실행
          200-check-stock.js    # 2번째 실행
          300-create-order.js   # 3번째 실행
        async-tasks/      # 응답 후 비동기 실행
          send-email.js
          send-push.js
```

`index.js`는 **선택사항**입니다. 폴더 구조만으로도 자동으로 Feature가 생성됩니다.

**폴더 구조 (Explicit Feature - 추가 설정 필요 시):**
```
features/
  api/
    orders/
      @post/
        index.js          # ← contextInitializer, middlewares 등 추가 설정
        steps/
          100-validate.js
          200-check-stock.js
        async-tasks/
          send-email.js
```

**index.js를 사용하는 경우:**
```javascript
const numflow = require('numflow')

module.exports = numflow.feature({
  // 추가 설정 (선택사항)
  contextInitializer: (ctx, req, res) => {
    ctx.startTime = Date.now()
  },
  middlewares: [authMiddleware, rateLimitMiddleware],
})
```

**애플리케이션 등록:**
```javascript
const numflow = require('numflow')
const app = numflow()

app.registerFeatures('./features')  // 폴더 구조 자동 스캔
app.listen(3000)
```

**핵심 특징:**

1. **설정 파일 불필요 (Zero Configuration)**
   - `index.js` 파일 생성 불필요
   - 폴더 구조만으로 자동으로 API 생성
   - HTTP method, path, steps, async-tasks 모두 자동 추론
   - 추가 설정이 필요한 경우에만 선택적으로 `index.js` 사용

2. **파일명 숫자 기반 자동 실행 순서**
   - `100-`, `200-`, `300-` 순서대로 자동 실행
   - 실행 순서가 파일명으로 명확하게 표현됨
   - 별도 설정 파일 불필요

3. **폴더 구조만으로 비즈니스 로직 파악**
   - 코드를 열지 않아도 전체 흐름 이해 가능
   - `features/api/orders/@post/steps/` → POST /api/orders의 처리 단계
   - `@` prefix로 HTTP method를 명시적으로 표현 (resource 이름과 충돌 방지)
   - 각 파일명이 곧 해당 단계의 역할을 설명

4. **유연한 로직 관리**
   - **추가**: `150-check-user-auth.js` 파일을 생성하면 100과 200 사이에 자동 삽입 및 실행
   - **삭제**: 파일 삭제만으로 해당 단계 제거
   - **순서 변경**: 파일명 숫자만 변경하면 실행 순서 변경
   - 기존 코드 수정 없이 로직 구조 변경 가능

**`@` prefix 사용 이유:**

`@` prefix는 HTTP method 폴더를 명시적으로 구분하여 resource 이름과의 충돌을 방지합니다.

```
# @ prefix 없이 사용하면 충돌 발생
features/workflows/[id]/steps/get/  # ← "steps"가 resource인가? 폴더인가?

# @ prefix로 명확하게 구분
features/workflows/[id]/steps/@get/  # ← GET /workflows/:id/steps
                          └─ resource name
                                └─ HTTP method
```

**추가 폴더 구조 예제:**
```
features/
  users/@get/              # GET /users
  users/@post/             # POST /users
  users/[id]/@get/         # GET /users/:id
  users/[id]/@put/         # PUT /users/:id
  users/[id]/@delete/      # DELETE /users/:id
  api/v1/orders/@post/     # POST /api/v1/orders
```

**추가 특징:**
- **Zero Configuration**: `index.js` 없이 폴더 구조만으로 API 생성
- **Convention over Configuration**: HTTP method, path, 실행 순서를 폴더 구조에서 자동 추론
- **트랜잭션 관리 구조 제공**: `contextInitializer`, `onError` 훅을 통한 트랜잭션 관리 가능
- **비동기 작업 자동 실행**: 응답 후 async-tasks 자동 실행
- **중앙집중식 에러 처리**: `onError` 훅으로 통합 에러 처리
- **최소 오버헤드**: 성능 오버헤드 1.02% (10 steps 기준)

---

## 설치

```bash
npm install numflow
```

---

## 빠른 시작

### Hello World (JavaScript)

**CommonJS:**
```javascript
const numflow = require('numflow')
const app = numflow()

app.get('/', (req, res) => {
  res.json({ message: 'Hello Numflow' })
})

app.listen(3000)
```

**ESM:**
```javascript
import numflow from 'numflow'
const app = numflow()

app.get('/', (req, res) => {
  res.json({ message: 'Hello Numflow' })
})

app.listen(3000)
```

### TypeScript

```typescript
import numflow from 'numflow'
const app = numflow()

app.get('/', (req, res) => {
  res.json({ message: 'Hello Numflow' })
})

app.listen(3000)
```

---

## Express에서 마이그레이션

### 1단계: 패키지 설치

```bash
npm install numflow
```

### 2단계: Import 문 변경

```javascript
// Before
const express = require('express')

// After
const numflow = require('numflow')
```

### 3단계: 완료

나머지 코드는 수정 없이 사용 가능합니다.

**호환되는 항목:**
- 모든 HTTP 메서드 (GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD)
- 모든 미들웨어
- req.params, req.query, req.body
- res.json(), res.send(), res.status(), res.redirect()
- Router, app.use(), app.all()
- express.static()

**검증 현황:**
- 779개 테스트 100% 통과
- Express 5.x API 호환성 검증 완료
- 주요 미들웨어 호환성 검증 완료

---

## Feature-First 사용 예제

### 주문 생성 API

**가장 간단한 방법 (index.js 불필요):**
```
features/
  api/
    orders/
      @post/
        steps/
          100-validate-request.js
          200-check-user-auth.js
          300-check-product-stock.js
          400-create-order.js
          500-process-payment.js
        async-tasks/
          send-order-email.js
          send-push-notification.js
          update-analytics.js
```

폴더 구조만으로 자동으로 `POST /api/orders` API가 생성됩니다.

**추가 설정이 필요한 경우 (index.js 사용):**
```
features/
  api/
    orders/
      @post/
        index.js          # ← 추가 설정 (contextInitializer, middlewares, onError Hook)
        steps/
          ...
```

**features/api/orders/@post/index.js:**
```javascript
const numflow = require('numflow')

module.exports = numflow.feature({
  // method, path, steps, asyncTasks는 폴더 구조에서 자동 추론
  // 필요한 경우만 추가 설정
  contextInitializer: (ctx, req, res) => {
    ctx.startTime = Date.now()
    ctx.userId = req.user?.id
  },
})
```

**steps/100-validate-request.js:**
```javascript
module.exports = async (ctx, req, res) => {
  const { productId, quantity } = req.body

  if (!productId || !quantity) {
    throw new Error('productId and quantity are required')
  }

  ctx.productId = productId
  ctx.quantity = quantity
}
```

**steps/300-check-product-stock.js:**
```javascript
module.exports = async (ctx, req, res) => {
  const product = await db.products.findById(ctx.productId)

  if (product.stock < ctx.quantity) {
    throw new Error('Insufficient stock')
  }

  ctx.product = product
}
```

**steps/400-create-order.js:**
```javascript
module.exports = async (ctx, req, res) => {
  const order = await db.orders.create({
    userId: req.user.id,
    productId: ctx.productId,
    quantity: ctx.quantity,
    totalPrice: ctx.product.price * ctx.quantity,
  })

  ctx.order = order
  res.json({ success: true, orderId: order.id })
}
```

**async-tasks/send-order-email.js:**
```javascript
module.exports = async (ctx) => {
  await emailService.send({
    to: ctx.order.userEmail,
    template: 'order-confirmation',
    data: { order: ctx.order },
  })
}
```

**app.js:**
```javascript
const numflow = require('numflow')
const app = numflow()

app.registerFeatures('./features')
app.listen(3000)
```

### 유연한 로직 관리 예제

**시나리오: 권한 검증 로직 추가**

기존 로직 사이에 새로운 단계를 추가해야 하는 경우:

```
# 기존 구조
steps/
  100-validate-request.js
  300-check-product-stock.js
  400-create-order.js

# 새 파일 추가만으로 로직 삽입
steps/
  100-validate-request.js
  200-check-user-auth.js      # ← 새로 추가 (기존 코드 수정 불필요)
  300-check-product-stock.js
  400-create-order.js
```

**steps/200-check-user-auth.js 생성:**
```javascript
module.exports = async (ctx, req, res) => {
  if (!req.user || !req.user.isActive) {
    throw new Error('Unauthorized')
  }

  ctx.userId = req.user.id
}
```

서버 재시작만으로 100 → 200 → 300 → 400 순서로 자동 실행됩니다.

**로직 삭제:**
```bash
# 재고 확인 단계 제거
rm steps/300-check-product-stock.js
# 서버 재시작 → 100 → 200 → 400 순서로 자동 실행
```

**실행 순서 변경:**
```bash
# 결제를 주문 생성보다 먼저 실행하고 싶은 경우
mv steps/500-process-payment.js steps/350-process-payment.js
mv steps/400-create-order.js steps/450-create-order.js
# 서버 재시작 → 100 → 200 → 300 → 350(결제) → 450(주문) 순서로 실행
```

---

## 성능 벤치마크

### 테스트 환경

- Node.js v22.11.0
- macOS (Apple Silicon)
- Autocannon (100 connections, 10s duration)

### 전체 결과

| 시나리오 | Express | Numflow | Fastify | vs Express | vs Fastify |
|---------|---------|---------|---------|-----------|-----------|
| Hello World | 15,041 | 54,922 | 52,191 | +265% | +5% |
| JSON Response (GET) | 14,383 | 43,923 | 53,043 | +205% | -17% |
| JSON Parse (POST) | 12,422 | 36,682 | 32,339 | +195% | +13% |
| Route Parameters (단일) | 13,467 | 44,929 | 52,106 | +234% | -14% |
| Route Parameters (다중) | 14,832 | 43,076 | 52,691 | +190% | -18% |
| Route + Query | 14,404 | 42,220 | 48,525 | +193% | -13% |
| Middleware Chain (4개) | 14,321 | 41,305 | 52,316 | +188% | -21% |
| **평균** | **14,124** | **43,865** | **49,030** | **+211%** | **-11%** |

*단위: req/s (Requests per second)*

### Feature-First 성능

| 시나리오 | Requests/sec | vs Regular Route |
|---------|--------------|------------------|
| Feature-First (10 Steps) | 35,571 | -1.02% |
| Feature-First (50 Steps) | 28,462 | -20% |
| Regular Route | 35,937 | baseline |

### 주요 결과

- Express 대비 평균 3배 빠름 (+211%)
- Fastify와 유사한 성능 클래스 (-11%)
- Hello World와 JSON Parse에서 Fastify보다 빠름
- Feature-First 오버헤드 1.02% (10 steps)

자세한 벤치마크 결과는 [PERFORMANCE.md](docs/ko/PERFORMANCE.md)를 참고하세요

---

## 테스트 및 검증

### 테스트

- 779개 테스트 100% 통과
- 코어 기능 테스트
- Express 호환성 테스트
- 미들웨어 호환성 테스트
- Feature-First 통합 테스트
- 성능 회귀 테스트

### Express 호환성

- Express 5.x API 100% 호환
- 주요 Express 미들웨어 검증 완료
- 779개 테스트로 검증

자세한 호환성 정보: [COMPATIBILITY.md](docs/ko/COMPATIBILITY.md)

---

## 문서

### 시작하기

- [Getting Started](docs/ko/getting-started/README.md) - 초보자 가이드
- [첫 앱 만들기](docs/ko/getting-started/first-app.md) - 첫 Numflow 앱 만들기
- [프로젝트 구조 가이드](docs/ko/getting-started/project-structure.md) - 확장 가능한 프로젝트 구조

### 심화

- [Feature-First 가이드](docs/ko/getting-started/feature-first.md) - 복잡한 로직 구조화
- [라우팅](docs/ko/getting-started/routing.md) - 완전한 라우팅 가이드
- [미들웨어](docs/ko/getting-started/middleware.md) - 미들웨어 사용법
- [에러 처리](docs/ko/getting-started/error-handling.md) - 에러 처리 전략
- [API 문서](docs/ko/api) - 전체 API 레퍼런스
- [아키텍처 설계](docs/ko/ARCHITECTURE.md) - 내부 구조

### 성능

- [성능 비교](docs/ko/PERFORMANCE.md) - 성능 최적화 기법

### 호환성

- [Express 호환성](docs/ko/COMPATIBILITY.md) - Express 호환성 상세

---

## 기여

이슈 리포트, 기능 제안, 문서 개선, 코드 기여를 환영합니다.

- 버그 리포트: [Issues](https://github.com/gazerkr/numflow/issues)
- 기능 제안: [Issues](https://github.com/gazerkr/numflow/issues)
- Pull Request: [Pull Requests](https://github.com/gazerkr/numflow/pulls)

---

## FAQ

**Q: Express와 100% 호환되는가?**

A: 779개의 테스트로 검증했습니다. Express 5.x의 모든 핵심 API와 주요 미들웨어가 호환됩니다.

**Q: Feature-First는 필수인가?**

A: 선택사항입니다. Express 방식으로만 사용해도 무방합니다.

**Q: TypeScript 필수인가?**

A: 아닙니다. JavaScript(CommonJS/ESM)를 완전히 지원합니다. TypeScript는 선택사항입니다.

**Q: Express보다 3배 빠른 성능이 실제 환경에서도 동일한가?**

A: 벤치마크 결과는 평균 3배(211%)입니다. 실제 성능은 애플리케이션 구조, 미들웨어 사용, 비즈니스 로직에 따라 달라질 수 있습니다.

**Q: Fastify와의 차이점은?**

A: Fastify는 자체 API를 사용합니다. Numflow는 Express API를 유지하면서 Fastify에 근접한 성능을 제공합니다.

---

## 라이선스

MIT License

---

## 참고

이 프로젝트는 다음 프로젝트들의 아이디어를 참고했습니다:

- [Express.js](https://expressjs.com/) - API 호환성
- [Fastify](https://www.fastify.io/) - 성능 최적화
- [find-my-way](https://github.com/delvedor/find-my-way) - Radix Tree 라우팅
