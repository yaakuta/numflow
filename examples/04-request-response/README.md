# Request & Response

Learn advanced features of Numflow's Request and Response objects.

## 📚 Learning Objectives

- Request properties (params, query, body, headers)
- Response methods (json, send, status, redirect)
- Content Negotiation
- File downloads
- Cookie handling

## 💡 Core Concepts

### Request Object

```javascript
app.get('/users/:id', (req, res) => {
  // 1. Route parameters
  const userId = req.params.id

  // 2. Query string
  const page = req.query.page

  // 3. Body (POST/PUT)
  const data = req.body

  // 4. Headers
  const token = req.headers.authorization

  // 5. Method
  const method = req.method // GET, POST, etc.

  // 6. Path
  const path = req.path // /users/123
  const url = req.url // /users/123?page=1
})
```

### Response Methods

```javascript
// 1. JSON response
res.json({ message: 'Success' })

// 2. Text response
res.send('Hello World')

// 3. Set status code
res.status(404).json({ error: 'Not Found' })

// 4. Redirect
res.redirect('/new-path')
res.redirect(301, '/permanent-redirect')

// 5. Set headers
res.setHeader('X-Custom-Header', 'value')

// 6. Chaining
res
  .status(201)
  .setHeader('Location', '/users/123')
  .json({ id: 123, name: 'User' })
```

## 📖 Detailed Guide

### Body Parsing

Numflow automatically parses JSON bodies:

```javascript
app.post('/api/users', (req, res) => {
  const { name, email } = req.body // Automatically parsed!

  res.status(201).json({
    message: 'User created',
    data: { name, email },
  })
})
```

### Status Codes

Common HTTP status codes:

- `200 OK` - Success
- `201 Created` - Creation successful
- `204 No Content` - Success (no response body)
- `400 Bad Request` - Invalid request
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

### Content Negotiation

Respond in the format requested by the client:

```javascript
app.get('/api/data', (req, res) => {
  const data = { message: 'Hello' }

  const accept = req.headers.accept

  if (accept && accept.includes('application/json')) {
    res.json(data)
  } else {
    res.send(JSON.stringify(data, null, 2))
  }
})
```

### Template Rendering

Numflow supports template engines like EJS, Pug, and Handlebars.

#### EJS Example

```javascript
const numbers = require('numflow')
const app = numbers()

// Configure template engine
app.set('view engine', 'ejs')
app.set('views', './views')

// Serve static files
app.use('/static', numbers.static('./public'))

// Render template
app.get('/', (req, res) => {
  res.render('index', {
    title: 'Welcome',
    message: 'Hello from Numflow!',
    features: ['Fast', 'Easy', 'Express-compatible']
  })
})

app.listen(3000)
```

**views/index.ejs**:
```html
<!DOCTYPE html>
<html>
<head>
  <title><%= title %></title>
  <link rel="stylesheet" href="/static/style.css">
</head>
<body>
  <h1><%= message %></h1>
  <ul>
    <% features.forEach(function(feature) { %>
      <li><%= feature %></li>
    <% }); %>
  </ul>
</body>
</html>
```

#### Pug Example

```javascript
// Switch template engine to Pug
app.set('view engine', 'pug')
app.set('views', './views')

// Usage is the same
app.get('/', (req, res) => {
  res.render('index', {
    title: 'Welcome',
    message: 'Hello from Numflow!'
  })
})
```

**views/index.pug**:
```pug
doctype html
html
  head
    title= title
    link(rel='stylesheet' href='/static/style.css')
  body
    h1= message
    ul
      each feature in features
        li= feature
```

#### How to Run

**Running EJS example:**
```bash
cd template-ejs
npm install ejs
node index.js
# Visit http://localhost:3000
```

**Running Pug example:**
```bash
cd template-pug
npm install pug
node index.js
# Visit http://localhost:3000
```

Each example includes the following pages:
- **Homepage** (`/`) - Basic rendering
- **User List** (`/users`) - Array data iteration
- **User Detail** (`/users/:id`) - Parameter handling
- **About** (`/about`) - Static page
- **404** - Error page rendering

## Next Steps

- **[05-error-handling](../05-error-handling/)** - Unified error handling
- **[06-advanced](../06-advanced/)** - Advanced middleware (CORS, Compression)
