# Request/Response API

Numflow는 Express와 호환되는 Request/Response API를 제공합니다.

### Request 객체 (req)

#### 헤더 조회

```javascript
app.get('/headers', (req, res) => {
  // 특정 헤더 가져오기
  const userAgent = req.get('User-Agent')
  const contentType = req.get('Content-Type')

  res.json({
    userAgent,
    contentType
  })
})
```

#### Content-Type 확인

```javascript
app.post('/data', (req, res) => {
  // Content-Type 확인
  if (req.is('application/json')) {
    res.send('JSON 데이터입니다')
  } else if (req.is('application/x-www-form-urlencoded')) {
    res.send('Form 데이터입니다')
  } else {
    res.status(415).send('지원하지 않는 타입입니다')
  }
})
```

#### Accept 협상

```javascript
app.get('/api/users', (req, res) => {
  const users = [
    { id: 1, name: 'Alice' },
    { id: 2, name: 'Bob' }
  ]

  // 클라이언트가 JSON을 원하는지 확인
  if (req.accepts('application/json')) {
    res.json(users)
  } else if (req.accepts('text/html')) {
    res.send('<ul><li>Alice</li><li>Bob</li></ul>')
  } else {
    res.status(406).send('Not Acceptable')
  }
})
```

### Response 객체 (res)

#### 상태 코드 설정

```javascript
app.get('/success', (req, res) => {
  res.status(200).send('성공!')
})

app.post('/users', (req, res) => {
  res.status(201).json({ message: '사용자가 생성되었습니다' })
})

app.get('/not-found', (req, res) => {
  res.status(404).send('페이지를 찾을 수 없습니다')
})
```

#### JSON 응답

```javascript
app.get('/api/user', (req, res) => {
  // 자동으로 Content-Type: application/json 설정
  res.json({
    id: 1,
    name: 'Alice',
    email: 'alice@example.com'
  })
})

app.post('/api/login', (req, res) => {
  res.status(200).json({
    success: true,
    token: 'abc123'
  })
})
```

#### 텍스트 응답

```javascript
app.get('/hello', (req, res) => {
  // 자동으로 Content-Type 감지
  res.send('Hello World!')
})

app.get('/html', (req, res) => {
  res.send('<h1>Hello HTML</h1>')
})
```

#### 리다이렉트

```javascript
app.get('/old-page', (req, res) => {
  // 302 리다이렉트
  res.redirect('/new-page')
})

app.get('/moved', (req, res) => {
  // 301 영구 리다이렉트
  res.redirect(301, '/permanent-location')
})
```

### Body Parser (자동 활성화)

Numflow는 JSON과 URL-encoded body를 자동으로 파싱합니다:

#### JSON Body 파싱

```javascript
// POST 요청: Content-Type: application/json
// Body: {"name": "Alice", "email": "alice@example.com"}
app.post('/api/users', (req, res) => {
  // req.body가 자동으로 파싱됨
  const { name, email } = req.body

  res.status(201).json({
    success: true,
    user: { name, email }
  })
})
```

#### Form Data 파싱

```javascript
// POST 요청: Content-Type: application/x-www-form-urlencoded
// Body: name=Alice&email=alice@example.com
app.post('/contact', (req, res) => {
  // req.body가 자동으로 파싱됨
  const { name, email } = req.body

  res.send(`메시지를 받았습니다: ${name} (${email})`)
})
```

#### Body Size 제한

기본적으로 1MB 제한이 있습니다. 더 큰 요청은 413 에러를 반환합니다.

### 실전 예제: 사용자 생성 API

```javascript
const numflow = require('numflow')
const app = numflow()

app.post('/api/users', (req, res) => {
  // Body 파싱 (자동)
  const { name, email, age } = req.body

  // 유효성 검증
  if (!name || !email) {
    return res.status(400).json({
      error: 'name과 email은 필수입니다'
    })
  }

  // 이메일 형식 확인
  if (!email.includes('@')) {
    return res.status(400).json({
      error: '올바른 이메일 형식이 아닙니다'
    })
  }

  // 사용자 생성 (DB 작업 생략)
  const user = {
    id: Date.now(),
    name,
    email,
    age: age || null,
    createdAt: new Date()
  }

  // 성공 응답
  res.status(201).json({
    success: true,
    user
  })
})

app.listen(3000)
```

테스트:

```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice","email":"alice@example.com","age":25}'
```

---

**이전**: [목차](./README.md)
