# 설치 및 첫 번째 애플리케이션

## 설치

### 요구사항

Numflow를 사용하기 위해 필요한 환경:

- **Node.js**: 16.0.0 이상
- **npm** 또는 **yarn**

현재 Node.js 버전 확인:

```bash
node --version
```

### 패키지 설치

npm을 사용하여 Numflow를 설치합니다:

```bash
npm install numflow
```

또는 yarn을 사용:

```bash
yarn add numflow
```

---

## 첫 번째 애플리케이션

가장 간단한 Numflow 애플리케이션을 만들어보겠습니다.

### JavaScript (CommonJS)

`app.js` 파일을 생성합니다:

```javascript
const numflow = require('numflow')

// Numflow 애플리케이션 생성
const app = numflow()

// 서버 시작
app.listen(3000, () => {
  console.log('Server running on http://localhost:3000')
})
```

애플리케이션 실행:

```bash
node app.js
```

브라우저에서 `http://localhost:3000`을 열면 "Numflow Framework" 메시지를 볼 수 있습니다.

### JavaScript (ESM)

ESM을 사용하려면 `package.json`에 `"type": "module"`을 추가하거나 `.mjs` 파일 확장자를 사용합니다.

`app.mjs` 파일을 생성합니다:

```javascript
import numflow from 'numflow'

// Numflow 애플리케이션 생성
const app = numflow()

// 서버 시작
app.listen(3000, () => {
  console.log('Server running on http://localhost:3000')
})
```

애플리케이션 실행:

```bash
node app.mjs
```

---

## 모듈 시스템 선택

Numflow는 CommonJS와 ESM을 모두 완벽하게 지원합니다. 프로젝트에 맞는 방식을 선택하세요.

### CommonJS 방식

```javascript
// require 사용
const numflow = require('numflow')
const app = numflow()
```

**장점:**
- Node.js의 기본 방식
- 대부분의 기존 프로젝트와 호환
- 빌드 과정 불필요

**추천 대상:**
- 기존 Node.js 프로젝트
- 빠른 프로토타이핑

### ESM 방식

```javascript
// import 사용
import numflow from 'numflow'
const app = numflow()
```

**장점:**
- 최신 JavaScript 표준
- 정적 분석 가능
- Tree-shaking 지원

**추천 대상:**
- 새로운 프로젝트
- 최신 JavaScript 기능 활용

---

## 서버 설정

Numflow는 `set()`과 `get()` 메서드를 통해 애플리케이션 설정을 관리할 수 있습니다.

### 설정 저장 및 조회

```javascript
const numflow = require('numflow')
const app = numflow()

// 설정 저장
app.set('title', 'My Numflow App')
app.set('port', 3000)
app.set('env', 'development')

// 설정 조회
const title = app.get('title')
const port = app.get('port')
const env = app.get('env')

console.log(`${title} is running on port ${port} in ${env} mode`)

// 설정값을 사용하여 서버 시작
app.listen(app.get('port'), () => {
  console.log(`Server running on http://localhost:${app.get('port')}`)
})
```

### 체이닝

`set()` 메서드는 체이닝을 지원합니다:

```javascript
app
  .set('title', 'My App')
  .set('port', 3000)
  .set('env', 'development')
```

### 일반적인 설정 항목

```javascript
// 포트 번호
app.set('port', process.env.PORT || 3000)

// 환경 (development, production 등)
app.set('env', process.env.NODE_ENV || 'development')

// 애플리케이션 이름
app.set('title', 'My Application')

// 커스텀 설정
app.set('api-version', 'v1')
app.set('max-upload-size', '10mb')
```

---

**이전**: [목차](./README.md)
