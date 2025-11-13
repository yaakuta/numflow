# Routing

> Define application endpoints and handle HTTP requests

Numflow provides high-performance routing powered by **Radix Tree** (find-my-way v8.2.2), achieving **O(log n)** lookup complexity compared to Express's O(n) linear search.

---

## Table of Contents

- [Basic Routes](#basic-routes)
- [HTTP Methods](#http-methods)
- [Route Parameters](#route-parameters)
- [Query Parameters](#query-parameters)
- [Route Chaining](#route-chaining)
- [Duplicate Route Detection](#duplicate-route-detection)
- [Modular Routing with Router](#modular-routing-with-router)
- [Advanced Patterns](#advanced-patterns)

---

## Basic Routes

The simplest route example:

```javascript
const numflow = require('numflow')
const app = numflow()

// Handle GET requests
app.get('/', (req, res) => {
  res.send('Hello Numflow!')
})

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000')
})
```

Visit `http://localhost:3000` in your browser to see "Hello Numflow!".

---

## HTTP Methods

Numflow supports all standard HTTP methods:

```javascript
const numflow = require('numflow')
const app = numflow()

// GET - Retrieve data
app.get('/users', (req, res) => {
  res.json({ users: ['Alice', 'Bob'] })
})

// POST - Create data
app.post('/users', (req, res) => {
  const user = req.body
  res.status(201).json({
    success: true,
    message: 'User created',
    user
  })
})

// PUT - Update entire resource
app.put('/users/:id', (req, res) => {
  const { id } = req.params
  res.json({ message: `User ${id} updated` })
})

// PATCH - Partial update
app.patch('/users/:id', (req, res) => {
  const { id } = req.params
  res.json({ message: `User ${id} patched` })
})

// DELETE - Remove data
app.delete('/users/:id', (req, res) => {
  const { id } = req.params
  res.json({ message: `User ${id} deleted` })
})

// OPTIONS - CORS preflight
app.options('/users', (req, res) => {
  res.setHeader('Allow', 'GET, POST, OPTIONS')
  res.status(204).send()
})

// HEAD - Headers only
app.head('/users', (req, res) => {
  res.setHeader('Content-Type', 'application/json')
  res.status(200).send()
})

// ALL - Handle all methods
app.all('/ping', (req, res) => {
  res.json({
    message: 'pong',
    method: req.method
  })
})
```

---

## Route Parameters

Extract dynamic values from URLs:

### Single Parameter

```javascript
// /users/123 → req.params.id === '123'
app.get('/users/:id', (req, res) => {
  const userId = req.params.id
  res.json({
    user: { id: userId, name: `User ${userId}` }
  })
})
```

### Multiple Parameters

```javascript
// /users/1/posts/456 → req.params.userId === '1', req.params.postId === '456'
app.get('/users/:userId/posts/:postId', (req, res) => {
  const { userId, postId } = req.params
  res.json({
    post: {
      id: postId,
      userId,
      title: `Post ${postId} by User ${userId}`
    }
  })
})
```

**Test it:**
```bash
curl http://localhost:3000/users/123
# Response: {"user":{"id":"123","name":"User 123"}}

curl http://localhost:3000/users/1/posts/456
# Response: {"post":{"id":"456","userId":"1","title":"Post 456 by User 1"}}
```

---

## Query Parameters

Automatically parse URL query strings:

```javascript
// /search?q=numflow&page=2&limit=10
app.get('/search', (req, res) => {
  const { q, page = '1', limit = '10' } = req.query

  res.json({
    query: q,
    page: parseInt(page),
    limit: parseInt(limit),
    results: [
      { id: 1, title: `Result for "${q}"` }
    ]
  })
})
```

**Test it:**
```bash
curl "http://localhost:3000/search?q=numflow&page=2&limit=10"
# Response: {"query":"numflow","page":2,"limit":10,"results":[...]}
```

---

## Route Chaining

Group routes with the same path using `app.route()`:

```javascript
// Without chaining
app.get('/products', (req, res) => {
  res.json({ products: [] })
})
app.post('/products', (req, res) => {
  res.status(201).json({ message: 'Product created' })
})

// With chaining (recommended)
app.route('/products')
  .get((req, res) => {
    res.json({
      products: [
        { id: 1, name: 'Product A', price: 100 },
        { id: 2, name: 'Product B', price: 200 }
      ]
    })
  })
  .post((req, res) => {
    res.status(201).json({
      success: true,
      message: 'Product created'
    })
  })
  .put((req, res) => {
    res.json({ message: 'Product updated' })
  })
  .delete((req, res) => {
    res.json({ message: 'Product deleted' })
  })
```

---

## Duplicate Route Detection

Numflow prevents duplicate route registrations by detecting them at server startup:

```javascript
const numflow = require('numflow')
const app = numflow()

// First registration - OK
app.get('/users', (req, res) => {
  res.send('Users list')
})

// Second registration - Error at startup!
app.get('/users', (req, res) => {
  res.send('Another handler')
})
// → Error: Duplicate route registration: GET /users
```

### What's Allowed

```javascript
// ✅ Same path, different method - Allowed
app.get('/users', (req, res) => {
  res.send('Get users')
})
app.post('/users', (req, res) => {
  res.send('Create user')
})

// ✅ Different path, same method - Allowed
app.get('/users', (req, res) => {
  res.send('Users')
})
app.get('/posts', (req, res) => {
  res.send('Posts')
})
```

### Interaction with app.all()

`app.all()` registers a route for all HTTP methods, so subsequent registrations for the same path will fail:

```javascript
// Register for all methods
app.all('/ping', (req, res) => {
  res.send('pong')
})

// This will fail!
app.get('/ping', (req, res) => {
  res.send('ping')
})
// → Error: Duplicate route registration: GET /ping
```

### Why is this important?

1. **Early error detection**: Caught at server startup (prevents runtime errors)
2. **Clear error messages**: Know exactly which route is duplicated
3. **Safe deployment**: Catch issues before production
4. **Code quality**: Prevent accidental route overrides

---

## Modular Routing with Router

For large applications, organize routes into modules using Numflow's Express-compatible Router:

### Creating a Router

```javascript
// routes/users.js
const numflow = require('numflow')
const router = numflow.Router()

// Register routes
router.get('/', (req, res) => {
  res.json({ users: [] })
})

router.get('/:id', (req, res) => {
  const { id } = req.params
  res.json({ user: { id, name: `User ${id}` } })
})

router.post('/', (req, res) => {
  res.status(201).json({ message: 'User created' })
})

module.exports = router
```

### Mounting a Router

```javascript
// app.js
const numflow = require('numflow')
const app = numflow()

const usersRouter = require('./routes/users')
const postsRouter = require('./routes/posts')

// Mount routers at specific paths
app.use('/api/users', usersRouter)
app.use('/api/posts', postsRouter)

app.listen(3000)

// Result URLs:
// /api/users     → usersRouter routes
// /api/users/:id → usersRouter routes
// /api/posts     → postsRouter routes
```

### Router-Level Middleware

Apply middleware to all routes in a router:

```javascript
const router = numflow.Router()

// Apply to all routes in this router
router.use((req, res, next) => {
  console.log('Time:', Date.now())
  next()
})

// Authentication middleware
router.use(authenticate)

router.get('/users', (req, res) => {
  // authenticate middleware automatically runs
  res.json({ users: [] })
})
```

### Nested Routers

Create hierarchical route structures by mounting routers within routers:

```javascript
const numflow = require('numflow')
const app = numflow()

// Level 1: API Router
const apiRouter = numflow.Router()

// Level 2: Users Router
const usersRouter = numflow.Router()
usersRouter.get('/', (req, res) => {
  res.json({ users: [] })
})

// Level 3: Posts Router (under Users)
const postsRouter = numflow.Router()
postsRouter.get('/', (req, res) => {
  const userId = req.params.userId
  res.json({ posts: [], userId })
})

// Nest routers
usersRouter.use('/:userId/posts', postsRouter)
apiRouter.use('/users', usersRouter)
app.use('/api', apiRouter)

// Result URLs:
// /api/users             → usersRouter
// /api/users/:userId/posts → postsRouter
```

### Real-World Example: Modular API

```javascript
// routes/users.js
const numflow = require('numflow')
const router = numflow.Router()
const { authenticate } = require('../middleware/auth')

// Middleware
router.use(authenticate)

// CRUD routes
router.get('/', getAllUsers)
router.get('/:id', getUser)
router.post('/', createUser)
router.put('/:id', updateUser)
router.delete('/:id', deleteUser)

module.exports = router

// routes/posts.js
const numflow = require('numflow')
const router = numflow.Router()

router.use(authenticate)

router.get('/', getAllPosts)
router.get('/:id', getPost)
router.post('/', createPost)

module.exports = router

// app.js
const numflow = require('numflow')
const app = numflow()

// Mount routers
app.use('/api/users', require('./routes/users'))
app.use('/api/posts', require('./routes/posts'))

app.listen(3000, () => {
  console.log('Modular API running on port 3000')
})
```

### Benefits of Router

1. **Modularity**: Organize routes by feature/resource
2. **Reusability**: Mount the same router at multiple paths
3. **Nesting**: Create hierarchical route structures
4. **Middleware**: Apply router-level middleware for shared logic
5. **Testing**: Test modules independently

### Express Compatibility

Numflow's Router works exactly like Express:

```javascript
// Express code
const express = require('express')
const router = express.Router()

// Numflow code (identical!)
const numflow = require('numflow')
const router = numflow.Router()
```

Existing Express router code works without modifications!

---

## Advanced Patterns

Numflow supports advanced routing patterns powered by find-my-way's Radix Tree router.

### Wildcards

Match any remaining path segments with the wildcard `*`:

```javascript
// Static file serving
app.get('/files/*', (req, res) => {
  const filePath = req.url.replace('/files/', '')
  res.send(`Serving file: ${filePath}`)
})

// Catch-all 404 handler (place at the end)
app.get('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    path: req.url
  })
})
```

**Test it:**
```bash
curl http://localhost:3000/files/images/logo.png
# Response: Serving file: images/logo.png

curl http://localhost:3000/unknown/path
# Response: {"error":"Not Found","path":"/unknown/path"}
```

### Regular Expression Constraints

Apply regex patterns to route parameters for input validation:

#### Numeric IDs Only

```javascript
// Only allow numeric IDs
// /users/123 (✅ matches)
// /users/abc (❌ 404)
app.get('/users/:id(^\\d+$)', (req, res) => {
  res.json({ userId: req.params.id })
})
```

#### UUID Validation

```javascript
// Validate UUID v4 format
app.get('/items/:uuid(^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$)', (req, res) => {
  res.json({ itemId: req.params.uuid })
})
```

**Test it:**
```bash
# Valid UUID
curl http://localhost:3000/items/550e8400-e29b-41d4-a716-446655440000
# Response: {"itemId":"550e8400-e29b-41d4-a716-446655440000"}

# Invalid UUID
curl http://localhost:3000/items/invalid-uuid
# Response: 404 Not Found
```

#### Date Format (YYYY-MM-DD)

```javascript
// Validate date format
app.get('/logs/:date(^\\d{4}-\\d{2}-\\d{2}$)', (req, res) => {
  const date = new Date(req.params.date)
  res.json({
    date: req.params.date,
    timestamp: date.getTime()
  })
})
```

**Test it:**
```bash
curl http://localhost:3000/logs/2025-01-15
# Response: {"date":"2025-01-15","timestamp":1736899200000}

curl http://localhost:3000/logs/2025-1-5  # Invalid format
# Response: 404 Not Found
```

#### File Extensions

```javascript
// Only lowercase letters with .png extension
app.get('/images/:name(^[a-z]+$).png', (req, res) => {
  res.json({
    filename: `${req.params.name}.png`,
    path: `/images/${req.params.name}.png`
  })
})
```

**Test it:**
```bash
curl http://localhost:3000/images/logo.png
# Response: {"filename":"logo.png","path":"/images/logo.png"}

curl http://localhost:3000/images/Logo123.png  # Has uppercase and digits
# Response: 404 Not Found
```

### Multiple Regex Parameters

Combine multiple regex-constrained parameters in a single route:

```javascript
// Time format: HH:MM (2-digit hours and minutes)
app.get('/schedule/:hour(^\\d{2}$)h:minute(^\\d{2}$)m', (req, res) => {
  const { hour, minute } = req.params
  res.json({
    time: `${hour}:${minute}`,
    hour: parseInt(hour),
    minute: parseInt(minute)
  })
})

// Geographic coordinates
app.get('/map/:lat(^-?\\d+\\.\\d+$)/:lng(^-?\\d+\\.\\d+$)', (req, res) => {
  res.json({
    latitude: parseFloat(req.params.lat),
    longitude: parseFloat(req.params.lng)
  })
})
```

**Test it:**
```bash
curl http://localhost:3000/schedule/14h30m
# Response: {"time":"14:30","hour":14,"minute":30}

curl http://localhost:3000/schedule/1h5m  # 1-digit numbers
# Response: 404 Not Found

curl http://localhost:3000/map/37.7749/-122.4194
# Response: {"latitude":37.7749,"longitude":-122.4194}
```

### Real-World Example: Product API with Validation

```javascript
const numflow = require('numflow')
const app = numflow()

// Product ID must be numeric
app.get('/api/products/:id(^\\d+$)', (req, res) => {
  const productId = parseInt(req.params.id)
  res.json({
    product: {
      id: productId,
      name: `Product ${productId}`,
      price: 100
    }
  })
})

// SKU must be alphanumeric with dashes
app.get('/api/products/sku/:sku(^[A-Z0-9-]+$)', (req, res) => {
  res.json({
    sku: req.params.sku,
    available: true
  })
})

// Date-based orders
app.get('/api/orders/:year(^\\d{4}$)/:month(^\\d{2}$)/:day(^\\d{2}$)', (req, res) => {
  const { year, month, day } = req.params
  res.json({
    date: `${year}-${month}-${day}`,
    orders: []
  })
})

app.listen(3000)
```

### ⚠️ Important: Express Compatibility Differences

**What's Supported in Numflow:**

```javascript
// ✅ Parametric regex constraints
app.get('/users/:id(^\\d+$)', handler)
app.get('/items/:uuid(^[0-9a-f-]+$)', handler)
app.get('/date/:date(^\\d{4}-\\d{2}-\\d{2}$)', handler)

// ✅ Wildcards
app.get('/files/*', handler)
app.get('*', handler)  // Catch-all
```

**What's NOT Supported (Express-only):**

```javascript
// ❌ Full-path regex (NOT SUPPORTED in Numflow)
app.get(/^\/users\/(\d+)$/, handler)
app.get(/\/admin\/.*/, handler)
app.get(new RegExp('/api/.*'), handler)

// Why? Express uses path-to-regexp (O(n) linear search)
// Numflow uses find-my-way (O(log n) Radix Tree)
```

**Migration Guide:**

If you're migrating from Express and have full-path regex routes, convert them to parametric constraints:

```javascript
// ❌ Express style (NOT supported)
app.get(/^\/api\/v\d+\/users\/(\d+)$/, (req, res) => {
  // Won't work in Numflow
})

// ✅ Numflow style (RECOMMENDED)
app.get('/api/:version(^v\\d+$)/users/:id(^\\d+$)', (req, res) => {
  const { version, id } = req.params
  res.json({ version, userId: id })
})
```

**Why the difference?**

- **Express**: Uses `path-to-regexp` which compiles paths to regex, allowing full-path regex patterns but with O(n) performance
- **Numflow**: Uses `find-my-way` with Radix Tree for O(log n) performance, supporting only parametric regex constraints

The trade-off: Numflow is **3.5x faster** than Express but doesn't support full-path regex patterns.

### Performance Considerations

**Regex routes have performance overhead** compared to basic routes:

| Route Type | req/s | Performance Impact |
|-----------|-------|-------------------|
| Basic route `/users/:id` | ~87,500 | Baseline (100%) |
| Regex route `/users/:id(^\\d+$)` | ~58,000 | -33% slower |
| Wildcard route `/files/*` | ~85,000 | -3% slower |

**Best Practices:**

1. **Use regex sparingly**: Only when validation is critical
2. **Prefer basic routes**: Use handler-level validation when possible
3. **Wildcard is fast**: Nearly as fast as basic routes
4. **Combine constraints wisely**: Multiple regex params multiply overhead

**Example: When to use each approach**

```javascript
// ❌ Overkill - regex for simple validation
app.get('/users/:id(^\\d+$)', (req, res) => {
  const id = parseInt(req.params.id)
  // Just validate here instead
})

// ✅ Better - validate in handler
app.get('/users/:id', (req, res) => {
  const id = parseInt(req.params.id)
  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid ID' })
  }
  res.json({ userId: id })
})

// ✅ Good use case - regex for strict formats
app.get('/logs/:date(^\\d{4}-\\d{2}-\\d{2}$)', (req, res) => {
  // Date format guaranteed to be valid
  res.json({ date: req.params.date })
})
```

### When to Use Regex Routing

**Good use cases:**
- UUID validation for security
- Date format enforcement
- File extension restrictions
- SKU/code format validation
- API versioning (e.g., `/api/:version(^v\\d+$)/users`)

**Avoid for:**
- Simple numeric validation (use handler-level checks)
- Complex multi-step validation (use validation libraries)
- High-throughput endpoints (every millisecond counts)

### Complete Advanced Routing Example

```javascript
const numflow = require('numflow')
const app = numflow()

// Homepage
app.get('/', (req, res) => {
  res.json({ message: 'Advanced Routing API' })
})

// UUID-validated resource
app.get('/resources/:uuid(^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$)', (req, res) => {
  res.json({ resourceId: req.params.uuid })
})

// Date-based logs
app.get('/logs/:date(^\\d{4}-\\d{2}-\\d{2}$)', (req, res) => {
  res.json({ date: req.params.date, logs: [] })
})

// Time-based schedule
app.get('/schedule/:hour(^\\d{2}$)h:minute(^\\d{2}$)m', (req, res) => {
  const { hour, minute } = req.params
  res.json({ time: `${hour}:${minute}` })
})

// Wildcard for static files
app.get('/static/*', (req, res) => {
  const path = req.url.replace('/static/', '')
  res.send(`Static file: ${path}`)
})

// Catch-all 404 (must be last!)
app.get('*', (req, res) => {
  res.status(404).json({ error: 'Not Found' })
})

app.listen(3000, () => {
  console.log('Advanced routing server running on port 3000')
})
```

**For more comprehensive examples and patterns, see:**
- [Regular Expression Routing Guide](../regex-routing-guide.md)
- [Router API Reference](../api/router.md#regular-expression-routing)

---

## Complete REST API Example

```javascript
const numflow = require('numflow')
const app = numflow()

// Homepage
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Numflow REST API',
    version: '1.0.0'
  })
})

// Users - List
app.get('/api/users', (req, res) => {
  res.json({
    users: [
      { id: 1, name: 'Alice', email: 'alice@example.com' },
      { id: 2, name: 'Bob', email: 'bob@example.com' }
    ]
  })
})

// Users - Get by ID
app.get('/api/users/:id', (req, res) => {
  const { id } = req.params
  res.json({
    user: { id, name: `User ${id}` }
  })
})

// Users - Create
app.post('/api/users', (req, res) => {
  const user = req.body
  res.status(201).json({
    success: true,
    message: 'User created',
    user
  })
})

// Users - Update
app.put('/api/users/:id', (req, res) => {
  const { id } = req.params
  res.json({
    success: true,
    message: `User ${id} updated`
  })
})

// Users - Delete
app.delete('/api/users/:id', (req, res) => {
  const { id } = req.params
  res.json({
    success: true,
    message: `User ${id} deleted`
  })
})

// Search (with query parameters)
app.get('/api/search', (req, res) => {
  const { q, page = '1' } = req.query
  res.json({
    query: q,
    page: parseInt(page),
    results: [
      { id: 1, title: `Result for "${q}"` }
    ]
  })
})

app.listen(3000, () => {
  console.log('REST API running on http://localhost:3000')
  console.log('\nAvailable endpoints:')
  console.log('  GET    /')
  console.log('  GET    /api/users')
  console.log('  GET    /api/users/:id')
  console.log('  POST   /api/users')
  console.log('  PUT    /api/users/:id')
  console.log('  DELETE /api/users/:id')
  console.log('  GET    /api/search?q=keyword&page=1')
})
```

### Test with curl

```bash
# List users
curl http://localhost:3000/api/users

# Get user by ID
curl http://localhost:3000/api/users/123

# Create user
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Charlie","email":"charlie@example.com"}'

# Delete user
curl -X DELETE http://localhost:3000/api/users/123

# Search with query parameters
curl "http://localhost:3000/api/search?q=numflow&page=2"
```

---

## What's Next?

You've learned the basics of routing in Numflow! Explore more:

- **[Middleware Guide](./middleware.md)** - Add middleware to routes
- **[Router API Reference](../api/router.md)** - Complete Router API
- **[Application API](../api/application.md)** - All routing methods
- **[Examples](../../examples/02-routing/)** - Real-world examples

---

*Last updated: 2025-11-07 (Expanded Advanced Patterns section with comprehensive regex routing guide and Express compatibility differences)*
