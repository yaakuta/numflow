# 미들웨어 (Middleware)

미들웨어는 요청-응답 주기에서 중간에 실행되는 함수입니다.

## 기본 미들웨어

### 전역 미들웨어

```javascript
const numflow = require('numflow')
const app = numflow()

// 모든 요청에 대해 실행
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`)
  next()  // 다음 미들웨어로 이동
})

app.get('/', (req, res) => {
  res.send('Hello!')
})

app.listen(3000)
```

### 경로별 미들웨어

```javascript
// /api 경로에만 적용
app.use('/api', (req, res, next) => {
  console.log('API 요청:', req.url)
  next()
})

app.get('/api/users', (req, res) => {
  res.json({ users: [] })
})
```

### 다중 미들웨어

```javascript
const logger = (req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`)
  next()
}

const timer = (req, res, next) => {
  req.startTime = Date.now()
  next()
}

// 여러 미들웨어 등록
app.use(logger, timer)
```

## 라우트별 미들웨어

```javascript
// 인증 미들웨어
const requireAuth = (req, res, next) => {
  const token = req.get('Authorization')

  if (!token) {
    return res.status(401).json({ error: '인증이 필요합니다' })
  }

  // 토큰 검증 (예제는 간단히 처리)
  req.user = { id: 1, name: 'Alice' }
  next()
}

// 특정 라우트에만 미들웨어 적용
app.get('/api/profile', requireAuth, (req, res) => {
  res.json({
    user: req.user
  })
})

app.post('/api/posts', requireAuth, (req, res) => {
  res.status(201).json({
    message: '포스트가 생성되었습니다',
    author: req.user.name
  })
})
```

## 에러 처리 미들웨어

```javascript
// 에러 미들웨어 (4개 파라미터)
app.use((err, req, res, next) => {
  console.error('Error:', err.message)

  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  })
})

// 에러를 발생시키는 라우트
app.get('/error', (req, res, next) => {
  const error = new Error('뭔가 잘못되었습니다!')
  error.status = 500
  next(error)  // 에러 미들웨어로 전달
})
```

## 실전 예제: 인증 + 로깅

```javascript
const numflow = require('numflow')
const app = numflow()

// 1. 로깅 미들웨어 (전역)
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`)
  next()
})

// 2. 인증 미들웨어
const requireAuth = (req, res, next) => {
  const token = req.get('Authorization')?.replace('Bearer ', '')

  if (!token) {
    return res.status(401).json({ error: '토큰이 없습니다' })
  }

  // 토큰 검증 (간단한 예제)
  if (token !== 'valid-token') {
    return res.status(403).json({ error: '유효하지 않은 토큰입니다' })
  }

  req.user = { id: 1, name: 'Alice' }
  next()
}

// 3. 공개 엔드포인트
app.get('/', (req, res) => {
  res.send('홈페이지')
})

app.post('/api/login', (req, res) => {
  const { email, password } = req.body

  // 로그인 로직 (생략)
  res.json({
    token: 'valid-token'
  })
})

// 4. 보호된 엔드포인트 (인증 필요)
app.get('/api/profile', requireAuth, (req, res) => {
  res.json({
    user: req.user
  })
})

app.post('/api/posts', requireAuth, (req, res) => {
  const { title, content } = req.body

  res.status(201).json({
    post: {
      id: Date.now(),
      title,
      content,
      author: req.user.name
    }
  })
})

// 5. 에러 처리 미들웨어
app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).json({ error: 'Internal Server Error' })
})

app.listen(3000, () => {
  console.log('Server running on port 3000')
})
```

테스트:

```bash
# 공개 엔드포인트 (인증 불필요)
curl http://localhost:3000/

# 로그인
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"password123"}'

# 보호된 엔드포인트 (인증 필요)
curl http://localhost:3000/api/profile \
  -H "Authorization: Bearer valid-token"

# 인증 없이 접근 (401 에러)
curl http://localhost:3000/api/profile
```

## Feature 미들웨어

Feature-First Auto-Orchestration과 미들웨어를 함께 사용할 수 있습니다:

```javascript
// features/create-order/index.js
const numflow = require('numflow')

const requireAuth = (req, res, next) => {
  if (!req.get('Authorization')) {
    return res.status(401).json({ error: '인증이 필요합니다' })
  }
  req.user = { id: 1, name: 'Alice' }
  next()
}

module.exports = numflow.feature({
  method: 'POST',
  path: '/api/orders',

  // Feature 전용 미들웨어
  middlewares: [requireAuth],

  contextInitializer: (ctx, req, res) => {
    ctx.userId = req.user.id  // 미들웨어에서 설정한 user 사용
    ctx.orderData = req.body
  },

  steps: './steps',

  // 에러 발생 시 처리 (데이터베이스 롤백 등)
  onError: async (error, context, req, res) => {
    // Database-specific rollback
    if (context.dbClient) await context.dbClient.query('ROLLBACK')
    if (context.session) await context.session.abortTransaction()

    res.statusCode = 500
    res.end(JSON.stringify({ error: error.message }))
  },
})
```

실행 순서:
1. 전역 미들웨어 (app.use)
2. Feature 미들웨어 (requireAuth)
3. contextInitializer
4. Steps 실행

---

**마지막 업데이트**: 2025-10-16 (transaction 제거, onError 패턴 적용)

**이전**: [목차](./README.md)
