/**
 * 03-feature-middleware.js
 *
 * Example of integrating Features with middleware.
 * Learn how to apply middleware to Feature definitions.
 *
 * Learning Objectives:
 * - Applying middleware to Features
 * - Feature-level authentication/authorization checks
 * - Integrating Context with middleware
 *
 * How to Run:
 * node examples/03-middleware/03-feature-middleware.js
 *
 * Testing:
 * # Run Feature without middleware
 * curl -X POST http://localhost:3000/api/greet \
 *   -H "Content-Type: application/json" \
 *   -d '{"name":"World"}'
 *
 * # Run Feature with middleware (authentication required)
 * curl -X POST http://localhost:3000/api/protected-greet \
 *   -H "Content-Type: application/json" \
 *   -H "Authorization: user-token" \
 *   -d '{"name":"World"}'
 */

const numflow = require('../../dist/cjs/index.js')
const { feature } = numflow

const app = numflow()

// ===========================================
// In-memory database
// ===========================================

const users = {
  'user-token': { id: 1, name: 'Alice', role: 'user' },
  'admin-token': { id: 2, name: 'Bob', role: 'admin' },
}

// ===========================================
// Middleware Definitions
// ===========================================

// Logging middleware
function logger(req, res, next) {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`)
  next()
}

// Authentication middleware
function authenticate(req, res, next) {
  const token = req.headers.authorization

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required.',
    })
  }

  const user = users[token]
  if (!user) {
    return res.status(401).json({
      success: false,
      error: 'Invalid token.',
    })
  }

  req.user = user
  console.log(`✅ Authentication successful: ${user.name}`)
  next()
}

// Admin permission check
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Admin permission required.',
    })
  }

  console.log(`✅ Admin permission verified: ${req.user.name}`)
  next()
}

// ===========================================
// Global Middleware
// ===========================================

app.use(logger)

// ===========================================
// 1. Regular Feature without Middleware
// ===========================================

const greetFeature = feature({
  method: 'POST',
  path: '/api/greet',

  contextInitializer: (req, res) => ({
    name: req.body.name || 'Guest',
  }),

  steps: [
    async (ctx, req, res) => {
      return {
        greeting: `Hello, ${ctx.name}!`,
      }
    },
    async (ctx, req, res) => {
      return {
        timestamp: new Date().toISOString(),
      }
    },
  ],
})

app.use(greetFeature)

// ===========================================
// 2. Feature with Middleware (Authentication Required)
// ===========================================

const protectedGreetFeature = feature({
  method: 'POST',
  path: '/api/protected-greet',

  // Pass middleware array to Feature
  middleware: [authenticate],

  contextInitializer: (req, res) => ({
    name: req.body.name || 'Guest',
    // Can use req.user added by middleware!
    user: req.user,
  }),

  steps: [
    async (ctx, req, res) => {
      return {
        greeting: `Hello, ${ctx.name}! (Authenticated as ${ctx.user.name})`,
      }
    },
    async (ctx, req, res) => {
      return {
        userRole: ctx.user.role,
        timestamp: new Date().toISOString(),
      }
    },
  ],
})

app.use(protectedGreetFeature)

// ===========================================
// 3. Feature with Multiple Middleware (Admin Only)
// ===========================================

const adminOnlyFeature = feature({
  method: 'POST',
  path: '/api/admin-action',

  // Chain multiple middleware
  middleware: [authenticate, requireAdmin],

  contextInitializer: (req, res) => ({
    action: req.body.action,
    user: req.user,
  }),

  steps: [
    async (ctx, req, res) => {
      console.log(`🔧 Admin action: ${ctx.action} by ${ctx.user.name}`)
      return {
        actionPerformed: ctx.action,
        performedBy: ctx.user.name,
      }
    },
    async (ctx, req, res) => {
      return {
        success: true,
        timestamp: new Date().toISOString(),
      }
    },
  ],
})

app.use(adminOnlyFeature)

// ===========================================
// 4. Feature with Internal Validation Logic (Handled in Steps)
// ===========================================

const validatedFeature = feature({
  method: 'POST',
  path: '/api/validated',

  middleware: [authenticate],

  contextInitializer: (req, res) => ({
    email: req.body.email,
    age: req.body.age,
    user: req.user,
  }),

  steps: [
    // Step 1: Email validation
    async (ctx, req, res) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!ctx.email || !emailRegex.test(ctx.email)) {
        throw new Error('Please enter a valid email address.')
      }
      return { emailValidated: true }
    },
    // Step 2: Age validation
    async (ctx, req, res) => {
      if (!ctx.age || ctx.age < 18) {
        throw new Error('Only users 18 years or older can register.')
      }
      return { ageValidated: true }
    },
    // Step 3: Final processing
    async (ctx, req, res) => {
      return {
        message: 'All validations passed.',
        email: ctx.email,
        age: ctx.age,
      }
    },
  ],
})

app.use(validatedFeature)

// ===========================================
// 5. Mixing Regular Routes and Features
// ===========================================

// Regular route (Express style)
app.get('/api/normal', authenticate, (req, res) => {
  res.json({
    success: true,
    message: 'Regular route (with middleware)',
    user: req.user,
  })
})

// Feature route (Numflow style)
const hybridFeature = feature({
  method: 'GET',
  path: '/api/feature',

  middleware: [authenticate],

  contextInitializer: (req, res) => ({
    user: req.user,
  }),

  steps: [
    async (ctx, req, res) => {
      return {
        message: 'Feature route (with middleware)',
        user: ctx.user,
      }
    },
  ],
})

app.use(hybridFeature)

// ===========================================
// Start Server
// ===========================================

const PORT = 3000
app.listen(PORT, () => {
  console.log(
    `✅ Feature Middleware server is running at http://localhost:${PORT}\n`
  )
  console.log('Available tokens:')
  console.log('  - user-token (Alice, user)')
  console.log('  - admin-token (Bob, admin)\n')

  console.log('Test commands:')

  console.log(`\n  # 1. Feature without middleware`)
  console.log(`  curl -X POST http://localhost:${PORT}/api/greet \\`)
  console.log(`    -H "Content-Type: application/json" \\`)
  console.log(`    -d '{"name":"World"}'`)

  console.log(`\n  # 2. Feature with authentication middleware (no token - fail)`)
  console.log(`  curl -X POST http://localhost:${PORT}/api/protected-greet \\`)
  console.log(`    -H "Content-Type: application/json" \\`)
  console.log(`    -d '{"name":"World"}'`)

  console.log(`\n  # 3. Feature with authentication middleware (with token - success)`)
  console.log(`  curl -X POST http://localhost:${PORT}/api/protected-greet \\`)
  console.log(`    -H "Content-Type: application/json" \\`)
  console.log(`    -H "Authorization: user-token" \\`)
  console.log(`    -d '{"name":"World"}'`)

  console.log(`\n  # 4. Admin-only Feature (user token - fail)`)
  console.log(`  curl -X POST http://localhost:${PORT}/api/admin-action \\`)
  console.log(`    -H "Content-Type: application/json" \\`)
  console.log(`    -H "Authorization: user-token" \\`)
  console.log(`    -d '{"action":"delete-all-users"}'`)

  console.log(`\n  # 5. Admin-only Feature (admin token - success)`)
  console.log(`  curl -X POST http://localhost:${PORT}/api/admin-action \\`)
  console.log(`    -H "Content-Type: application/json" \\`)
  console.log(`    -H "Authorization: admin-token" \\`)
  console.log(`    -d '{"action":"delete-all-users"}'`)

  console.log(`\n  # 6. Feature with validation logic (validation fail)`)
  console.log(`  curl -X POST http://localhost:${PORT}/api/validated \\`)
  console.log(`    -H "Content-Type: application/json" \\`)
  console.log(`    -H "Authorization: user-token" \\`)
  console.log(`    -d '{"email":"invalid","age":15}'`)

  console.log(`\n  # 7. Feature with validation logic (validation success)`)
  console.log(`  curl -X POST http://localhost:${PORT}/api/validated \\`)
  console.log(`    -H "Content-Type: application/json" \\`)
  console.log(`    -H "Authorization: user-token" \\`)
  console.log(`    -d '{"email":"user@example.com","age":25}'`)

  console.log(`\n  # 8. Compare regular route vs Feature`)
  console.log(`  curl -H "Authorization: user-token" http://localhost:${PORT}/api/normal`)
  console.log(
    `  curl -H "Authorization: user-token" http://localhost:${PORT}/api/feature`
  )
})
