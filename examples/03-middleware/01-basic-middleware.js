/**
 * 01-basic-middleware.js
 *
 * Example to learn basic middleware patterns.
 * Understand what middleware is and how it works.
 *
 * Learning Objectives:
 * - Writing middleware functions (req, res, next)
 * - Registering middleware with app.use()
 * - Passing control with next()
 * - Global middleware vs path-specific middleware
 *
 * How to Run:
 * node examples/03-middleware/01-basic-middleware.js
 *
 * Testing:
 * curl http://localhost:3000/
 * curl http://localhost:3000/about
 * curl http://localhost:3000/api/users
 * curl http://localhost:3000/api/products
 */

const numflow = require("numflow")

const app = numflow()

// ===========================================
// 1. Simplest Middleware
// ===========================================

// Middleware is a function that receives 3 parameters: (req, res, next)
function simpleLogger(req, res, next) {
  console.log('📝 Request received:', req.method, req.path)

  // Call next() to pass control to the next middleware or route handler.
  // If you don't call next(), the request will hang!
  next()
}

// Register middleware with app.use()
app.use(simpleLogger)

// ===========================================
// 2. Timing Middleware (Time Measurement)
// ===========================================

function timingMiddleware(req, res, next) {
  // Record request start time
  req.startTime = Date.now()

  // Event listener that executes when response completes
  res.on('finish', () => {
    const duration = Date.now() - req.startTime
    console.log(`⏱️  ${req.method} ${req.path} - Duration: ${duration}ms`)
  })

  next()
}

app.use(timingMiddleware)

// ===========================================
// 3. Request Info Addition Middleware
// ===========================================

// Middleware can add new properties to the req object
function requestInfoMiddleware(req, res, next) {
  // Generate request ID (for debugging)
  req.id = Math.random().toString(36).substring(7)

  // Add timestamp
  req.timestamp = new Date().toISOString()

  console.log(`🆔 Request ID: ${req.id}`)

  next()
}

app.use(requestInfoMiddleware)

// ===========================================
// 4. Path-Specific Middleware
// ===========================================

// Middleware applied only to paths starting with /api
function apiMiddleware(req, res, next) {
  console.log('🔧 API middleware executed')

  // Add API version info to req object
  req.apiVersion = 'v1'

  next()
}

// Register middleware with specified path
app.use('/api', apiMiddleware)

// ===========================================
// Routes (executed after middleware)
// ===========================================

// Homepage
app.get('/', (req, res) => {
  res.json({
    message: 'Hello World!',
    requestId: req.id,
    timestamp: req.timestamp,
  })
})

// About page
app.get('/about', (req, res) => {
  res.json({
    message: 'About Page',
    requestId: req.id,
    timestamp: req.timestamp,
  })
})

// API route (apiMiddleware applied)
app.get('/api/users', (req, res) => {
  res.json({
    message: 'Users API',
    apiVersion: req.apiVersion, // Value added by apiMiddleware
    requestId: req.id,
    timestamp: req.timestamp,
  })
})

// API route
app.get('/api/products', (req, res) => {
  res.json({
    message: 'Products API',
    apiVersion: req.apiVersion,
    requestId: req.id,
    timestamp: req.timestamp,
  })
})

// ===========================================
// 5. Conditional Middleware
// ===========================================

// Middleware that executes only under certain conditions
function conditionalMiddleware(req, res, next) {
  console.log('🔍 Conditional middleware executed')

  // Add detailed info if debug=true in query string
  if (req.query && req.query.debug === 'true') {
    req.debugMode = true
    console.log('🐛 Debug mode activated')
  }

  next()
}

app.use(conditionalMiddleware)

// Endpoint providing debug information
app.get('/debug', (req, res) => {
  if (req.debugMode) {
    res.json({
      message: 'Debug Mode',
      requestId: req.id,
      timestamp: req.timestamp,
      headers: req.headers,
      query: req.query,
      params: req.params,
    })
  } else {
    res.json({
      message: 'Normal Mode',
      hint: 'Try /debug?debug=true',
    })
  }
})

// ===========================================
// 6. Middleware Execution Order Check
// ===========================================

app.get('/order', (req, res) => {
  console.log('5️⃣ Route handler executed')

  res.json({
    message: 'Check middleware execution order in the console!',
    order: [
      '1. simpleLogger',
      '2. timingMiddleware',
      '3. requestInfoMiddleware',
      '4. conditionalMiddleware',
      '5. Route Handler',
    ],
  })
})

// ===========================================
// Start Server
// ===========================================

const PORT = 3000
app.listen(PORT, () => {
  console.log(`✅ Basic Middleware server is running at http://localhost:${PORT}\n`)
  console.log('Test commands:')

  console.log(`\n  # 1. Basic routes (global middleware only)`)
  console.log(`  curl http://localhost:${PORT}/`)
  console.log(`  curl http://localhost:${PORT}/about`)

  console.log(`\n  # 2. API routes (global + path-specific middleware)`)
  console.log(`  curl http://localhost:${PORT}/api/users`)
  console.log(`  curl http://localhost:${PORT}/api/products`)

  console.log(`\n  # 3. Conditional middleware`)
  console.log(`  curl http://localhost:${PORT}/debug`)
  console.log(`  curl "http://localhost:${PORT}/debug?debug=true"`)

  console.log(`\n  # 4. Check middleware execution order`)
  console.log(`  curl http://localhost:${PORT}/order`)

  console.log(`\n📝 Check the console logs to observe how middleware executes!`)
})
