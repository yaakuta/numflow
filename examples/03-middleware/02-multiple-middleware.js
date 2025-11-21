/**
 * 02-multiple-middleware.js
 *
 * Example of using multiple middleware with chaining.
 * Learn practical patterns like authentication and authorization.
 *
 * Learning Objectives:
 * - Multiple middleware chaining
 * - Authentication middleware
 * - Authorization middleware
 * - Skipping routes with next('route')
 *
 * How to Run:
 * node examples/03-middleware/02-multiple-middleware.js
 *
 * Testing:
 * # Public endpoint
 * curl http://localhost:3000/api/public
 *
 * # Authentication required (no token - fail)
 * curl http://localhost:3000/api/protected
 *
 * # Authentication required (with token - success)
 * curl -H "Authorization: user-token" http://localhost:3000/api/protected
 *
 * # Admin permission required (user token - fail)
 * curl -H "Authorization: user-token" http://localhost:3000/api/admin
 *
 * # Admin permission required (admin token - success)
 * curl -H "Authorization: admin-token" http://localhost:3000/api/admin
 */

const numflow = require("numflow")

const app = numflow()

// ===========================================
// In-memory "database" (for simple example)
// ===========================================

const users = {
  'user-token': { id: 1, name: 'Alice', role: 'user' },
  'admin-token': { id: 2, name: 'Bob', role: 'admin' },
  'moderator-token': { id: 3, name: 'Charlie', role: 'moderator' },
}

// ===========================================
// 1. Logging Middleware
// ===========================================

function logger(req, res, next) {
  const timestamp = new Date().toISOString()
  console.log(`[${timestamp}] ${req.method} ${req.path}`)
  next()
}

// ===========================================
// 2. Authentication Middleware
// ===========================================

// Middleware that verifies who the user is
function authenticate(req, res, next) {
  // Read token from Authorization header
  const token = req.headers.authorization

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required. Please provide Authorization header.',
    })
  }

  // Lookup user by token
  const user = users[token]

  if (!user) {
    return res.status(401).json({
      success: false,
      error: 'Invalid token.',
    })
  }

  // Add user info to req.user (available to next middleware)
  req.user = user
  console.log(`✅ Authentication successful: ${user.name} (${user.role})`)

  next()
}

// ===========================================
// 3. Authorization Middleware
// ===========================================

// Admin permission check
function requireAdmin(req, res, next) {
  // req.user must exist (authenticate middleware must run first)
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required.',
    })
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Admin permission required.',
    })
  }

  console.log(`✅ Admin permission verified: ${req.user.name}`)
  next()
}

// Moderator or admin permission check
function requireModeratorOrAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required.',
    })
  }

  const allowedRoles = ['moderator', 'admin']
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      error: 'Moderator or admin permission required.',
    })
  }

  console.log(`✅ Permission verified: ${req.user.name} (${req.user.role})`)
  next()
}

// ===========================================
// 4. Request Validation Middleware
// ===========================================

// Body validation (POST request)
function validateCreateUser(req, res, next) {
  const { name, email } = req.body

  if (!name || !email) {
    return res.status(400).json({
      success: false,
      error: 'name and email are required.',
    })
  }

  // Email format validation (simple example)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      error: 'Please enter a valid email address.',
    })
  }

  console.log(`✅ Validation successful: name=${name}, email=${email}`)
  next()
}

// ===========================================
// Global Middleware Registration
// ===========================================

app.use(logger)

// ===========================================
// Routes
// ===========================================

// 1. Public endpoint (no middleware)
app.get('/api/public', (req, res) => {
  res.json({
    success: true,
    message: 'Public endpoint accessible to everyone.',
  })
})

// 2. Authentication required endpoint (authenticate middleware)
app.get('/api/protected', authenticate, (req, res) => {
  res.json({
    success: true,
    message: 'Accessible only to authenticated users.',
    user: req.user,
  })
})

// 3. Admin permission required (authenticate + requireAdmin chaining)
app.get('/api/admin', authenticate, requireAdmin, (req, res) => {
  res.json({
    success: true,
    message: 'Admin-only endpoint.',
    user: req.user,
  })
})

// 4. Moderator or admin permission required
app.get('/api/moderate', authenticate, requireModeratorOrAdmin, (req, res) => {
  res.json({
    success: true,
    message: 'Moderator/admin-only endpoint.',
    user: req.user,
  })
})

// 5. Multiple middleware + Body validation
app.post(
  '/api/users',
  authenticate, // 1. Check authentication
  requireAdmin, // 2. Check admin permission
  validateCreateUser, // 3. Validate body
  (req, res) => {
    // 4. Route handler
    const { name, email } = req.body

    res.status(201).json({
      success: true,
      message: 'User created.',
      data: { name, email },
      createdBy: req.user.name,
    })
  }
)

// ===========================================
// 6. Array-based Middleware Chaining
// ===========================================

// Define middleware array
const adminMiddlewares = [authenticate, requireAdmin]

app.delete('/api/users/:id', adminMiddlewares, (req, res) => {
  const userId = req.params.id

  res.json({
    success: true,
    message: `User ${userId} deleted.`,
    deletedBy: req.user.name,
  })
})

// ===========================================
// 7. Conditional Middleware Execution
// ===========================================

function optionalAuth(req, res, next) {
  const token = req.headers.authorization

  // Attempt authentication if token exists, continue regardless
  if (token) {
    const user = users[token]
    if (user) {
      req.user = user
      console.log(`✅ Optional authentication: ${user.name}`)
    }
  }

  next()
}

app.get('/api/optional', optionalAuth, (req, res) => {
  if (req.user) {
    res.json({
      success: true,
      message: 'Authenticated user.',
      user: req.user,
    })
  } else {
    res.json({
      success: true,
      message: 'Anonymous user.',
    })
  }
})

// ===========================================
// Start Server
// ===========================================

const PORT = 3000
app.listen(PORT, () => {
  console.log(
    `✅ Multiple Middleware server is running at http://localhost:${PORT}\n`
  )
  console.log('Available tokens:')
  console.log('  - user-token (Alice, user)')
  console.log('  - admin-token (Bob, admin)')
  console.log('  - moderator-token (Charlie, moderator)\n')

  console.log('Test commands:')

  console.log(`\n  # 1. Public endpoint`)
  console.log(`  curl http://localhost:${PORT}/api/public`)

  console.log(`\n  # 2. Authentication required (no token - fail)`)
  console.log(`  curl http://localhost:${PORT}/api/protected`)

  console.log(`\n  # 3. Authentication required (with token - success)`)
  console.log(`  curl -H "Authorization: user-token" http://localhost:${PORT}/api/protected`)

  console.log(`\n  # 4. Admin permission (user token - fail)`)
  console.log(`  curl -H "Authorization: user-token" http://localhost:${PORT}/api/admin`)

  console.log(`\n  # 5. Admin permission (admin token - success)`)
  console.log(
    `  curl -H "Authorization: admin-token" http://localhost:${PORT}/api/admin`
  )

  console.log(`\n  # 6. Moderator permission (moderator token - success)`)
  console.log(
    `  curl -H "Authorization: moderator-token" http://localhost:${PORT}/api/moderate`
  )

  console.log(`\n  # 7. Create user (admin token + body validation)`)
  console.log(`  curl -X POST http://localhost:${PORT}/api/users \\`)
  console.log(`    -H "Authorization: admin-token" \\`)
  console.log(`    -H "Content-Type: application/json" \\`)
  console.log(`    -d '{"name":"New User","email":"new@example.com"}'`)

  console.log(`\n  # 8. Optional authentication (no token)`)
  console.log(`  curl http://localhost:${PORT}/api/optional`)

  console.log(`\n  # 9. Optional authentication (with token)`)
  console.log(
    `  curl -H "Authorization: user-token" http://localhost:${PORT}/api/optional`
  )
})
