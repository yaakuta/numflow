/**
 * 04-error-middleware.js
 *
 * Example to learn error handling middleware.
 * Learn how to centrally handle synchronous/asynchronous errors.
 *
 * Learning Objectives:
 * - Writing error middleware (err, req, res, next)
 * - Handling synchronous errors
 * - Handling asynchronous errors (async/await)
 * - Custom error classes
 * - Standardizing error response format
 *
 * How to Run:
 * node examples/03-middleware/04-error-middleware.js
 *
 * Testing:
 * # Successful request
 * curl http://localhost:3000/api/success
 *
 * # Synchronous error
 * curl http://localhost:3000/api/sync-error
 *
 * # Asynchronous error
 * curl http://localhost:3000/api/async-error
 *
 * # Custom error
 * curl http://localhost:3000/api/custom-error
 *
 * # 404 error
 * curl http://localhost:3000/api/not-found
 */

const numflow = require("numflow")

const app = numflow()

// ===========================================
// Custom Error Classes
// ===========================================

class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = true // Indicates this is an expected error
    Error.captureStackTrace(this, this.constructor)
  }
}

class ValidationError extends AppError {
  constructor(message) {
    super(message, 400)
    this.name = 'ValidationError'
  }
}

class NotFoundError extends AppError {
  constructor(resource) {
    super(`${resource} not found.`, 404)
    this.name = 'NotFoundError'
  }
}

class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required.') {
    super(message, 401)
    this.name = 'UnauthorizedError'
  }
}

// ===========================================
// Logging Middleware
// ===========================================

function logger(req, res, next) {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`)
  next()
}

app.use(logger)

// ===========================================
// 1. Successful Request
// ===========================================

app.get('/api/success', (req, res) => {
  res.json({
    success: true,
    message: 'Request processed successfully.',
  })
})

// ===========================================
// 2. Synchronous Error (throw)
// ===========================================

app.get('/api/sync-error', (req, res) => {
  // Errors thrown with 'throw' are automatically passed to error middleware
  throw new Error('Synchronous error occurred!')
})

// ===========================================
// 3. Asynchronous Error (async/await)
// ===========================================

app.get('/api/async-error', async (req, res, next) => {
  try {
    // Simulate asynchronous operation
    await new Promise((resolve, reject) => {
      setTimeout(() => {
        reject(new Error('Asynchronous error occurred!'))
      }, 100)
    })

    res.json({ success: true })
  } catch (error) {
    // Pass caught error to next() for error middleware to handle
    next(error)
  }
})

// ===========================================
// 4. Using Custom Errors
// ===========================================

app.get('/api/custom-error', (req, res, next) => {
  // Use custom error class
  next(new ValidationError('Input value is invalid.'))
})

app.get('/api/not-found-error', (req, res, next) => {
  next(new NotFoundError('User'))
})

app.get('/api/unauthorized-error', (req, res, next) => {
  next(new UnauthorizedError())
})

// ===========================================
// 5. Conditional Error
// ===========================================

app.get('/api/divide/:a/:b', (req, res, next) => {
  const a = parseInt(req.params.a)
  const b = parseInt(req.params.b)

  // Input validation
  if (isNaN(a) || isNaN(b)) {
    return next(new ValidationError('a and b must be numbers.'))
  }

  // Prevent division by zero
  if (b === 0) {
    return next(new ValidationError('Cannot divide by zero.'))
  }

  res.json({
    success: true,
    result: a / b,
  })
})

// ===========================================
// 6. Database Error Simulation
// ===========================================

const users = [
  { id: 1, name: 'Alice' },
  { id: 2, name: 'Bob' },
]

app.get('/api/users/:id', async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id)

    if (isNaN(userId)) {
      throw new ValidationError('Please enter a valid user ID.')
    }

    // Simulate database lookup
    const user = users.find((u) => u.id === userId)

    if (!user) {
      throw new NotFoundError('User')
    }

    res.json({
      success: true,
      data: user,
    })
  } catch (error) {
    next(error)
  }
})

// ===========================================
// 404 Handler (when no registered route matches)
// ===========================================

// If no route matches after processing all routes, return 404
app.use((req, res, next) => {
  next(new NotFoundError(`${req.method} ${req.path}`))
})

// ===========================================
// Error Handling Middleware (must be registered last!)
// ===========================================

// Development environment error handler (includes detailed info)
function developmentErrorHandler(err, req, res, next) {
  console.error('❌ Error occurred:')
  console.error('  Message:', err.message)
  console.error('  Stack:', err.stack)

  const statusCode = err.statusCode || 500

  res.status(statusCode).json({
    success: false,
    error: {
      message: err.message,
      statusCode: statusCode,
      name: err.name || 'Error',
      stack: err.stack, // Include stack trace in development
    },
  })
}

// Production environment error handler (concise info only)
function productionErrorHandler(err, req, res, next) {
  console.error('❌ Error occurred:', err.message)

  const statusCode = err.statusCode || 500

  // Only expose message for operational errors (expected errors)
  if (err.isOperational) {
    res.status(statusCode).json({
      success: false,
      error: {
        message: err.message,
        statusCode: statusCode,
      },
    })
  } else {
    // Replace unexpected errors with generic message
    res.status(500).json({
      success: false,
      error: {
        message: 'Server error occurred.',
        statusCode: 500,
      },
    })
  }
}

// Use different error handlers based on environment
const isDevelopment = process.env.NODE_ENV !== 'production'
const errorHandler = isDevelopment ? developmentErrorHandler : productionErrorHandler

app.use(errorHandler)

// ===========================================
// Start Server
// ===========================================

const PORT = 3000
app.listen(PORT, () => {
  console.log(
    `✅ Error Middleware server is running at http://localhost:${PORT}\n`
  )
  console.log(`Environment: ${isDevelopment ? 'Development' : 'Production'}\n`)
  console.log('Test commands:')

  console.log(`\n  # 1. Successful request`)
  console.log(`  curl http://localhost:${PORT}/api/success`)

  console.log(`\n  # 2. Synchronous error`)
  console.log(`  curl http://localhost:${PORT}/api/sync-error`)

  console.log(`\n  # 3. Asynchronous error`)
  console.log(`  curl http://localhost:${PORT}/api/async-error`)

  console.log(`\n  # 4. Custom errors`)
  console.log(`  curl http://localhost:${PORT}/api/custom-error`)
  console.log(`  curl http://localhost:${PORT}/api/not-found-error`)
  console.log(`  curl http://localhost:${PORT}/api/unauthorized-error`)

  console.log(`\n  # 5. Conditional errors`)
  console.log(`  curl http://localhost:${PORT}/api/divide/10/2`)
  console.log(`  curl http://localhost:${PORT}/api/divide/10/0`)
  console.log(`  curl http://localhost:${PORT}/api/divide/abc/def`)

  console.log(`\n  # 6. Database errors`)
  console.log(`  curl http://localhost:${PORT}/api/users/1`)
  console.log(`  curl http://localhost:${PORT}/api/users/999`)
  console.log(`  curl http://localhost:${PORT}/api/users/abc`)

  console.log(`\n  # 7. 404 errors`)
  console.log(`  curl http://localhost:${PORT}/api/not-exist`)

  console.log(`\n💡 To run in production mode:`)
  console.log(`  NODE_ENV=production node examples/03-middleware/04-error-middleware.js`)
})
