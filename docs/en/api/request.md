# Request API Reference

> Access request data and properties

The Request object represents the HTTP request and contains properties for the request query string, parameters, body, HTTP headers, and more.

---

## Table of Contents

- [Properties](#properties)
- [Parameters](#parameters)
- [Headers](#headers)
- [Content Negotiation](#content-negotiation)

---

## Properties

### req.method

The HTTP method of the request.

```javascript
app.get('/info', (req, res) => {
  console.log(req.method) // 'GET', 'POST', 'PUT', etc.
})
```

**Type:** `string`

---

### req.url

The full URL of the request (including query string).

```javascript
// GET /users?limit=10
app.get('/users', (req, res) => {
  console.log(req.url) // '/users?limit=10'
})
```

**Type:** `string`

---

### req.path

The path portion of the URL (excluding query string).

```javascript
// GET /users?limit=10
app.get('/users', (req, res) => {
  console.log(req.path) // '/users'
})
```

**Type:** `string`

---

### req.hostname

The hostname from the Host header (without port).

```javascript
// Host: example.com:3000
app.get('/', (req, res) => {
  console.log(req.hostname) // 'example.com'
})
```

**Type:** `string`

**Note:** `req.hostname` excludes the port number. Use `req.host` if you need the port.

---

### req.host

The host from the Host header (includes port).

```javascript
// Host: example.com:3000
app.get('/', (req, res) => {
  console.log(req.host) // 'example.com:3000'
  console.log(req.hostname) // 'example.com'
})
```

**Type:** `string`

**Difference from req.hostname:**
- `req.host` includes the port number (e.g., `'example.com:3000'`)
- `req.hostname` excludes the port number (e.g., `'example.com'`)

**Example:**
```javascript
// Host: localhost:8080
app.get('/info', (req, res) => {
  res.json({
    host: req.host,         // 'localhost:8080'
    hostname: req.hostname  // 'localhost'
  })
})
```

---

### req.ip

The client IP address.

```javascript
app.get('/', (req, res) => {
  console.log(req.ip) // '127.0.0.1' or '::1'
})
```

**Type:** `string`

---

### req.protocol

The request protocol (`http` or `https`).

```javascript
app.get('/', (req, res) => {
  console.log(req.protocol) // 'http' or 'https'
})
```

**Type:** `'http' | 'https'`

---

### req.secure

Boolean indicating if the request is over HTTPS.

```javascript
app.get('/', (req, res) => {
  if (req.secure) {
    console.log('HTTPS connection')
  } else {
    console.log('HTTP connection')
  }
})
```

**Type:** `boolean`

---

### req.xhr

Boolean indicating if the request was made via AJAX (checks `X-Requested-With: XMLHttpRequest` header).

```javascript
app.get('/data', (req, res) => {
  if (req.xhr) {
    res.json({ ajax: true })
  } else {
    res.send('<html>...</html>')
  }
})
```

**Type:** `boolean`

---

### req.res

Reference to the Response object.

```javascript
app.get('/info', (req, res) => {
  // Access response from request object
  console.log(req.res === res) // true

  // Can call response methods through req.res
  req.res.status(200).json({ message: 'OK' })
})
```

**Type:** `Response`

**Use Cases:**
```javascript
// In middleware that only receives req
function logMiddleware(req) {
  const start = Date.now()

  // Access response through req.res
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

**Note:** The `req.res` property is automatically set by the framework for each request.

---

## Parameters

### req.params

Route parameters object. Automatically parsed by the router.

```javascript
// GET /users/123
app.get('/users/:id', (req, res) => {
  console.log(req.params.id) // '123'
  res.json({ userId: req.params.id })
})

// GET /posts/2024/05/hello
app.get('/posts/:year/:month/:slug', (req, res) => {
  console.log(req.params)
  // { year: '2024', month: '05', slug: 'hello' }
  res.json(req.params)
})
```

**Type:** `Record<string, string>`

---

### req.query

Query string parameters object. Automatically parsed from the URL.

```javascript
// GET /search?q=hello&limit=10
app.get('/search', (req, res) => {
  console.log(req.query)
  // { q: 'hello', limit: '10' }

  const { q, limit } = req.query
  res.json({ query: q, limit: parseInt(limit) })
})

// GET /users?role=admin&status=active
app.get('/users', (req, res) => {
  const { role, status } = req.query
  res.json({ role, status })
})
```

**Type:** `Record<string, string>`

**Note:** Query values are always strings. Convert to numbers if needed:
```javascript
const limit = parseInt(req.query.limit) || 10
const page = parseInt(req.query.page) || 1
```

---

### req.body

The request body. Automatically parsed for JSON and URL-encoded content.

```javascript
// JSON request (automatic parsing)
app.post('/users', (req, res) => {
  const { name, email } = req.body
  console.log(req.body) // { name: 'John', email: 'john@example.com' }
  res.status(201).json({ success: true, user: req.body })
})

// Form data (automatic parsing)
app.post('/contact', (req, res) => {
  const { name, message } = req.body
  res.send(`Message from ${name}: ${message}`)
})
```

**Test it:**
```bash
# JSON request
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice","email":"alice@example.com"}'

# Form data
curl -X POST http://localhost:3000/contact \
  -d "name=Bob&message=Hello"
```

**Type:** `any`

**Body Parser Configuration:**
```javascript
const app = numflow()

// Configure body size limit (default: 1MB)
app.configureBodyParser({ limit: '10mb' })

// Disable automatic body parsing (use custom parser)
app.disableBodyParser()
```

**Supported Content Types:**
- `application/json` - Automatically parsed
- `application/x-www-form-urlencoded` - Automatically parsed
- Maximum size: 1MB (configurable)

---

## Headers

### req.headers

All request headers object.

```javascript
app.get('/info', (req, res) => {
  console.log(req.headers['content-type'])
  console.log(req.headers.authorization)
  console.log(req.headers['user-agent'])
})
```

**Type:** `http.IncomingHttpHeaders`

---

### req.get(field) / req.header(field)

Get a specific request header value (case-insensitive).

```javascript
app.get('/info', (req, res) => {
  const contentType = req.get('Content-Type')
  const auth = req.header('Authorization')
  const userAgent = req.get('User-Agent')

  res.json({
    contentType,
    auth,
    userAgent
  })
})
```

**Returns:** `string | undefined`

**Example:**
```javascript
// Authorization: Bearer abc123
const token = req.get('Authorization')?.replace('Bearer ', '')

// Content-Type: application/json
const isJson = req.get('Content-Type')?.includes('application/json')
```

---

## Content Negotiation

### req.accepts(types)

Check if the specified content types are acceptable based on the `Accept` header.

```javascript
// Accept: text/html, application/json
app.get('/data', (req, res) => {
  if (req.accepts('json')) {
    res.json({ data: 'JSON response' })
  } else if (req.accepts('html')) {
    res.send('<h1>HTML response</h1>')
  } else {
    res.status(406).send('Not Acceptable')
  }
})

// Check multiple types (returns best match)
app.get('/resource', (req, res) => {
  const type = req.accepts(['json', 'html', 'text'])
  if (type === 'json') {
    res.json({ format: 'json' })
  } else if (type === 'html') {
    res.send('<p>HTML</p>')
  } else {
    res.send('Plain text')
  }
})
```

**Parameters:**
- `types` (string | string[]): Content type(s) to check

**Returns:** `string | false`
- Returns the best matching type
- Returns `false` if none match

---

### req.acceptsCharsets(charsets)

Check acceptable character sets based on `Accept-Charset` header.

```javascript
// Accept-Charset: utf-8, iso-8859-1;q=0.7
app.get('/data', (req, res) => {
  const charset = req.acceptsCharsets(['utf-8', 'iso-8859-1'])

  if (charset === 'utf-8') {
    res.charset = 'utf-8'
    res.send('UTF-8 encoded data')
  } else if (charset) {
    res.charset = charset
    res.send(`Data in ${charset}`)
  } else {
    res.status(406).send('No acceptable charset')
  }
})
```

**Parameters:**
- `charsets` (string | string[]): Character set(s) to check

**Returns:** `string | false`

---

### req.acceptsEncodings(encodings)

Check acceptable encodings based on `Accept-Encoding` header.

```javascript
// Accept-Encoding: gzip, deflate, br
app.get('/data', (req, res) => {
  const encoding = req.acceptsEncodings(['gzip', 'deflate'])

  if (encoding === 'gzip') {
    // Use gzip compression
    res.set('Content-Encoding', 'gzip')
    // ... compress and send
  } else if (encoding === 'deflate') {
    // Use deflate compression
    res.set('Content-Encoding', 'deflate')
    // ... compress and send
  } else {
    // Send uncompressed
    res.send('Uncompressed data')
  }
})
```

**Parameters:**
- `encodings` (string | string[]): Encoding(s) to check

**Returns:** `string | false`

---

### req.acceptsLanguages(languages)

Check acceptable languages based on `Accept-Language` header.

```javascript
// Accept-Language: en-US,en;q=0.9,ko;q=0.8
app.get('/', (req, res) => {
  const lang = req.acceptsLanguages(['ko', 'en', 'ja'])

  if (lang === 'ko') {
    res.send('안녕하세요')
  } else if (lang === 'en') {
    res.send('Hello')
  } else if (lang === 'ja') {
    res.send('こんにちは')
  } else {
    res.send('Hello (default)')
  }
})

// Prefix matching support
// Accept-Language: en-US
app.get('/greet', (req, res) => {
  const lang = req.acceptsLanguages('en') // Matches 'en-US'
  if (lang) {
    res.send('Hello!')
  }
})
```

**Parameters:**
- `languages` (string | string[]): Language(s) to check

**Returns:** `string | false`

---

### req.is(type)

Check if the request `Content-Type` matches the specified type.

```javascript
// Content-Type: text/html
app.post('/data', (req, res) => {
  if (req.is('html')) {
    // Process HTML content
    res.send('HTML received')
  } else if (req.is('json')) {
    // Process JSON content
    res.json({ received: true })
  } else if (req.is('application/x-www-form-urlencoded')) {
    // Process form data
    res.send('Form data received')
  } else {
    res.status(415).send('Unsupported Media Type')
  }
})

// Shorthand types
app.post('/upload', (req, res) => {
  if (req.is('json')) {
    // application/json
  } else if (req.is('html')) {
    // text/html
  } else if (req.is('text/*')) {
    // Any text type
  }
})
```

**Parameters:**
- `type` (string): Content type to check

**Returns:** `string | false | null`
- Returns the matched type
- Returns `false` if no match
- Returns `null` if request has no body

---

## Complete Example

```javascript
const numflow = require('numflow')
const app = numflow()

app.post('/api/users/:id', (req, res) => {
  // Route parameters
  const userId = req.params.id

  // Query parameters
  const { includeProfile } = req.query

  // Request body
  const { name, email } = req.body

  // Headers
  const auth = req.get('Authorization')
  const contentType = req.get('Content-Type')

  // Request properties
  console.log('Method:', req.method) // POST
  console.log('Path:', req.path) // /api/users/123
  console.log('Hostname:', req.hostname)
  console.log('IP:', req.ip)
  console.log('Protocol:', req.protocol)
  console.log('Secure:', req.secure)
  console.log('XHR:', req.xhr)

  // Content negotiation
  if (req.accepts('json')) {
    res.json({
      userId,
      name,
      email,
      includeProfile
    })
  } else {
    res.send(`User ${userId} updated`)
  }
})

app.listen(3000)
```

---

## Related Documentation

- **[Response API](./response.md)** - Response object reference
- **[Application API](./application.md)** - Application methods
- **[Routing Guide](../guides/routing.md)** - Routing patterns
- **[Middleware Guide](../guides/middleware.md)** - Middleware usage

---

*Last updated: 2025-10-20*
