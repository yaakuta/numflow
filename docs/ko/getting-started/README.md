# Getting Started with Numflow

## 목차

- [📑 목차](#목차)
  - [시작하기](#시작하기)
  - [핵심 기능](#핵심-기능)
  - [고급 기능](#고급-기능)
  - [개발 환경](#개발-환경)
- [빠른 시작](#빠른-시작)
- [다음 단계](#다음-단계)

---

Numflow 프레임워크를 시작하는 방법을 단계별로 안내합니다.

> **참고**: 이 문서는 현재 구현된 기능만 포함하고 있으며, 새로운 기능이 추가될 때마다 업데이트됩니다.
>
> **현재 상태**: app.inject() 테스트 가이드 추가 ✅

---

## 📑 목차

### 시작하기
- **[설치 및 첫 번째 애플리케이션](./first-app.md)** - 설치, Hello World, 모듈 시스템
- **[Express에서 마이그레이션](./migration-from-express.md)** ⭐ - Express 앱을 Numflow로 전환하는 완벽 가이드

### 핵심 기능
- **[라우팅](./routing.md)** - HTTP 메서드, 경로 파라미터, 쿼리 파라미터
- **[Request/Response API](./request-response.md)** - Request/Response 객체, Body Parser
- **[미들웨어](./middleware.md)** - 전역/경로별 미들웨어, 에러 미들웨어
- **[에러 처리](./error-handling.md)** - 자동 에러 캐치, 글로벌 에러 핸들러

### 고급 기능
- **[Feature-First](./feature-first.md)** ⭐ - 자동 실행 시스템, Step 함수
- **[Async Tasks](./async-tasks.md)** - 비동기 작업 자동 실행
- **[프로젝트 구조](./project-structure.md)** - 구조 패턴, Best Practices

### 개발 환경
- **[테스트하기](./testing.md)** ⚡ - app.inject()로 빠른 테스트
- **[Debug Mode](./debug-mode.md)** 🐛 - Feature 디버깅, Context 추적
- **[TypeScript 사용](./typescript.md)** - TypeScript 설정

---

## 빠른 시작

```javascript
const numflow = require('numflow')
const app = numflow()

// 라우트 등록
app.get('/', (req, res) => {
  res.json({ message: 'Hello Numflow!' })
})

// 에러 처리
app.use((err, req, res, next) => {
  res.status(err.statusCode || 500).json({
    error: err.message
  })
})

// 서버 시작
app.listen(3000, () => {
  console.log('Server running on port 3000')
})
```

---

## 다음 단계

- **[API 레퍼런스](../api/)** - 전체 API 문서
- **[아키텍처](../ARCHITECTURE.md)** - 설계 원칙
- **[성능 가이드](../PERFORMANCE.md)** - 성능 최적화 및 벤치마크
- **[예제](../../examples/)** - 실전 예제 코드

---

**마지막 업데이트**: 2025-11-14 (app.inject() 테스트 가이드 추가)
