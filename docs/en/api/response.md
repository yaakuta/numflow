# Response API Reference

> Send responses to HTTP requests

The Response object represents the HTTP response that the app sends when it receives an HTTP request. It includes methods for setting headers, status codes, and sending various types of content.

---

## Table of Contents

- [Status Methods](#status-methods)
- [Sending Responses](#sending-responses)
- [Headers & Cookies](#headers--cookies)
- [Files & Templates](#files--templates)

---

## Status Methods

### res.status(code)

Set the HTTP status code for the response.

```javascript
app.get('/users', (req, res) => {
  res.status(200).json({ users: [] })
})

app.post('/users', (req, res) => {
  res.status(201).json({ user: req.body })
})

app.get('/notfound', (req, res) => {
  res.status(404).send('Not found')
})

app.get('/error', (req, res) => {
  res.status(500).end()
})
```

**Chaining Example:**
```javascript
app.post('/users', (req, res) => {
  const user = createUser(req.body)
  res.status(201).json(user) // Chainable
})
```

**Returns:** `Response` (supports chaining)

---

### res.sendStatus(code)

Send status code with default message.

```javascript
res.sendStatus(200) // OK
res.sendStatus(201) // Created
res.sendStatus(204) // No Content
res.sendStatus(400) // Bad Request
res.sendStatus(404) // Not Found
res.sendStatus(500) // Internal Server Error
```

**Example:**
```javascript
app.delete('/users/:id', (req, res) => {
  deleteUser(req.params.id)
  res.sendStatus(204) // 204 No Content
})
```

**Returns:** `Response`

---

## Sending Responses

### res.send(body)

Send a response. Content-Type is automatically determined based on the input type.

```javascript
// Send text (Content-Type: text/plain)
res.send('Hello World!')

// Send HTML (Content-Type: text/html)
res.send('<h1>Hello World!</h1>')

// Send object (Content-Type: application/json)
res.send({ message: 'Hello' })

// Send array (Content-Type: application/json)
res.send([1, 2, 3])

// Send Buffer (Content-Type: application/octet-stream)
res.send(Buffer.from('hello'))
```

**Examples:**
```javascript
app.get('/hello', (req, res) => {
  res.send('Hello World!')
})

app.get('/data', (req, res) => {
  res.send({ status: 'ok', data: [1, 2, 3] })
})

app.get('/html', (req, res) => {
  res.send('<html><body><h1>Hello</h1></body></html>')
})
```

**Returns:** `Response`

---

### res.json(body)

Send a JSON response. Content-Type is automatically set to `application/json`.

```javascript
// Send object
res.json({ id: 1, name: 'John' })

// Send array
res.json([1, 2, 3])

// Send null
res.json(null)

// With status code
res.status(201).json({ success: true, id: 123 })
res.status(400).json({ error: 'Invalid request' })
```

**Examples:**
```javascript
app.get('/users', (req, res) => {
  const users = [
    { id: 1, name: 'Alice' },
    { id: 2, name: 'Bob' }
  ]
  res.json({ users })
})

app.post('/users', (req, res) => {
  const user = createUser(req.body)
  res.status(201).json({
    success: true,
    user
  })
})

app.get('/error', (req, res) => {
  res.status(400).json({
    error: 'Bad Request',
    message: 'Invalid input'
  })
})
```

**Returns:** `Response`

---

### res.jsonp(body)

Send a JSONP response (for cross-domain requests).

```javascript
// ?callback=foo
app.get('/data', (req, res) => {
  res.jsonp({ user: 'john' })
})
// Output: foo({"user":"john"})
```

**Example:**
```javascript
app.get('/api/data', (req, res) => {
  const data = { users: ['Alice', 'Bob'] }
  res.jsonp(data)
})
```

**Returns:** `Response`

---

### res.redirect([status], url)

Redirect to the specified URL.

```javascript
// 302 redirect (default)
res.redirect('/login')
res.redirect('/dashboard')

// 301 permanent redirect
res.redirect(301, 'https://example.com')

// Other status codes
res.redirect(303, '/success')
res.redirect(307, '/temporary')
```

**Examples:**
```javascript
app.get('/old-page', (req, res) => {
  res.redirect('/new-page')
})

app.post('/login', (req, res) => {
  if (authenticated) {
    res.redirect('/dashboard')
  } else {
    res.redirect('/login?error=invalid')
  }
})

app.get('/legacy', (req, res) => {
  res.redirect(301, 'https://newsite.com')
})
```

**Returns:** `void`

---

## Headers & Cookies

### res.set(field, value) / res.header(field, value)

Set response header(s).

```javascript
// Set single header
res.set('Content-Type', 'text/html')

// Set multiple headers
res.set({
  'Content-Type': 'text/html',
  'X-Custom-Header': 'value',
  'Cache-Control': 'no-cache'
})
```

**Examples:**
```javascript
app.get('/data', (req, res) => {
  res.set('X-Powered-By', 'Numflow')
  res.set('Cache-Control', 'public, max-age=3600')
  res.json({ data: [] })
})

app.get('/download', (req, res) => {
  res.set({
    'Content-Type': 'application/pdf',
    'Content-Disposition': 'attachment; filename="report.pdf"'
  })
  res.sendFile('./report.pdf')
})
```

**Returns:** `Response` (supports chaining)

---

### res.get(field)

Get a response header value.

```javascript
const contentType = res.get('Content-Type')
const customHeader = res.get('X-Custom-Header')

if (!res.get('Content-Type')) {
  res.set('Content-Type', 'application/json')
}
```

**Returns:** `string | undefined`

---

### res.cookie(name, value, [options])

Set a cookie.

```javascript
// Simple cookie
res.cookie('name', 'value')

// With options
res.cookie('token', 'abc123', {
  maxAge: 900000,      // 15 minutes
  httpOnly: true,      // Prevent XSS
  secure: true,        // HTTPS only
  sameSite: 'strict',  // CSRF protection
  path: '/',
  domain: 'example.com'
})
```

**Options:**
- `maxAge` (number): Expiry time in milliseconds
- `expires` (Date): Expiry date
- `httpOnly` (boolean): HTTP only (no JavaScript access)
- `secure` (boolean): HTTPS only
- `sameSite` (string): `'strict'`, `'lax'`, or `'none'`
- `path` (string): Cookie path
- `domain` (string): Cookie domain

**Examples:**
```javascript
app.post('/login', (req, res) => {
  const token = generateToken(req.body)

  res.cookie('auth_token', token, {
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  })

  res.json({ success: true })
})

app.get('/remember', (req, res) => {
  res.cookie('remember_me', '1', {
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    httpOnly: true
  })
  res.send('Remembered')
})
```

**Returns:** `Response` (supports chaining)

---

### res.clearCookie(name, [options])

Clear a cookie.

```javascript
// Clear simple cookie
res.clearCookie('token')

// Clear with options (must match cookie options)
res.clearCookie('session', {
  path: '/admin',
  domain: 'example.com'
})
```

**Examples:**
```javascript
app.post('/logout', (req, res) => {
  res.clearCookie('auth_token')
  res.clearCookie('session_id')
  res.redirect('/login')
})

app.get('/clear', (req, res) => {
  res.clearCookie('remember_me', { path: '/' })
  res.send('Cookies cleared')
})
```

**Returns:** `Response` (supports chaining)

---

## Files & Templates

### res.attachment([filename])

Set the `Content-Disposition` header to "attachment" to prompt the browser to download the file.

```javascript
// Prompt download (no specific filename)
app.get('/download', (req, res) => {
  res.attachment()
  res.send('File content')
})

// Prompt download with specific filename
app.get('/report', (req, res) => {
  res.attachment('report.pdf')
  res.send(pdfBuffer)
})
```

**Parameters:**
- `filename` (optional): Filename for the download

**Behavior:**
- Without filename: Sets `Content-Disposition: attachment`
- With filename: Sets `Content-Disposition: attachment; filename="..."` and automatically sets `Content-Type` based on file extension

**Examples:**
```javascript
// Download with automatic Content-Type detection
app.get('/invoice', (req, res) => {
  res.attachment('invoice.pdf')  // Sets Content-Type: application/pdf
  res.send(invoicePdfBuffer)
})

// Download Excel file
app.get('/export', (req, res) => {
  res.attachment('data.xlsx')    // Sets Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
  res.send(excelBuffer)
})

// Combined with sendFile
app.get('/download/:file', (req, res) => {
  const filename = req.params.file
  res.attachment(filename)       // Prompt download with filename
  res.sendFile(`/path/to/${filename}`)
})
```

**Note:** `res.attachment()` only sets headers. You still need to send the actual file content using `res.send()`, `res.sendFile()`, or `res.download()`.

**Returns:** `Response` (supports chaining)

---

### res.sendFile(path)

Send a file. Automatically detects MIME type, streams large files, and handles errors.

```javascript
// Absolute path
res.sendFile('/path/to/file.pdf')

// Relative path (from current working directory)
res.sendFile('./public/index.html')
```

**Examples:**
```javascript
app.get('/download', (req, res) => {
  res.sendFile('./public/report.pdf')
})

app.get('/images/:name', (req, res) => {
  const imagePath = `./public/images/${req.params.name}`
  res.sendFile(imagePath)
})

app.get('/', (req, res) => {
  res.sendFile('./public/index.html')
})
```

**Features:**
- Automatic MIME type detection (40+ types supported)
- Streaming for large files
- Automatic headers (Content-Type, Content-Length, Last-Modified)
- Automatic 404/500 error handling

**Supported MIME Types:**
- `.html`, `.css`, `.js` - Web files
- `.json`, `.xml` - Data files
- `.jpg`, `.png`, `.gif`, `.svg` - Images
- `.pdf`, `.zip`, `.mp4`, `.mp3` - Documents & media
- And more...

**Returns:** `Promise<void>`

---

### res.download(path, [filename], [callback])

Prompt file download with Content-Disposition header.

```javascript
// Download with original filename
res.download('/report.pdf')

// Download with custom filename
res.download('/report.pdf', 'annual-report.pdf')

// With callback
res.download('/report.pdf', 'annual-report.pdf', (err) => {
  if (err) {
    console.error('Download failed:', err)
  } else {
    console.log('Download completed')
  }
})
```

**Examples:**
```javascript
app.get('/download/report', (req, res) => {
  res.download('./reports/monthly.pdf', 'report-2025-10.pdf')
})

app.get('/export/:id', (req, res) => {
  const filePath = `./exports/${req.params.id}.csv`
  res.download(filePath, `export-${req.params.id}.csv`)
})
```

**Returns:** `Promise<void>`

---

### res.render(view, [locals], [callback])

Render a template engine view.

**Setup:**
```javascript
const app = numflow()

// Configure template engine
app.set('view engine', 'ejs')  // or 'pug', 'handlebars'
app.set('views', './views')
```

**Usage:**
```javascript
// Render template
res.render('index', {
  title: 'Home',
  user: currentUser
})

// With callback (Express compatible)
res.render('index', { title: 'Home' }, (err, html) => {
  if (err) {
    console.error(err)
    res.status(500).send('Render error')
  } else {
    // Process HTML before sending
    res.send(html)
  }
})
```

**Supported Template Engines:**
- **EJS** (`.ejs`)
- **Pug** (`.pug`)
- **Handlebars** (`.hbs` or `.handlebars`)

**Examples:**

```javascript
// views/index.ejs
/*
<!DOCTYPE html>
<html>
<head>
  <title><%= title %></title>
</head>
<body>
  <h1>Welcome, <%= user.name %>!</h1>
</body>
</html>
*/

app.get('/', (req, res) => {
  res.render('index', {
    title: 'Home Page',
    user: { name: 'Alice' }
  })
})

app.get('/profile', (req, res) => {
  const user = getUserById(req.params.id)
  res.render('profile', { user })
})
```

**Returns:** `Promise<void>`

---

## Complete Example

```javascript
const numflow = require('numflow')
const app = numflow()

app.get('/api/users/:id', (req, res) => {
  const userId = req.params.id

  // Set custom headers
  res.set('X-API-Version', '1.0')
  res.set('Cache-Control', 'no-cache')

  // Set cookie
  res.cookie('last_visited', Date.now(), {
    maxAge: 86400000, // 24 hours
    httpOnly: true
  })

  // Send JSON response
  res.status(200).json({
    user: {
      id: userId,
      name: 'John Doe'
    }
  })
})

app.post('/login', (req, res) => {
  const { username, password } = req.body

  if (authenticate(username, password)) {
    res.cookie('auth_token', generateToken(), {
      maxAge: 86400000,
      httpOnly: true,
      secure: true
    })
    res.redirect('/dashboard')
  } else {
    res.status(401).json({ error: 'Invalid credentials' })
  }
})

app.get('/download/report', (req, res) => {
  res.download('./reports/annual.pdf', 'annual-report-2025.pdf')
})

app.get('/view/profile', (req, res) => {
  const user = getCurrentUser(req)
  res.render('profile', { user })
})

app.listen(3000)
```

---

## Method Chaining

Most Response methods support chaining:

```javascript
res
  .status(200)
  .set('X-Custom-Header', 'value')
  .cookie('session', 'abc123')
  .json({ success: true })

res
  .status(404)
  .set('Cache-Control', 'no-cache')
  .send('Not Found')
```

---

## Related Documentation

- **[Request API](./request.md)** - Request object reference
- **[Application API](./application.md)** - Application methods
- **[Routing Guide](../guides/routing.md)** - Routing patterns
- **[Middleware Guide](../guides/middleware.md)** - Middleware usage

---

*Last updated: 2025-10-20*
