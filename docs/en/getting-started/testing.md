# Testing

Numflow provides the `app.inject()` method for fast and reliable testing. This method can simulate HTTP requests without actually starting a server, making tests extremely fast.

> **Key Features**:
> - ⚡ Instant testing without server startup (99% faster)
> - 🚀 Based on Fastify's `light-my-request`
> - 🔄 Perfect compatibility with Feature-First
> - ✅ Supports both Promise and Callback styles

---

## Table of Contents

- [Basic Usage](#basic-usage)
- [Testing HTTP Methods](#testing-http-methods)
- [Sending Request Body](#sending-request-body)
- [Route Parameters and Query](#route-parameters-and-query)
- [Testing Middleware](#testing-middleware)
- [Testing Error Handling](#testing-error-handling)
- [Testing Feature-First](#testing-feature-first)
- [Using with Jest](#using-with-jest)
- [Callback Style](#callback-style)

---

## Basic Usage

### Testing a Simple GET Request

**JavaScript:**
```javascript
const numflow = require('numflow')

const app = numflow()

app.get('/', (req, res) => {
  res.json({ message: 'Hello World' })
})

// Test with inject() (no server startup needed!)
const response = await app.inject({
  method: 'GET',
  url: '/'
})

console.log(response.statusCode) // 200
console.log(response.payload)     // '{"message":"Hello World"}'
console.log(JSON.parse(response.payload)) // { message: 'Hello World' }
```

**TypeScript:**
```typescript
import numflow from 'numflow'

const app = numflow()

app.get('/', (req, res) => {
  res.json({ message: 'Hello World' })
})

const response = await app.inject({
  method: 'GET',
  url: '/'
})

console.log(response.statusCode) // 200
console.log(JSON.parse(response.payload)) // { message: 'Hello World' }
```

---

## Testing HTTP Methods

### GET, POST, PUT, DELETE

```javascript
const numflow = require('numflow')
const app = numflow()

// Register routes
app.get('/users', (req, res) => {
  res.json({ users: [] })
})

app.post('/users', (req, res) => {
  res.status(201).json({ id: 1, name: req.body.name })
})

app.put('/users/:id', (req, res) => {
  res.json({ id: req.params.id, updated: true })
})

app.delete('/users/:id', (req, res) => {
  res.status(204).end()
})

// Test
const getResponse = await app.inject({
  method: 'GET',
  url: '/users'
})

const postResponse = await app.inject({
  method: 'POST',
  url: '/users',
  payload: { name: 'John' },
  headers: {
    'content-type': 'application/json'
  }
})

const putResponse = await app.inject({
  method: 'PUT',
  url: '/users/123'
})

const deleteResponse = await app.inject({
  method: 'DELETE',
  url: '/users/123'
})
```

---

## Sending Request Body

### JSON Body

```javascript
const response = await app.inject({
  method: 'POST',
  url: '/api/users',
  payload: { name: 'John', age: 30 },
  headers: {
    'content-type': 'application/json'
  }
})

console.log(response.statusCode) // 201
const body = JSON.parse(response.payload)
console.log(body.name) // 'John'
```

### Form Data

```javascript
const response = await app.inject({
  method: 'POST',
  url: '/api/login',
  payload: 'username=admin&password=secret',
  headers: {
    'content-type': 'application/x-www-form-urlencoded'
  }
})
```

---

## Route Parameters and Query

### URL Parameters

```javascript
const app = numflow()

app.get('/users/:id', (req, res) => {
  res.json({ userId: req.params.id })
})

const response = await app.inject({
  method: 'GET',
  url: '/users/456'
})

const body = JSON.parse(response.payload)
console.log(body.userId) // '456'
```

### Query Parameters

```javascript
const app = numflow()

app.get('/search', (req, res) => {
  res.json({
    query: req.query.q,
    page: req.query.page
  })
})

const response = await app.inject({
  method: 'GET',
  url: '/search?q=test&page=1'
})

const body = JSON.parse(response.payload)
console.log(body.query) // 'test'
console.log(body.page)  // '1'
```

---

## Testing Middleware

### Global Middleware

```javascript
const app = numflow()
const middlewareCalls = []

// Register middleware
app.use((req, res, next) => {
  middlewareCalls.push('middleware1')
  next()
})

app.use((req, res, next) => {
  middlewareCalls.push('middleware2')
  next()
})

app.get('/', (req, res) => {
  middlewareCalls.push('handler')
  res.json({ middlewareCalls })
})

// Test
const response = await app.inject({
  method: 'GET',
  url: '/'
})

const body = JSON.parse(response.payload)
console.log(body.middlewareCalls)
// ['middleware1', 'middleware2', 'handler']
```

---

## Testing Error Handling

### Testing Error Handlers

```javascript
const app = numflow()

app.get('/error', (req, res) => {
  throw new Error('Test error')
})

app.use((err, req, res, next) => {
  res.status(500).json({
    error: err.message
  })
})

const response = await app.inject({
  method: 'GET',
  url: '/error'
})

console.log(response.statusCode) // 500
const body = JSON.parse(response.payload)
console.log(body.error) // 'Test error'
```

### 404 Errors

```javascript
const app = numflow()

app.get('/exists', (req, res) => {
  res.json({ ok: true })
})

const response = await app.inject({
  method: 'GET',
  url: '/not-found'
})

console.log(response.statusCode) // 404
```

---

## Testing Feature-First

inject() works perfectly with Feature-First!

### Basic Feature Testing

```javascript
const numflow = require('numflow')
const app = numflow()

// Register Feature
app.use(numflow.feature({
  method: 'POST',
  path: '/api/orders',
  steps: './features/orders/steps'
}))

// Test - automatically waits for Feature registration!
const response = await app.inject({
  method: 'POST',
  url: '/api/orders',
  payload: { productId: 123, quantity: 2 },
  headers: {
    'content-type': 'application/json'
  }
})

console.log(response.statusCode) // 200
const body = JSON.parse(response.payload)
console.log(body.orderId) // 'ORD-12345'
```

### Convention-based Feature Testing

```javascript
// features/api/users/post/index.js
const numflow = require('numflow')
module.exports = numflow.feature({
  // method: 'POST' ← Auto-inferred from 'post' folder
  // path: '/api/users' ← Auto-inferred from folder structure
})

// test/api.test.js
const app = numflow()

// Auto-register all Features
app.registerFeatures('./features')

// Test - automatically waits for Feature registration!
const response = await app.inject({
  method: 'POST',
  url: '/api/users',
  payload: { name: 'John' },
  headers: {
    'content-type': 'application/json'
  }
})

console.log(response.statusCode) // 201
```

**Key Features**:
- ✅ `app.inject()` automatically waits for Feature registration
- ✅ All step functions execute properly
- ✅ Async Tasks work normally
- ✅ Feature Context is fully available

---

## Using with Jest

### Basic Test Structure

```javascript
// test/api.test.js
const numflow = require('numflow')

describe('API Tests', () => {
  it('should return users list', async () => {
    const app = numflow()

    app.get('/users', (req, res) => {
      res.json({ users: [] })
    })

    const response = await app.inject({
      method: 'GET',
      url: '/users'
    })

    expect(response.statusCode).toBe(200)
    const body = JSON.parse(response.payload)
    expect(body.users).toEqual([])
  })

  it('should create user', async () => {
    const app = numflow()

    app.post('/users', (req, res) => {
      res.status(201).json({
        id: 1,
        name: req.body.name
      })
    })

    const response = await app.inject({
      method: 'POST',
      url: '/users',
      payload: { name: 'John' },
      headers: {
        'content-type': 'application/json'
      }
    })

    expect(response.statusCode).toBe(201)
    const body = JSON.parse(response.payload)
    expect(body.name).toBe('John')
  })
})
```

### No Need for beforeEach/afterEach!

**Old Way (using app.listen()):**
```javascript
// ❌ Complex and slow
describe('API Tests', () => {
  let server
  let port

  beforeEach(() => {
    port = Math.floor(Math.random() * 10000) + 10000
  })

  afterEach(async () => {
    if (server) {
      await new Promise(resolve => server.close(resolve))
    }
  })

  it('should work', async () => {
    const app = numflow()
    app.get('/', (req, res) => res.end('OK'))

    server = app.listen(port)

    // HTTP request...
  })
})
```

**inject() Way:**
```javascript
// ✅ Simple and fast
describe('API Tests', () => {
  it('should work', async () => {
    const app = numflow()
    app.get('/', (req, res) => res.end('OK'))

    const response = await app.inject({ method: 'GET', url: '/' })
    expect(response.statusCode).toBe(200)
  })
})
```

**Performance Comparison**:
- **app.listen()**: ~200ms per test
- **app.inject()**: ~2ms per test (99% faster!)

---

## Callback Style

For environments where Promises aren't available, you can use the callback style.

```javascript
app.inject(
  { method: 'GET', url: '/' },
  (err, response) => {
    if (err) {
      console.error('Error:', err)
      return
    }

    console.log(response.statusCode) // 200
    console.log(response.payload)     // Response body
  }
)
```

---

## API Reference

### app.inject(options[, callback])

**Parameters:**

- **options** (object, required):
  - `method` (string, required): HTTP method ('GET', 'POST', 'PUT', 'DELETE', etc.)
  - `url` (string, required): Request URL (can include query parameters)
  - `payload` (object | string, optional): Request body
  - `headers` (object, optional): Request headers
  - `query` (object, optional): Query parameters (if not included in url)

- **callback** (function, optional): `(err, response) => void`
  - If callback is not provided, returns a Promise

**Returns:**

- Promise style: `Promise<Response>`
- Callback style: `void`

**Response Object:**

```typescript
{
  statusCode: number     // HTTP status code
  statusMessage: string  // Status message
  headers: object        // Response headers
  payload: string        // Response body (string)
  rawPayload: Buffer     // Response body (Buffer)
}
```

---

## Real-World Example

### Testing Authentication API

```javascript
const numflow = require('numflow')

describe('Auth API', () => {
  it('should login successfully', async () => {
    const app = numflow()

    app.post('/auth/login', (req, res) => {
      const { username, password } = req.body

      if (username === 'admin' && password === 'secret') {
        res.json({
          token: 'jwt-token-here',
          user: { id: 1, username: 'admin' }
        })
      } else {
        res.status(401).json({ error: 'Invalid credentials' })
      }
    })

    const response = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { username: 'admin', password: 'secret' },
      headers: { 'content-type': 'application/json' }
    })

    expect(response.statusCode).toBe(200)
    const body = JSON.parse(response.payload)
    expect(body.token).toBeDefined()
    expect(body.user.username).toBe('admin')
  })

  it('should reject invalid credentials', async () => {
    const app = numflow()

    app.post('/auth/login', (req, res) => {
      const { username, password } = req.body

      if (username === 'admin' && password === 'secret') {
        res.json({ token: 'jwt-token-here' })
      } else {
        res.status(401).json({ error: 'Invalid credentials' })
      }
    })

    const response = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { username: 'wrong', password: 'wrong' },
      headers: { 'content-type': 'application/json' }
    })

    expect(response.statusCode).toBe(401)
    const body = JSON.parse(response.payload)
    expect(body.error).toBe('Invalid credentials')
  })
})
```

---

## Best Practices

### ✅ Recommended

1. **Use inject() as your primary testing method**
   - Tests are 99% faster
   - No port conflicts
   - No need for beforeEach/afterEach

2. **Create a new app for each test**
   ```javascript
   it('test 1', async () => {
     const app = numflow() // New instance
     // ...
   })

   it('test 2', async () => {
     const app = numflow() // Another new instance
     // ...
   })
   ```

3. **Test Feature-First with inject()**
   - Automatically waits for Feature registration
   - Step functions execute normally

### ❌ Avoid

1. **Don't start a real server**
   ```javascript
   // ❌ Slow and complex
   const server = app.listen(3000)
   // HTTP request...
   server.close()

   // ✅ Fast and simple
   const response = await app.inject({ method: 'GET', url: '/' })
   ```

2. **Don't reuse app instances**
   ```javascript
   // ❌ Shared state between tests
   const app = numflow() // Global

   it('test 1', async () => {
     app.get('/test', ...)
   })

   it('test 2', async () => {
     // Routes from test 1 still exist!
   })
   ```

---

## Next Steps

- **[Error Handling](./error-handling.md)** - Testing error handlers
- **[Feature-First](./feature-first.md)** - Testing Features
- **[Application API](../api/application.md)** - Detailed inject() API documentation

---

**Last Updated**: 2025-11-14 (inject() testing guide added)
