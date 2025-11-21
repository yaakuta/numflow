/**
 * Numflow Framework - Middleware System Examples
 * Phase 4: Express-compatible middleware system
 *
 * This file demonstrates how to use Numflow's middleware system.
 *
 * How to run:
 *   node examples/middleware.js
 *
 * Test:
 *   curl http://localhost:3000/
 *   curl http://localhost:3000/api/users
 *   curl http://localhost:3000/protected
 *   curl http://localhost:3000/error
 */

const numflow = require("numflow")

const app = numflow()

// ============================================================================
// 1. Global Middleware
// ============================================================================

// Request logging middleware - executed for all requests
app.use((req, res, next) => {
  const start = Date.now()
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`)

  // Log execution time when response is finished
  res.on('finish', () => {
    const duration = Date.now() - start
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - ${res.statusCode} (${duration}ms)`)
  })

  next()
})

// CORS middleware
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  // Handle OPTIONS preflight requests
  if (req.method === 'OPTIONS') {
    res.statusCode = 204
    res.end()
    return
  }

  next()
})

// Add Request ID middleware
app.use((req, res, next) => {
  req.requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  res.setHeader('X-Request-ID', req.requestId)
  next()
})

// ============================================================================
// 2. Path-based Middleware
// ============================================================================

// Middleware applied only to /api path
app.use('/api', (req, res, next) => {
  console.log('API middleware executed')
  req.isApiRequest = true
  next()
})

// Rate Limiting applied only to /api path (simple example)
const rateLimitMap = new Map()
app.use('/api', (req, res, next) => {
  const ip = req.socket.remoteAddress
  const now = Date.now()
  const windowMs = 60 * 1000 // 1 minute

  if (!rateLimitMap.has(ip)) {
    rateLimitMap.set(ip, [])
  }

  const requests = rateLimitMap.get(ip).filter(time => now - time < windowMs)
  requests.push(now)
  rateLimitMap.set(ip, requests)

  if (requests.length > 100) {
    res.statusCode = 429
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({
      success: false,
      error: 'Too Many Requests',
      message: 'Maximum 100 requests per minute allowed.',
    }))
    return
  }

  next()
})

// ============================================================================
// 3. Reusable Middleware Functions
// ============================================================================

// Authentication middleware
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.statusCode = 401
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({
      success: false,
      error: 'Unauthorized',
      message: 'Authentication token required.',
    }))
    return
  }

  const token = authHeader.substring(7)

  // Simple token validation (in practice, use JWT verification, etc.)
  if (token === 'valid-token') {
    req.user = { id: 1, name: 'Test User' }
    next()
  } else {
    res.statusCode = 401
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({
      success: false,
      error: 'Unauthorized',
      message: 'Invalid token.',
    }))
  }
}

// Authorization middleware factory
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      res.statusCode = 401
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({
        success: false,
        error: 'Unauthorized',
        message: 'Authentication required.',
      }))
      return
    }

    // Simple role validation (in practice, retrieve permissions from DB)
    const userRole = req.user.role || 'user'
    if (!roles.includes(userRole) && !roles.includes('admin')) {
      res.statusCode = 403
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({
        success: false,
        error: 'Forbidden',
        message: 'Permission denied.',
      }))
      return
    }

    next()
  }
}

// Request validation middleware factory
const validateBody = (schema) => {
  return (req, res, next) => {
    const { body } = req

    // Simple schema validation (in practice, use Joi, Zod, etc.)
    for (const [key, validator] of Object.entries(schema)) {
      const value = body[key]

      if (validator.required && !value) {
        res.statusCode = 400
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({
          success: false,
          error: 'Validation Error',
          message: `${key} field is required.`,
        }))
        return
      }

      if (value && validator.type && typeof value !== validator.type) {
        res.statusCode = 400
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({
          success: false,
          error: 'Validation Error',
          message: `${key} field must be of type ${validator.type}.`,
        }))
        return
      }

      if (value && validator.minLength && value.length < validator.minLength) {
        res.statusCode = 400
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({
          success: false,
          error: 'Validation Error',
          message: `${key} field must be at least ${validator.minLength} characters.`,
        }))
        return
      }
    }

    next()
  }
}

// Async middleware (database queries, etc.)
const loadUserFromDB = async (req, res, next) => {
  if (!req.user) {
    next()
    return
  }

  try {
    // Load user info from database (simulation)
    await new Promise(resolve => setTimeout(resolve, 10))

    req.user = {
      ...req.user,
      email: 'user@example.com',
      role: 'admin',
      createdAt: '2024-01-01',
    }

    next()
  } catch (error) {
    next(error)
  }
}

// ============================================================================
// 4. Route-specific Middleware
// ============================================================================

// Home page - no middleware
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Numflow Framework - Phase 4: Middleware System',
    requestId: req.requestId,
    features: [
      'Global Middleware',
      'Path-based Middleware',
      'Route-specific Middleware',
      'Error Middleware',
      'Middleware Chaining',
      'Express Compatibility',
    ],
  })
})

// API endpoint - /api middleware applied
app.get('/api/users', (req, res) => {
  res.json({
    success: true,
    isApiRequest: req.isApiRequest,
    users: [
      { id: 1, name: 'John Doe' },
      { id: 2, name: 'Jane Smith' },
    ],
  })
})

// Protected endpoint - authentication middleware applied
app.get('/protected', authenticate, (req, res) => {
  res.json({
    success: true,
    message: 'Only authenticated users can access.',
    user: req.user,
  })
})

// Admin-only endpoint - authentication + authorization middleware applied
app.get('/admin', authenticate, loadUserFromDB, authorize('admin'), (req, res) => {
  res.json({
    success: true,
    message: 'Only administrators can access.',
    user: req.user,
  })
})

// Create user - validation middleware applied
app.post(
  '/api/users',
  validateBody({
    name: { required: true, type: 'string', minLength: 2 },
    email: { required: true, type: 'string' },
    age: { required: false, type: 'number' },
  }),
  (req, res) => {
    const { name, email, age } = req.body

    res.status(201).json({
      success: true,
      user: {
        id: Date.now(),
        name,
        email,
        age,
        createdAt: new Date().toISOString(),
      },
    })
  }
)

// Route chaining - multiple middleware applied
app
  .route('/api/posts')
  .get((req, res) => {
    res.json({
      success: true,
      posts: [
        { id: 1, title: 'First Post' },
        { id: 2, title: 'Second Post' },
      ],
    })
  })
  .post(authenticate, validateBody({ title: { required: true, type: 'string' } }), (req, res) => {
    const { title } = req.body

    res.status(201).json({
      success: true,
      post: {
        id: Date.now(),
        title,
        author: req.user.name,
        createdAt: new Date().toISOString(),
      },
    })
  })

// ============================================================================
// 5. Routes that throw errors (for error middleware testing)
// ============================================================================

// Synchronous error
app.get('/error', (req, res, next) => {
  throw new Error('Intentional error for testing')
})

// Async error
app.get('/async-error', async (req, res, next) => {
  try {
    await new Promise((resolve, reject) => {
      setTimeout(() => reject(new Error('Async error')), 10)
    })
  } catch (error) {
    next(error)
  }
})

// ============================================================================
// 6. Error Middleware
// ============================================================================

// General error handler
app.use((err, req, res, next) => {
  console.error('Error:', err)

  res.statusCode = err.statusCode || 500
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify({
    success: false,
    error: err.name || 'Internal Server Error',
    message: err.message || 'Server error occurred.',
    requestId: req.requestId,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  }))
})

// Note: 404 handler will be implemented in Phase 5.
// Currently, the Router's default 404 handler is used.

// ============================================================================
// Start server
// ============================================================================

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
  console.log(`
==========================================================
Numflow Framework - Phase 4: Middleware System
==========================================================

Server is running on http://localhost:${PORT}

Test endpoints:
  - GET  /                         (Home page)
  - GET  /api/users                (API endpoint)
  - GET  /protected                (Authentication required)
  - GET  /admin                    (Admin permission required)
  - POST /api/users                (Validation required)
  - GET  /api/posts                (Post list)
  - POST /api/posts                (Create post - auth + validation)
  - GET  /error                    (Error test)
  - GET  /async-error              (Async error test)

Example requests:
  curl http://localhost:${PORT}/
  curl http://localhost:${PORT}/api/users
  curl -H "Authorization: Bearer valid-token" http://localhost:${PORT}/protected
  curl -H "Authorization: Bearer valid-token" http://localhost:${PORT}/admin
  curl -X POST http://localhost:${PORT}/api/users \\
    -H "Content-Type: application/json" \\
    -d '{"name":"John","email":"john@example.com","age":30}'

==========================================================
`)
})
