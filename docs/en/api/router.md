# Router API Reference

> Modular routing for scalable applications

Router is a powerful tool for modularized routing, 100% compatible with Express Router. Organize your application by feature/resource for better maintainability.

---

## Table of Contents

- [Creating a Router](#creating-a-router)
- [Middleware Methods](#middleware-methods)
- [Route Methods](#route-methods)
- [Route Chaining](#route-chaining)
- [Mounting Routers](#mounting-routers)
- [Nested Routers](#nested-routers)
- [Real-World Examples](#real-world-examples)

---

## Creating a Router

### numflow.Router([options])

Creates a new Router instance.

**Parameters:**
- `options` (object, optional): Router configuration
  - `caseSensitive` (boolean): Enable case-sensitive routing (default: `false`)
  - `ignoreTrailingSlash` (boolean): Ignore trailing slashes (default: `true`)

**Returns:** `Router` instance

**JavaScript (CommonJS):**
```javascript
const numflow = require('numflow')
const router = numflow.Router()

router.get('/users', (req, res) => {
  res.json({ users: [] })
})

module.exports = router
```

**JavaScript (ESM):**
```javascript
import numflow from 'numflow'
const router = numflow.Router()

router.get('/users', (req, res) => {
  res.json({ users: [] })
})

export default router
```

**TypeScript:**
```typescript
import numflow, { Router } from 'numflow'
const router: Router = numflow.Router()

router.get('/users', (req, res) => {
  res.json({ users: [] })
})

export default router
```

---

## Middleware Methods

### router.use([path], ...middleware)

Register router-level middleware or mount nested routers.

#### Global Middleware

Apply middleware to all routes in this router:

```javascript
const router = numflow.Router()

// Apply to all routes
router.use((req, res, next) => {
  console.log('Time:', Date.now())
  next()
})

// Multiple middleware
router.use(logger, authenticate, authorize)

router.get('/users', (req, res) => {
  // All middleware above runs first
  res.json({ users: [] })
})
```

#### Path-Specific Middleware

Apply middleware only to specific paths:

```javascript
const router = numflow.Router()

// Only for /admin routes
router.use('/admin', requireAdmin)

// Multiple middleware
router.use('/admin', authenticate, authorize, audit)
```

#### Mounting Nested Routers

Mount another Router within this router:

```javascript
const numflow = require('numflow')

// Main router
const apiRouter = numflow.Router()

// Nested router - Users
const usersRouter = numflow.Router()
usersRouter.get('/', (req, res) => {
  res.json({ users: [] })
})

// Nested router - Posts
const postsRouter = numflow.Router()
postsRouter.get('/', (req, res) => {
  res.json({ posts: [] })
})

// Mount nested routers
apiRouter.use('/users', usersRouter)
apiRouter.use('/posts', postsRouter)

// Result URLs:
// /users → usersRouter
// /posts → postsRouter
```

**Returns:** `Router` (supports chaining)

---

## Route Methods

### router.METHOD(path, ...handlers)

Register route handlers for specific HTTP methods.

**Supported Methods:**
- `router.get(path, ...handlers)` - GET requests
- `router.post(path, ...handlers)` - POST requests
- `router.put(path, ...handlers)` - PUT requests
- `router.delete(path, ...handlers)` - DELETE requests
- `router.patch(path, ...handlers)` - PATCH requests
- `router.options(path, ...handlers)` - OPTIONS requests
- `router.head(path, ...handlers)` - HEAD requests
- `router.all(path, ...handlers)` - All HTTP methods

**Examples:**

```javascript
const router = numflow.Router()

// GET route
router.get('/users', (req, res) => {
  res.json({ users: [] })
})

// POST route
router.post('/users', (req, res) => {
  const user = req.body
  res.status(201).json({ user })
})

// Dynamic parameters
router.get('/users/:id', (req, res) => {
  const userId = req.params.id
  res.json({ userId })
})

// Middleware chaining
router.post('/users', authenticate, validate, (req, res) => {
  res.status(201).json({ user: req.body })
})

// Handle all methods
router.all('/test', (req, res) => {
  res.json({ method: req.method })
})
```

**Returns:** `Router` (supports chaining)

### Duplicate Route Detection

Numflow detects duplicate route registrations at server startup:

```javascript
const router = numflow.Router()

// First registration - OK
router.get('/users', (req, res) => {
  res.json({ users: [] })
})

// Second registration - Error!
router.get('/users', (req, res) => {
  res.json({ users: [] })
})
// → Error: Duplicate route registration: GET /users
```

**What's Allowed:**

```javascript
// ✅ Same path, different method - Allowed
router.get('/users', handler)
router.post('/users', handler)

// ✅ Different path, same method - Allowed
router.get('/users', handler)
router.get('/posts', handler)
```

**Interaction with router.all():**

```javascript
// router.all() registers for all methods
router.all('/users', handler)

// So this fails (duplicate):
router.get('/users', handler)
// → Error: Duplicate route registration: GET /users
```

---

## Regular Expression Routing

### Parametric Regex Constraints

Numflow supports regular expression constraints on route parameters to validate and restrict matching patterns.

**Basic Syntax:**
```javascript
router.get('/path/:param(regex)', handler)
```

**Examples:**

```javascript
const router = numflow.Router()

// 1. Numeric IDs only
router.get('/users/:id(^\\d+$)', (req, res) => {
  // Matches: /users/123
  // Rejects: /users/abc
  res.json({ userId: req.params.id })
})

// 2. UUID format validation
router.get('/items/:uuid(^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$)', (req, res) => {
  // Matches: /items/550e8400-e29b-41d4-a716-446655440000
  res.json({ itemId: req.params.uuid })
})

// 3. Date format (YYYY-MM-DD)
router.get('/logs/:date(^\\d{4}-\\d{2}-\\d{2}$)', (req, res) => {
  // Matches: /logs/2025-01-15
  res.json({ date: req.params.date })
})

// 4. File extensions
router.get('/files/:name(^[a-z]+$).png', (req, res) => {
  // Matches: /files/logo.png
  // Rejects: /files/Logo123.png
  res.json({ filename: req.params.name })
})
```

### Multiple Regex Parameters

Combine multiple regex-constrained parameters in a single route:

```javascript
const router = numflow.Router()

// Time format: HH:MM (2-digit hours and minutes)
router.get('/schedule/:hour(^\\d{2}$)h:minute(^\\d{2}$)m', (req, res) => {
  // Matches: /schedule/14h30m
  // Rejects: /schedule/1h5m (1-digit numbers)
  const { hour, minute } = req.params
  res.json({ hour, minute })
})

// Coordinates: latitude and longitude
router.get('/map/:lat(^-?\\d+\\.\\d+$)/:lng(^-?\\d+\\.\\d+$)', (req, res) => {
  // Matches: /map/37.7749/-122.4194
  res.json({
    latitude: parseFloat(req.params.lat),
    longitude: parseFloat(req.params.lng)
  })
})
```

### Wildcard Routes

Match any remaining path segments with the wildcard `*`:

```javascript
const router = numflow.Router()

// Static file serving
router.get('/static/*', (req, res) => {
  const filePath = req.url.replace('/static/', '')
  res.send(`Serving: ${filePath}`)
})

// Catch-all 404
router.get('*', (req, res) => {
  res.status(404).json({ error: 'Not Found' })
})
```

### ⚠️ Important: Express Compatibility Differences

**What's Supported:**
```javascript
// ✅ Parametric regex constraints (Numflow)
router.get('/users/:id(^\\d+$)', handler)
router.get('/items/:uuid(^[0-9a-f-]+$)', handler)
router.get('/files/*', handler)  // Wildcard
```

**What's NOT Supported:**
```javascript
// ❌ Full-path regex (Express style)
router.get(/^\/users\/(\d+)$/, handler)  // NOT SUPPORTED
router.get(/\/admin\/.*/, handler)       // NOT SUPPORTED

// ❌ Regex objects as paths
router.get(new RegExp('/api/.*'), handler)  // NOT SUPPORTED
```

**Why the difference?**

Numflow uses **find-my-way** (Radix Tree router) for O(log n) performance, which only supports parametric regex constraints. Express uses **path-to-regexp** which supports full-path regex but has O(n) performance.

**Migration from Express:**

If you have Express routes using full-path regex, convert them to parametric constraints:

```javascript
// Express (full-path regex)
app.get(/^\/api\/v\d+\/users\/(\d+)$/, handler)

// Numflow (parametric constraints)
app.get('/api/:version(^v\\d+$)/users/:id(^\\d+$)', handler)
```

### Performance Considerations

**Regex routes are ~33% slower** than basic routes due to pattern matching overhead:

| Route Type | Performance | Use Case |
|-----------|------------|----------|
| Basic (`/users/:id`) | ~87,500 req/s | General use |
| Regex (`/users/:id(^\\d+$)`) | ~58,000 req/s | Input validation |
| Wildcard (`/files/*`) | ~85,000 req/s | Catch-all patterns |

**Best Practices:**
- Use regex constraints sparingly
- Prefer basic routes when validation isn't critical
- Validate in handler if performance is critical
- Use wildcards for catch-all scenarios

### Complete Example

```javascript
const numflow = require('numflow')
const router = numflow.Router()

// Basic route
router.get('/users', (req, res) => {
  res.json({ users: [] })
})

// Numeric ID constraint
router.get('/users/:id(^\\d+$)', (req, res) => {
  res.json({ user: { id: req.params.id } })
})

// Date-based filtering
router.get('/logs/:year(^\\d{4}$)/:month(^\\d{2}$)/:day(^\\d{2}$)', (req, res) => {
  const { year, month, day } = req.params
  res.json({ date: `${year}-${month}-${day}` })
})

// Wildcard for file serving
router.get('/static/*', (req, res) => {
  res.send('Static file')
})

module.exports = router
```

**For comprehensive examples and patterns, see:**
- [Regular Expression Routing Guide](../regex-routing-guide.md)

---

## Route Chaining

### router.route(path)

Create a route chain to register multiple HTTP methods on the same path.

**Examples:**

```javascript
const router = numflow.Router()

router.route('/users/:id')
  .get((req, res) => {
    // GET /users/:id
    res.json({ user: { id: req.params.id } })
  })
  .put((req, res) => {
    // PUT /users/:id
    res.json({ updated: true })
  })
  .delete((req, res) => {
    // DELETE /users/:id
    res.json({ deleted: true })
  })
```

**TypeScript:**
```typescript
import numflow from 'numflow'
const router = numflow.Router()

router.route('/users/:id')
  .get((req, res) => {
    res.json({ user: { id: req.params.id } })
  })
  .put((req, res) => {
    res.json({ updated: true })
  })
  .delete((req, res) => {
    res.json({ deleted: true })
  })
```

**Returns:** `RouteChain` object

---

## Mounting Routers

### Basic Mounting

Mount a router to the application:

```javascript
const numflow = require('numflow')
const app = numflow()
const apiRouter = numflow.Router()

apiRouter.get('/users', (req, res) => {
  res.json({ users: [] })
})

// Mount router at /api
app.use('/api', apiRouter)

// Result URL: /api/users
```

### Multiple Router Mounting

```javascript
const app = numflow()

const usersRouter = numflow.Router()
const postsRouter = numflow.Router()
const productsRouter = numflow.Router()

usersRouter.get('/', (req, res) => res.json({ users: [] }))
postsRouter.get('/', (req, res) => res.json({ posts: [] }))
productsRouter.get('/', (req, res) => res.json({ products: [] }))

app.use('/users', usersRouter)
app.use('/posts', postsRouter)
app.use('/products', productsRouter)

// Result URLs:
// /users → usersRouter
// /posts → postsRouter
// /products → productsRouter
```

---

## Nested Routers

Create hierarchical route structures:

```javascript
const app = numflow()

// Level 1: Users Router
const usersRouter = numflow.Router()

// Level 2: Posts Router (under Users)
const postsRouter = numflow.Router()
postsRouter.get('/', (req, res) => {
  const userId = req.params.userId
  res.json({ userId, posts: [] })
})

// Level 3: Comments Router (under Posts)
const commentsRouter = numflow.Router()
commentsRouter.get('/', (req, res) => {
  const { userId, postId } = req.params
  res.json({ userId, postId, comments: [] })
})

// Nest routers
postsRouter.use('/:postId/comments', commentsRouter)
usersRouter.use('/:userId/posts', postsRouter)
app.use('/users', usersRouter)

// Result URLs:
// /users/:userId/posts → postsRouter
// /users/:userId/posts/:postId/comments → commentsRouter
```

---

## Real-World Examples

### Modular API Structure

```javascript
// routes/users.js
const numflow = require('numflow')
const router = numflow.Router()
const { authenticate } = require('../middleware/auth')
const {
  getAllUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser
} = require('../controllers/users')

// Middleware
router.use(authenticate)

// Routes
router.get('/', getAllUsers)
router.get('/:id', getUser)
router.post('/', createUser)
router.put('/:id', updateUser)
router.delete('/:id', deleteUser)

module.exports = router
```

```javascript
// routes/posts.js
const numflow = require('numflow')
const router = numflow.Router()
const { authenticate } = require('../middleware/auth')
const {
  getAllPosts,
  getPost,
  createPost
} = require('../controllers/posts')

router.use(authenticate)

router.get('/', getAllPosts)
router.get('/:id', getPost)
router.post('/', createPost)

module.exports = router
```

```javascript
// app.js
const numflow = require('numflow')
const app = numflow()

const usersRouter = require('./routes/users')
const postsRouter = require('./routes/posts')

app.use('/api/users', usersRouter)
app.use('/api/posts', postsRouter)

app.listen(3000)
```

### RESTful API with Router

```javascript
const numflow = require('numflow')
const app = numflow()

// API Router
const apiRouter = numflow.Router()

// Users Router
const usersRouter = numflow.Router()
usersRouter.get('/', (req, res) => {
  res.json({
    users: [
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' }
    ]
  })
})
usersRouter.post('/', (req, res) => {
  res.status(201).json({ user: req.body })
})
usersRouter.get('/:id', (req, res) => {
  res.json({ user: { id: req.params.id } })
})
usersRouter.put('/:id', (req, res) => {
  res.json({ updated: true })
})
usersRouter.delete('/:id', (req, res) => {
  res.json({ deleted: true })
})

// Posts Router
const postsRouter = numflow.Router()
postsRouter.get('/', (req, res) => {
  res.json({ posts: [] })
})
postsRouter.post('/', (req, res) => {
  res.status(201).json({ post: req.body })
})

// Mount to API Router
apiRouter.use('/users', usersRouter)
apiRouter.use('/posts', postsRouter)

// Mount to App
app.use('/api', apiRouter)

app.listen(3000)

// Result URLs:
// GET    /api/users
// POST   /api/users
// GET    /api/users/:id
// PUT    /api/users/:id
// DELETE /api/users/:id
// GET    /api/posts
// POST   /api/posts
```

---

## Express Compatibility

Numflow's Router is 100% compatible with Express Router.

```javascript
// Express code
const express = require('express')
const router = express.Router()

// Numflow code (identical!)
const numflow = require('numflow')
const router = numflow.Router()
```

All Express Router code works in Numflow without modifications!

---

## Related Documentation

- **[Application API](./application.md)** - Mount routers with app.use()
- **[Routing Guide](../guides/routing.md)** - Routing patterns and best practices
- **[Middleware Guide](../guides/middleware.md)** - Middleware patterns
- **[Examples](../../examples/02-routing/)** - Router examples

---

*Last updated: 2025-11-07 (Added comprehensive Regular Expression Routing section with Express compatibility notes)*
