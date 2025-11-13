# Request/Response API

Numflow provides Express-compatible Request/Response API.

### Request Object (req)

#### Header Lookup

```javascript
app.get('/headers', (req, res) => {
  // Get specific headers
  const userAgent = req.get('User-Agent')
  const contentType = req.get('Content-Type')

  res.json({
    userAgent,
    contentType
  })
})
```

#### Content-Type Check

```javascript
app.post('/data', (req, res) => {
  // Check Content-Type
  if (req.is('application/json')) {
    res.send('This is JSON data')
  } else if (req.is('application/x-www-form-urlencoded')) {
    res.send('This is form data')
  } else {
    res.status(415).send('Unsupported media type')
  }
})
```

#### Accept Negotiation

```javascript
app.get('/api/users', (req, res) => {
  const users = [
    { id: 1, name: 'Alice' },
    { id: 2, name: 'Bob' }
  ]

  // Check if client wants JSON
  if (req.accepts('application/json')) {
    res.json(users)
  } else if (req.accepts('text/html')) {
    res.send('<ul><li>Alice</li><li>Bob</li></ul>')
  } else {
    res.status(406).send('Not Acceptable')
  }
})
```

### Response Object (res)

#### Status Code Setting

```javascript
app.get('/success', (req, res) => {
  res.status(200).send('Success!')
})

app.post('/users', (req, res) => {
  res.status(201).json({ message: 'User created' })
})

app.get('/not-found', (req, res) => {
  res.status(404).send('Page not found')
})
```

#### JSON Response

```javascript
app.get('/api/user', (req, res) => {
  // Automatically sets Content-Type: application/json
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

#### Text Response

```javascript
app.get('/hello', (req, res) => {
  // Automatically detects Content-Type
  res.send('Hello World!')
})

app.get('/html', (req, res) => {
  res.send('<h1>Hello HTML</h1>')
})
```

#### Redirect

```javascript
app.get('/old-page', (req, res) => {
  // 302 redirect
  res.redirect('/new-page')
})

app.get('/moved', (req, res) => {
  // 301 permanent redirect
  res.redirect(301, '/permanent-location')
})
```

### Body Parser (Auto-enabled)

Numflow automatically parses JSON and URL-encoded bodies:

#### JSON Body Parsing

```javascript
// POST request: Content-Type: application/json
// Body: {"name": "Alice", "email": "alice@example.com"}
app.post('/api/users', (req, res) => {
  // req.body is automatically parsed
  const { name, email } = req.body

  res.status(201).json({
    success: true,
    user: { name, email }
  })
})
```

#### Form Data Parsing

```javascript
// POST request: Content-Type: application/x-www-form-urlencoded
// Body: name=Alice&email=alice@example.com
app.post('/contact', (req, res) => {
  // req.body is automatically parsed
  const { name, email } = req.body

  res.send(`Message received: ${name} (${email})`)
})
```

#### Body Size Limit

By default, there's a 1MB limit. Larger requests return a 413 error.

### Real-World Example: User Creation API

```javascript
const numflow = require('numflow')
const app = numflow()

app.post('/api/users', (req, res) => {
  // Body parsing (automatic)
  const { name, email, age } = req.body

  // Validation
  if (!name || !email) {
    return res.status(400).json({
      error: 'name and email are required'
    })
  }

  // Email format check
  if (!email.includes('@')) {
    return res.status(400).json({
      error: 'Invalid email format'
    })
  }

  // Create user (DB operations omitted)
  const user = {
    id: Date.now(),
    name,
    email,
    age: age || null,
    createdAt: new Date()
  }

  // Success response
  res.status(201).json({
    success: true,
    user
  })
})

app.listen(3000)
```

Testing:

```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice","email":"alice@example.com","age":25}'
```

---

**Previous**: [Table of Contents](./README.md)
