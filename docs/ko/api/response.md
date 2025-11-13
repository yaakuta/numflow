# Response

### res.status(code)

HTTP 상태 코드를 설정합니다.


```typescript
res.status(200).json({ ok: true })
res.status(201).send('Created')
res.status(404).send('Not found')
res.status(500).end()

// 체이닝 가능
app.post('/users', (req, res) => {
  const user = createUser(req.body)
  res.status(201).json(user)
})
```

**반환값**: `Response` (체이닝 가능)

### res.sendStatus(code)

상태 코드와 함께 기본 메시지를 전송합니다.


```typescript
res.sendStatus(200) // OK
res.sendStatus(404) // Not Found
res.sendStatus(500) // Internal Server Error
```

**반환값**: `Response`

### res.send(body)

응답을 전송합니다. 타입에 따라 Content-Type을 자동으로 설정합니다.


```typescript
res.send('Hello') // text/plain
res.send('<h1>Hello</h1>') // text/html (HTML 감지)
res.send({ message: 'Hello' }) // application/json (객체 자동 변환)
res.send([1, 2, 3]) // application/json (배열 자동 변환)
res.send(Buffer.from('hello')) // application/octet-stream

// 사용 예제
app.get('/hello', (req, res) => {
  res.send('Hello World!')
})

app.get('/data', (req, res) => {
  res.send({ status: 'ok', data: [1, 2, 3] })
})
```

**반환값**: `Response`

### res.json(body)

JSON 응답을 전송합니다. Content-Type이 자동으로 application/json으로 설정됩니다.


```typescript
res.json({ id: 1, name: 'John' })
res.json([1, 2, 3])
res.json(null)

// 상태 코드와 함께 사용
res.status(201).json({ success: true, id: 123 })
res.status(400).json({ error: 'Invalid request' })
```

**반환값**: `Response`

### res.jsonp(body)

JSONP 응답을 전송합니다.


```typescript
// ?callback=foo
res.jsonp({ user: 'john' })
// foo({"user":"john"})
```

**반환값**: `Response`

### res.redirect([status], url)

리다이렉트합니다.


```typescript
// 302 리다이렉트 (기본값)
res.redirect('/login')
res.redirect('/dashboard')

// 301 영구 리다이렉트
res.redirect(301, 'https://example.com')

// 다른 상태 코드
res.redirect(303, '/success')

// 사용 예제
app.get('/old-page', (req, res) => {
  res.redirect('/new-page')
})
```

**반환값**: `void`

### res.set(field, value) / res.header(field, value)

응답 헤더를 설정합니다.


```typescript
res.set('Content-Type', 'text/html')
res.set({
  'Content-Type': 'text/html',
  'X-Custom': 'value'
})
```

**반환값**: `Response` (체이닝 가능)

### res.get(field)

응답 헤더를 가져옵니다.


```typescript
const contentType = res.get('Content-Type')
```

**반환값**: `string | undefined`

### res.cookie(name, value, [options])

쿠키를 설정합니다.


```typescript
res.cookie('name', 'value')

res.cookie('token', 'abc123', {
  maxAge: 900000,
  httpOnly: true,
  secure: true,
  sameSite: 'strict'
})
```

**반환값**: `Response`

### res.clearCookie(name, [options])

쿠키를 삭제합니다.


```typescript
res.clearCookie('token')
res.clearCookie('session', { path: '/admin' })
```

**반환값**: `Response`

### res.attachment([filename])

`Content-Disposition` 헤더를 "attachment"로 설정하여 브라우저가 파일을 다운로드하도록 합니다.

```typescript
// 다운로드 프롬프트 (파일명 지정 안함)
app.get('/download', (req, res) => {
  res.attachment()
  res.send('파일 내용')
})

// 특정 파일명으로 다운로드
app.get('/report', (req, res) => {
  res.attachment('report.pdf')
  res.send(pdfBuffer)
})
```

**파라미터:**
- `filename` (선택): 다운로드할 파일명

**동작:**
- 파일명 없음: `Content-Disposition: attachment` 설정
- 파일명 있음: `Content-Disposition: attachment; filename="..."` 설정 및 파일 확장자 기반 `Content-Type` 자동 설정

**예제:**
```typescript
// 자동 Content-Type 감지
app.get('/invoice', (req, res) => {
  res.attachment('invoice.pdf')  // Content-Type: application/pdf 설정
  res.send(invoicePdfBuffer)
})

// Excel 파일 다운로드
app.get('/export', (req, res) => {
  res.attachment('data.xlsx')    // Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet 설정
  res.send(excelBuffer)
})

// sendFile과 함께 사용
app.get('/download/:file', (req, res) => {
  const filename = req.params.file
  res.attachment(filename)       // 파일명으로 다운로드 프롬프트
  res.sendFile(`/path/to/${filename}`)
})
```

**참고**: `res.attachment()`는 헤더만 설정합니다. 실제 파일 내용은 `res.send()`, `res.sendFile()`, 또는 `res.download()`를 사용하여 전송해야 합니다.

**반환값**: `Response` (체이닝 지원)

### res.sendFile(path)

파일을 전송합니다. MIME 타입 자동 감지, 스트리밍, 에러 처리를 지원합니다.


```typescript
// 절대 경로
res.sendFile('/path/to/file.pdf')

// 상대 경로 (현재 작업 디렉토리 기준)
res.sendFile('./public/index.html')

// 사용 예제
app.get('/download', (req, res) => {
  res.sendFile('./public/report.pdf')
})

// 이미지 전송
app.get('/images/:name', (req, res) => {
  const imagePath = `./public/images/${req.params.name}`
  res.sendFile(imagePath)
})
```

**기능**:
- MIME 타입 자동 감지 (40+ 타입 지원)
- 스트리밍 전송 (대용량 파일)
- 자동 헤더 설정 (Content-Type, Content-Length, Last-Modified)
- 404/500 에러 자동 처리

**반환값**: `Promise<void>`

### res.download(path, [filename], [callback])

파일을 다운로드합니다.


```typescript
res.download('/report.pdf')
res.download('/report.pdf', 'annual-report.pdf')
```

**반환값**: `Promise<void>`

### res.render(view, [locals], [callback])

템플릿을 렌더링합니다.


```typescript
// View engine 설정
app.set('view engine', 'ejs')  // 또는 'pug', 'handlebars'
app.set('views', './views')

// 템플릿 렌더링
res.render('index', {
  title: 'Home',
  user: currentUser
})

// 콜백 사용 (Express 호환)
res.render('index', { title: 'Home' }, (err, html) => {
  if (err) console.error(err)
  // html 처리
})
```

**지원 템플릿 엔진**:
- EJS (`.ejs`)
- Pug (`.pug`)
- Handlebars (`.hbs` 또는 `.handlebars`)

**반환값**: `Promise<void>`

---

**이전**: [목차](./README.md)
