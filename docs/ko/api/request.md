# Request

### req.params

경로 파라미터 객체입니다.

```typescript
// GET /users/123
app.get('/users/:id', (req, res) => {
  console.log(req.params.id) // '123'
})

// GET /posts/2024/05/hello
app.get('/posts/:year/:month/:slug', (req, res) => {
  console.log(req.params) // { year: '2024', month: '05', slug: 'hello' }
})
```

**타입**: `Record<string, string>`


### req.query

쿼리스트링 파라미터 객체입니다.

```typescript
// GET /search?q=hello&limit=10
app.get('/search', (req, res) => {
  console.log(req.query) // { q: 'hello', limit: '10' }
})
```

**타입**: `Record<string, string>`


### req.body

요청 본문입니다. JSON과 URL-encoded body가 자동으로 파싱됩니다.


```typescript
// JSON 요청 (자동 파싱)
app.post('/users', (req, res) => {
  const { name, email } = req.body
  console.log(req.body) // { name: 'John', email: 'john@example.com' }
  res.status(201).json({ success: true })
})

// Form 데이터 (자동 파싱)
app.post('/contact', (req, res) => {
  const { name, message } = req.body
  res.send(`Message from ${name}: ${message}`)
})

// Body 크기 제한 (기본 1MB)
// 더 큰 요청은 413 Payload Too Large 응답
```

**타입**: `any`


### req.headers

요청 헤더 객체입니다.

```typescript
app.get('/info', (req, res) => {
  console.log(req.headers['content-type'])
  console.log(req.headers.authorization)
})
```

**타입**: `http.IncomingHttpHeaders`

### req.method

HTTP 메서드입니다.

```typescript
console.log(req.method) // 'GET', 'POST', etc.
```

**타입**: `string`

### req.url

전체 URL입니다.

```typescript
// GET /users?limit=10
console.log(req.url) // '/users?limit=10'
```

**타입**: `string`

### req.path

경로 부분만 포함합니다 (쿼리스트링 제외).

```typescript
// GET /users?limit=10
console.log(req.path) // '/users'
```

**타입**: `string`

### req.hostname

호스트명입니다 (포트 제외).

```typescript
// Host: example.com:3000
console.log(req.hostname) // 'example.com'
```

**타입**: `string`

**참고**: `req.hostname`은 포트 번호를 제외합니다. 포트가 필요하면 `req.host`를 사용하세요.

### req.host

Host 헤더의 호스트입니다 (포트 포함).

```typescript
// Host: example.com:3000
app.get('/', (req, res) => {
  console.log(req.host) // 'example.com:3000'
  console.log(req.hostname) // 'example.com'
})
```

**타입**: `string`

**req.hostname과의 차이점:**
- `req.host`는 포트 번호를 포함합니다 (예: `'example.com:3000'`)
- `req.hostname`은 포트 번호를 제외합니다 (예: `'example.com'`)

**예제:**
```typescript
// Host: localhost:8080
app.get('/info', (req, res) => {
  res.json({
    host: req.host,         // 'localhost:8080'
    hostname: req.hostname  // 'localhost'
  })
})
```

### req.ip

클라이언트 IP 주소입니다.

```typescript
console.log(req.ip) // '127.0.0.1'
```

**타입**: `string`

### req.protocol

프로토콜입니다.

```typescript
console.log(req.protocol) // 'http' or 'https'
```

**타입**: `'http' | 'https'`

### req.secure

HTTPS 연결 여부입니다.

```typescript
if (req.secure) {
  // HTTPS 연결
}
```

**타입**: `boolean`

### req.xhr

AJAX 요청 여부입니다.

```typescript
if (req.xhr) {
  // X-Requested-With: XMLHttpRequest
}
```

**타입**: `boolean`

### req.res

Response 객체에 대한 참조입니다.

```typescript
app.get('/info', (req, res) => {
  // 요청 객체에서 응답 객체에 접근
  console.log(req.res === res) // true

  // req.res를 통해 응답 메서드 호출 가능
  req.res.status(200).json({ message: 'OK' })
})
```

**타입**: `Response`

**사용 예시:**
```typescript
// req만 받는 미들웨어에서 사용
function logMiddleware(req) {
  const start = Date.now()

  // req.res를 통해 응답에 접근
  req.res.on('finish', () => {
    const duration = Date.now() - start
    console.log(`${req.method} ${req.path} - ${duration}ms`)
  })
}

app.use((req, res, next) => {
  logMiddleware(req)
  next()
})
```

**참고**: `req.res` 프로퍼티는 프레임워크에서 각 요청마다 자동으로 설정됩니다.

### req.get(field) / req.header(field)

요청 헤더를 가져옵니다.


```typescript
const contentType = req.get('Content-Type')
const auth = req.header('Authorization')
const userAgent = req.get('User-Agent')
```

**반환값**: `string | undefined`

### req.accepts(types)

Accept 헤더를 기반으로 협상합니다.


```typescript
// Accept: text/html, application/json
req.accepts('html') // 'html'
req.accepts(['json', 'text']) // 'json'
req.accepts('xml') // false

// 사용 예제
if (req.accepts('json')) {
  res.json({ data: 'JSON response' })
} else if (req.accepts('html')) {
  res.send('<h1>HTML response</h1>')
}
```

**반환값**: `string | false`

### req.is(type)

Content-Type을 확인합니다.


```typescript
// Content-Type: text/html
req.is('html') // 'html'
req.is('text/html') // 'text/html'
req.is('json') // false

// 사용 예제
if (req.is('application/json')) {
  // JSON 데이터 처리
} else if (req.is('application/x-www-form-urlencoded')) {
  // Form 데이터 처리
}
```

**반환값**: `string | false | null`

### req.acceptsCharsets(charsets)

Accept-Charset 헤더를 기반으로 문자 집합 협상을 수행합니다.


```typescript
// Accept-Charset: utf-8, iso-8859-1;q=0.7
req.acceptsCharsets('utf-8') // 'utf-8'
req.acceptsCharsets(['utf-8', 'iso-8859-1']) // 'utf-8'
req.acceptsCharsets('shift-jis') // false

// 사용 예제
if (req.acceptsCharsets('utf-8')) {
  // UTF-8로 인코딩
} else if (req.acceptsCharsets('iso-8859-1')) {
  // ISO-8859-1로 인코딩
}
```

**반환값**: `string | false`

### req.acceptsEncodings(encodings)

Accept-Encoding 헤더를 기반으로 압축 방식 협상을 수행합니다.


```typescript
// Accept-Encoding: gzip, deflate, br
req.acceptsEncodings('gzip') // 'gzip'
req.acceptsEncodings(['gzip', 'deflate']) // 'gzip'
req.acceptsEncodings('identity') // 'identity'

// 사용 예제
const encoding = req.acceptsEncodings(['gzip', 'deflate'])
if (encoding === 'gzip') {
  // gzip 압축 사용
} else if (encoding === 'deflate') {
  // deflate 압축 사용
}
```

**반환값**: `string | false`

### req.acceptsLanguages(languages)

Accept-Language 헤더를 기반으로 언어 협상을 수행합니다.


```typescript
// Accept-Language: en-US,en;q=0.9,ko;q=0.8
req.acceptsLanguages('en') // 'en'
req.acceptsLanguages(['ko', 'en']) // 'en'
req.acceptsLanguages(['ko', 'ja']) // 'ko'

// 접두사 매칭 지원
// Accept-Language: en-US
req.acceptsLanguages('en') // 'en' (en-US와 매칭)

// 사용 예제
const lang = req.acceptsLanguages(['ko', 'en', 'ja'])
if (lang === 'ko') {
  // 한국어 응답
} else if (lang === 'en') {
  // 영어 응답
}
```

**반환값**: `string | false`

---

**이전**: [목차](./README.md)
