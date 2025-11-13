# Middleware

Learn Numflow's powerful middleware system.

## 📚 Learning Objectives

- Understanding middleware concepts
- Registering global middleware with app.use()
- Applying route-specific middleware
- Error handling middleware
- Multiple middleware chaining

## 📂 Example List

| File | Difficulty | Description | Time |
|------|------------|-------------|------|
| `01-basic-middleware.js` | ⭐⭐ Intermediate | Basic middleware patterns | 10 min |
| `02-multiple-middleware.js` | ⭐⭐ Intermediate | Multiple middleware chain | 15 min |
| `03-feature-middleware.js` | ⭐⭐⭐ Advanced | Feature middleware | 20 min |
| `04-error-middleware.js` | ⭐⭐⭐ Advanced | Error handling middleware | 20 min |

## 🚀 Quick Start

### 1. Basic Middleware

```bash
node examples/03-middleware/01-basic-middleware.js

# Test
curl http://localhost:3000/
curl http://localhost:3000/about
```

### 2. Multiple Middleware

```bash
node examples/03-middleware/02-multiple-middleware.js

# Test
curl http://localhost:3000/api/users
curl http://localhost:3000/api/admin
```

## 💡 Core Concepts

### What is Middleware?

Middleware is a function that executes between Request and Response.

```javascript
// Middleware function structure
function middleware(req, res, next) {
  // 1. Pre-processing
  console.log('Request received:', req.method, req.path)

  // 2. Pass control to next middleware
  next()

  // 3. Post-processing (optional)
  // Code after next() runs after response completes
}

app.use(middleware)
```

### Middleware Execution Order

```javascript
// 1. Global middleware (applied to all requests)
app.use(logger)

// 2. Path-specific middleware
app.use('/api', authenticate)

// 3. Route handler
app.get('/api/users', getUsers)

// 4. Error middleware (last)
app.use(errorHandler)
```

### next() Function

- `next()`: Pass control to next middleware
- `next('route')`: Skip to next route in current router
- `next(error)`: Jump to error middleware

## 📖 Middleware Patterns

### 1. Global Middleware

Applied to all requests.

```javascript
// Logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`)
  next()
})
```

### 2. Path-Specific Middleware

Applied only to specific paths.

```javascript
// Apply to all paths starting with /api
app.use('/api', authenticate)
```

### 3. Route-Specific Middleware

Applied only to specific routes.

```javascript
// Single middleware
app.get('/protected', authenticate, handler)

// Multiple middleware
app.get('/admin', [authenticate, checkAdmin], handler)
```

### 4. Error Middleware

Special middleware for error handling.

```javascript
// Must have 4 parameters
app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).json({ error: err.message })
})
```

## 🛠️ Practical Middleware Examples

### Logging Middleware

```javascript
function logger(req, res, next) {
  const start = Date.now()

  res.on('finish', () => {
    const duration = Date.now() - start
    console.log(`${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`)
  })

  next()
}

app.use(logger)
```

### Authentication Middleware

```javascript
function authenticate(req, res, next) {
  const token = req.headers.authorization

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  // Token verification logic
  req.user = verifyToken(token)
  next()
}

app.use('/api/protected', authenticate)
```

### CORS Middleware

```javascript
function cors(req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  next()
}

app.use(cors)
```

## 🎯 Express Compatibility

Numflow middleware is 100% compatible with Express.

```javascript
// Express middleware works as-is
const express = require('express')
const numbers = require('numflow')

const app = numbers()

// Use Express body parser directly
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Custom middleware works identically
app.use((req, res, next) => {
  console.log('Works in both!')
  next()
})
```

## Next Steps

After completing Middleware, move to the next sections:

- **[04-request-response](../04-request-response/)** - Advanced Request/Response features
- **[05-error-handling](../05-error-handling/)** - Unified error handling
