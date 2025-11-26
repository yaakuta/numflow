# Middleware

> Process requests and responses with reusable functions

Middleware are functions that execute during the request-response cycle. They can modify requests, perform operations, and pass control to the next middleware.

---

## Table of Contents

- [What is Middleware?](#what-is-middleware)
- [Application-Level Middleware](#application-level-middleware)
- [Route-Specific Middleware](#route-specific-middleware)
- [Error-Handling Middleware](#error-handling-middleware)
- [Router-Level Middleware](#router-level-middleware)
- [Built-in Middleware](#built-in-middleware)
- [Third-Party Middleware](#third-party-middleware)
- [Feature Middleware](#feature-middleware)

---

## What is Middleware?

Middleware functions have access to the request (`req`), response (`res`), and the `next` function to pass control to the next middleware.

### Basic Middleware Structure

```javascript
function myMiddleware(req, res, next) {
  // Do something with req or res
  console.log(`${req.method} ${req.url}`)

  // Pass control to next middleware
  next()
}
```

### Execution Flow

```
Request → Middleware 1 → Middleware 2 → Route Handler → Response
```

---

## Application-Level Middleware

Middleware that runs on every request:

```javascript
const numflow = require('numflow')
const app = numflow()

// Logger middleware - runs on all requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`)
  next() // Pass to next middleware
})

// Timer middleware
app.use((req, res, next) => {
  req.startTime = Date.now()
  next()
})

app.get('/', (req, res) => {
  const elapsed = Date.now() - req.startTime
  res.json({ message: 'Hello', elapsed: `${elapsed}ms` })
})

app.listen(3000)
```

### Path-Specific Middleware

Run middleware only for specific paths:

```javascript
// Only for /api routes
app.use('/api', (req, res, next) => {
  console.log('API request:', req.url)
  next()
})

app.get('/api/users', (req, res) => {
  res.json({ users: [] })
})

// Middleware doesn't run for this route
app.get('/public', (req, res) => {
  res.send('Public endpoint')
})
```

### Multiple Middleware

Chain multiple middleware functions:

```javascript
const logger = (req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`)
  next()
}

const timer = (req, res, next) => {
  req.startTime = Date.now()
  next()
}

const addHeaders = (req, res, next) => {
  res.setHeader('X-Powered-By', 'Numflow')
  next()
}

// Register multiple middleware at once
app.use(logger, timer, addHeaders)
```

---

## Route-Specific Middleware

Apply middleware to specific routes:

```javascript
const numflow = require('numflow')
const app = numflow()

// Authentication middleware
const requireAuth = (req, res, next) => {
  const token = req.get('Authorization')

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  // Verify token (simplified example)
  req.user = { id: 1, name: 'Alice' }
  next()
}

// Public route (no middleware)
app.get('/public', (req, res) => {
  res.json({ message: 'Public endpoint' })
})

// Protected route (with middleware)
app.get('/private', requireAuth, (req, res) => {
  res.json({
    message: 'Private endpoint',
    user: req.user
  })
})

// Multiple middleware for one route
const validator = (req, res, next) => {
  if (!req.body.name) {
    return res.status(400).json({ error: 'Name required' })
  }
  next()
}

app.post('/users', requireAuth, validator, (req, res) => {
  res.status(201).json({
    user: req.body,
    createdBy: req.user.name
  })
})
```

**Test it:**
```bash
# Public endpoint (no auth required)
curl http://localhost:3000/public

# Protected endpoint without auth (401)
curl http://localhost:3000/private

# Protected endpoint with auth
curl http://localhost:3000/private \
  -H "Authorization: Bearer valid-token"

# Create user with auth and validation
curl -X POST http://localhost:3000/users \
  -H "Authorization: Bearer valid-token" \
  -H "Content-Type: application/json" \
  -d '{"name":"Bob"}'
```

---

## Error-Handling Middleware

Handle errors centrally with error middleware (4 parameters):

```javascript
const numflow = require('numflow')
const app = numflow()

// Regular routes
app.get('/error', (req, res, next) => {
  const error = new Error('Something went wrong!')
  error.status = 500
  next(error) // Pass error to error middleware
})

// Error-handling middleware (must have 4 parameters)
app.use((err, req, res, next) => {
  console.error('Error:', err.message)

  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  })
})

app.listen(3000)
```

### Using Express-Style Error Middleware for Global Error Handling

Numflow uses Express-style error middleware with 4 parameters for global error handling:

```javascript
const numflow = require('numflow')
const { isHttpError } = numflow
const app = numflow()

// Error middleware must have 4 parameters
app.use((err, req, res, next) => {
  console.error(err)

  // Use isHttpError() for duck typing - works across module instances
  if (isHttpError(err)) {
    return res.status(err.statusCode).json({
      error: err.message,
      ...(err.validationErrors && { validationErrors: err.validationErrors })
    })
  }

  // Default error response
  res.status(500).json({ error: 'Internal Server Error' })
})

// Throw errors in routes
app.get('/users/:id', async (req, res) => {
  const user = await database.findUser(req.params.id)
  if (!user) {
    throw new NotFoundError('User not found')
  }
  res.json(user)
})
```

**Note:** Error middleware must have exactly 4 parameters `(err, req, res, next)` to be recognized as error middleware.

---

## Router-Level Middleware

Apply middleware to all routes in a Router:

```javascript
const numflow = require('numflow')
const router = numflow.Router()

// Router-level middleware
router.use((req, res, next) => {
  console.log('Router Time:', Date.now())
  next()
})

// Authentication for all routes in this router
const authenticate = (req, res, next) => {
  if (!req.get('Authorization')) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  req.user = { id: 1, name: 'Alice' }
  next()
}

router.use(authenticate)

// All routes automatically run authenticate middleware
router.get('/users', (req, res) => {
  res.json({ users: [], authenticatedAs: req.user.name })
})

router.post('/users', (req, res) => {
  res.status(201).json({ message: 'User created', by: req.user.name })
})

// Mount router
const app = numflow()
app.use('/api', router)
app.listen(3000)
```

---

## Built-in Middleware

Numflow includes several built-in middleware:

### Body Parser (Automatic)

Automatically parses JSON and URL-encoded bodies:

```javascript
const numflow = require('numflow')
const app = numflow()

// Body parsing is enabled by default!
app.post('/users', (req, res) => {
  const { name, email } = req.body
  res.json({ name, email })
})

// Disable if needed
app.disableBodyParser()

// Configure body parser
app.configureBodyParser({ limit: '10mb' })
```

### Static Files

```javascript
const numflow = require('numflow')
const app = numflow()

// Serve static files from 'public' directory
app.use(numflow.static('public'))

// Or with options
app.use(numflow.static('public', {
  maxAge: 86400000, // 1 day
  dotfiles: 'deny',
}))
```

### CORS

```javascript
const numflow = require('numflow')
const app = numflow()

// Enable CORS for all routes
app.use(numflow.cors())

// Or with options
app.use(numflow.cors({
  origin: 'https://example.com',
  methods: ['GET', 'POST'],
  credentials: true,
}))
```

### Compression

```javascript
const numflow = require('numflow')
const app = numflow()

// Enable gzip/deflate compression
app.use(numflow.compression())

// Or with options
app.use(numflow.compression({
  threshold: 1024, // Only compress if response > 1KB
}))
```

---

## Third-Party Middleware

Numflow is 100% compatible with Express middleware:

```javascript
const numflow = require('numflow')
const morgan = require('morgan')
const helmet = require('helmet')
const cookieParser = require('cookie-parser')
const session = require('express-session')

const app = numflow()

// Use Express middleware directly
app.use(morgan('dev'))                    // Logging
app.use(helmet())                         // Security headers
app.use(cookieParser())                   // Parse cookies
app.use(session({                         // Sessions
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true,
}))

app.get('/', (req, res) => {
  res.json({ message: 'Hello World' })
})

app.listen(3000)
```

**Verified Compatible Middleware:**
- ✅ `morgan` - HTTP request logger
- ✅ `helmet` - Security headers
- ✅ `cors` - CORS support
- ✅ `compression` - Response compression
- ✅ `cookie-parser` - Cookie parsing
- ✅ `express-session` - Session management
- ✅ `passport` - Authentication
- ✅ `multer` - File uploads
- ✅ `express-rate-limit` - Rate limiting
- ✅ And more...

---

## Feature Middleware

Use middleware with Feature-First Auto-Orchestration:

```javascript
// features/api/orders/@post/index.js
const numflow = require('numflow')

const requireAuth = (req, res, next) => {
  if (!req.get('Authorization')) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  req.user = { id: 1, name: 'Alice' }
  next()
}

const validateOrder = (req, res, next) => {
  if (!req.body.items || req.body.items.length === 0) {
    return res.status(400).json({ error: 'Order must have items' })
  }
  next()
}

module.exports = numflow.feature({
  // method: 'POST'         ← Auto-inferred from 'post' folder!
  // path: '/api/orders'    ← Auto-inferred from folder structure!

  // Feature-specific middleware
  middlewares: [requireAuth, validateOrder],

  contextInitializer: (ctx, req, res) => {
    ctx.userId = req.user.id // From requireAuth middleware
    ctx.orderData = req.body // Already validated by validateOrder
  },

  // steps: './steps'     ← Auto-discovered!

  onError: async (error, context, req, res) => {
    console.error('Order creation failed:', error)
    res.status(500).json({ error: error.message })
  },
})
```

### Execution Order

```
1. Global middleware (app.use)
2. Feature middleware (middlewares: [...])
3. contextInitializer
4. Steps execution
5. onError (if error occurs)
```

---

## Real-World Example: Complete Middleware Stack

```javascript
const numflow = require('numflow')
const morgan = require('morgan')
const helmet = require('helmet')
const cors = require('cors')

const app = numflow()

// 1. Security middleware (first)
app.use(helmet())

// 2. CORS (before authentication)
app.use(cors({
  origin: 'https://example.com',
  credentials: true,
}))

// 3. Logging
app.use(morgan('combined'))

// 4. Global timer
app.use((req, res, next) => {
  req.startTime = Date.now()
  next()
})

// 5. Authentication middleware
const requireAuth = (req, res, next) => {
  const token = req.get('Authorization')?.replace('Bearer ', '')

  if (!token) {
    return res.status(401).json({ error: 'No token provided' })
  }

  if (token !== 'valid-token') {
    return res.status(403).json({ error: 'Invalid token' })
  }

  req.user = { id: 1, name: 'Alice' }
  next()
}

// 6. Public routes
app.get('/', (req, res) => {
  res.send('Homepage')
})

app.post('/api/login', (req, res) => {
  const { email, password } = req.body
  // Login logic here
  res.json({ token: 'valid-token' })
})

// 7. Protected routes
app.get('/api/profile', requireAuth, (req, res) => {
  const elapsed = Date.now() - req.startTime
  res.json({
    user: req.user,
    elapsed: `${elapsed}ms`
  })
})

app.post('/api/posts', requireAuth, (req, res) => {
  const { title, content } = req.body
  res.status(201).json({
    post: {
      id: Date.now(),
      title,
      content,
      author: req.user.name
    }
  })
})

// 8. Global error handler (last)
app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).json({ error: 'Internal Server Error' })
})

app.listen(3000, () => {
  console.log('Server running with complete middleware stack')
})
```

**Test it:**
```bash
# Public endpoint
curl http://localhost:3000/

# Login
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"password123"}'

# Protected endpoint with auth
curl http://localhost:3000/api/profile \
  -H "Authorization: Bearer valid-token"

# Protected endpoint without auth (401)
curl http://localhost:3000/api/profile
```

---

## Middleware Best Practices

1. **Order matters**: Security → CORS → Logging → Authentication → Routes → Error handling
2. **Always call next()**: Don't forget to call `next()` unless you're ending the response
3. **Error handling**: Pass errors to `next(error)` for centralized handling
4. **Path specificity**: Apply middleware only where needed to reduce overhead
5. **Modular design**: Create reusable middleware functions
6. **Test middleware**: Write tests for middleware independently

---

## What's Next?

You've learned how to use middleware in Numflow! Explore more:

- **[Error Handling Guide](./error-handling.md)** - Advanced error handling
- **[Feature-First Guide](./feature-first.md)** - Use middleware with features
- **[Built-in Middleware API](../api/built-in-middleware.md)** - Complete middleware API
- **[Examples](../../examples/03-middleware/)** - Real-world middleware examples

---

*Last updated: 2025-10-20*
