# TODO API - Feature-First 아키텍처 예제

Numflow 프레임워크의 **Feature-First 아키텍처**를 사용한 실용적인 TODO API 예제입니다.

## ✨ 특징

- 🎯 **Convention over Configuration** - 폴더 구조만으로 API 자동 생성
- 📁 **Feature-First 아키텍처** - 비즈니스 로직 중심 설계
- 🚀 **RESTful API** - 표준 REST 규칙 준수
- ✅ **입력 검증** - Step별 책임 분리
- 🧪 **테스트 가능** - 각 Step을 독립적으로 테스트

## 📁 프로젝트 구조

```
todo-api/
├── app.js                     # 메인 서버 파일
├── db.js                      # 인메모리 데이터베이스
├── package.json
├── README.md
├── features/
│   └── todos/
│       ├── @get/              # GET /todos
│       │   └── steps/
│       │       └── 100-fetch-all.js
│       ├── @post/             # POST /todos
│       │   └── steps/
│       │       ├── 100-validate.js
│       │       └── 200-create.js
│       └── [id]/
│           ├── @get/          # GET /todos/:id
│           │   └── steps/
│           │       └── 100-fetch-one.js
│           ├── @put/          # PUT /todos/:id
│           │   └── steps/
│           │       ├── 100-validate.js
│           │       └── 200-update.js
│           ├── @delete/       # DELETE /todos/:id
│           │   └── steps/
│           │       └── 100-delete.js
│           └── complete/
│               └── @patch/    # PATCH /todos/:id/complete
│                   └── steps/
│                       └── 100-complete.js
└── tests/
    └── todos.test.js          # API 테스트
```

## 🚀 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. 서버 실행

```bash
npm start
```

또는 개발 모드 (자동 재시작):

```bash
npm run dev
```

서버가 `http://localhost:3000`에서 실행됩니다.

## 📚 API 엔드포인트

### 1. 모든 TODO 조회

```bash
GET /todos
```

**쿼리 파라미터:**
- `completed` (선택) - `true` 또는 `false`

**예제:**
```bash
# 모든 TODO 조회
curl http://localhost:3000/todos

# 완료된 TODO만 조회
curl http://localhost:3000/todos?completed=true

# 미완료 TODO만 조회
curl http://localhost:3000/todos?completed=false
```

**응답:**
```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "id": "1",
      "title": "Numflow 문서 읽기",
      "description": "Feature-First 아키텍처 이해하기",
      "completed": false,
      "createdAt": "2025-01-21T10:00:00.000Z",
      "updatedAt": "2025-01-21T10:00:00.000Z"
    }
  ]
}
```

### 2. 새 TODO 생성

```bash
POST /todos
```

**요청 바디:**
```json
{
  "title": "새로운 할 일",
  "description": "설명 (선택사항)"
}
```

**예제:**
```bash
curl -X POST http://localhost:3000/todos \
  -H "Content-Type: application/json" \
  -d '{
    "title": "테스트 작성하기",
    "description": "TDD 방식으로 개발"
  }'
```

**응답:**
```json
{
  "success": true,
  "message": "TODO가 성공적으로 생성되었습니다.",
  "data": {
    "id": "4",
    "title": "테스트 작성하기",
    "description": "TDD 방식으로 개발",
    "completed": false,
    "createdAt": "2025-01-21T10:05:00.000Z",
    "updatedAt": "2025-01-21T10:05:00.000Z"
  }
}
```

### 3. 특정 TODO 조회

```bash
GET /todos/:id
```

**예제:**
```bash
curl http://localhost:3000/todos/1
```

**응답:**
```json
{
  "success": true,
  "data": {
    "id": "1",
    "title": "Numflow 문서 읽기",
    "description": "Feature-First 아키텍처 이해하기",
    "completed": false,
    "createdAt": "2025-01-21T10:00:00.000Z",
    "updatedAt": "2025-01-21T10:00:00.000Z"
  }
}
```

### 4. TODO 업데이트

```bash
PUT /todos/:id
```

**요청 바디:** (모든 필드 선택사항)
```json
{
  "title": "수정된 제목",
  "description": "수정된 설명",
  "completed": true
}
```

**예제:**
```bash
curl -X PUT http://localhost:3000/todos/1 \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Numflow 문서 다 읽음",
    "completed": true
  }'
```

**응답:**
```json
{
  "success": true,
  "message": "TODO가 성공적으로 업데이트되었습니다.",
  "data": {
    "id": "1",
    "title": "Numflow 문서 다 읽음",
    "description": "Feature-First 아키텍처 이해하기",
    "completed": true,
    "createdAt": "2025-01-21T10:00:00.000Z",
    "updatedAt": "2025-01-21T10:10:00.000Z"
  }
}
```

### 5. TODO 삭제

```bash
DELETE /todos/:id
```

**예제:**
```bash
curl -X DELETE http://localhost:3000/todos/1
```

**응답:**
```json
{
  "success": true,
  "message": "TODO가 성공적으로 삭제되었습니다.",
  "data": {
    "id": "1",
    "deletedTodo": {
      "id": "1",
      "title": "Numflow 문서 읽기",
      "description": "Feature-First 아키텍처 이해하기",
      "completed": false,
      "createdAt": "2025-01-21T10:00:00.000Z",
      "updatedAt": "2025-01-21T10:00:00.000Z"
    }
  }
}
```

### 6. TODO 완료 처리

```bash
PATCH /todos/:id/complete
```

**예제:**
```bash
curl -X PATCH http://localhost:3000/todos/2/complete
```

**응답:**
```json
{
  "success": true,
  "message": "TODO가 완료 처리되었습니다.",
  "data": {
    "id": "2",
    "title": "TODO API 예제 작성",
    "description": "Convention over Configuration 적용",
    "completed": true,
    "createdAt": "2025-01-21T10:00:00.000Z",
    "updatedAt": "2025-01-21T10:15:00.000Z"
  }
}
```

## 🎯 Feature-First 아키텍처 핵심 원리

### 1. Convention over Configuration

폴더 구조만으로 자동으로 API가 생성됩니다:

```
features/todos/@get/    → GET /todos
features/todos/@post/   → POST /todos
features/todos/[id]/@get/ → GET /todos/:id
```

### 2. Step 기반 실행

각 Feature는 번호순으로 실행되는 Step으로 구성됩니다:

```
100-validate.js  → 입력 검증
200-create.js    → 데이터 생성
```

### 3. Context 공유

모든 Step은 `ctx` 객체를 통해 데이터를 공유합니다:

```javascript
// 100-validate.js
ctx.todoData = { title: '...', description: '...' }

// 200-create.js
const { todoData } = ctx  // 이전 Step의 데이터 사용
```

## 🧪 테스트 실행

```bash
npm test
```

## 📝 핵심 코드 살펴보기

### app.js - 메인 서버

```javascript
const numflow = require('numflow')
const app = numflow()

// ✨ 단 한 줄로 모든 Feature 자동 등록!
app.registerFeatures(path.join(__dirname, 'features'))

app.listen(3000)
```

### Step 예제 - 100-validate.js

```javascript
module.exports = async (ctx, req, res) => {
  const { title } = req.body

  // 입력 검증
  if (!title || title.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: 'title은 필수 필드입니다.'
    })
  }

  // Context에 저장
  ctx.todoData = { title: title.trim() }

  // 다음 Step으로 진행
}
```

### Step 예제 - 200-create.js

```javascript
const db = require('../../../../db')

module.exports = async (ctx, req, res) => {
  // 이전 Step에서 검증된 데이터 사용
  const { todoData } = ctx

  // DB에 저장
  const newTodo = db.create(todoData)

  // 응답 전송
  res.status(201).json({
    success: true,
    data: newTodo
  })
}
```

## 🚀 다음 단계

1. **데이터베이스 연동**: `db.js`를 PostgreSQL, MongoDB 등으로 교체
2. **인증 추가**: JWT 또는 세션 기반 인증 구현
3. **AsyncTask 추가**: 이메일 알림, 로깅 등 비동기 작업 추가
4. **에러 핸들링 개선**: Feature 레벨 `onError` 핸들러 추가
5. **테스트 확장**: 통합 테스트 및 E2E 테스트 작성

## 📖 참고 문서

- [Numflow 공식 문서](https://github.com/your-username/numflow)
- [Feature-First 아키텍처 가이드](https://github.com/your-username/numflow/blob/main/docs/feature-first.md)
- [Convention over Configuration](https://github.com/your-username/numflow/blob/main/docs/conventions.md)

## 🤝 기여

버그 리포트나 기능 제안은 [GitHub Issues](https://github.com/your-username/numflow/issues)에 남겨주세요.

## 📄 라이센스

MIT
