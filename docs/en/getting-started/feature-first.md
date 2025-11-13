# Feature-First Auto-Orchestration

> The killer feature that makes Numflow unique

**Feature-First Auto-Orchestration** is Numflow's core differentiator. It automatically discovers, executes, and handles errors for complex business logic organized into numbered steps.

**"Num" + "flow" = Numeric Flow Control** - Use numbers to control your application's flow explicitly and maintainably.

---

## 📋 Table of Contents

- [What is Feature-First?](#what-is-feature-first)
- [Why Feature-First?](#why-feature-first)
- [Quick Start](#quick-start)
- [Implicit vs Explicit Features](#implicit-vs-explicit-features)
- [Convention over Configuration](#convention-over-configuration)
- [Step Functions](#step-functions)
- [Context Management](#context-management)
- [Error Handling](#error-handling)
- [Async Tasks](#async-tasks)
- [Real-World Example](#real-world-example)
- [Best Practices](#best-practices)
- [FAQ](#faq)

---

## What is Feature-First?

**Feature-First Auto-Orchestration** automates complex business logic through four key mechanisms:

### 1. Auto-Discovery 🔍

Automatically scans and sorts step files by their numeric prefix:

```
features/api/orders/@post/steps/
├── 100-validate.js      ← Discovered
├── 200-check-stock.js   ← Discovered
├── 300-create-order.js  ← Discovered
└── 400-update-stock.js  ← Discovered
```

### 2. Auto-Execution ⚡

Executes steps in numeric order automatically:

```
100 → 200 → 300 → 400  (sequential execution)
```

### 3. Auto-Error Handling 🛡️

Catches errors and calls your custom `onError` handler:

```
100 → 200 → 300 (error)
               ↓
           onError called
```

### 4. Context Sharing 🔄

All steps share the same context object for data passing:

```javascript
// 100-validate.js
ctx.userId = 123

// 200-check-stock.js
console.log(ctx.userId)  // 123
```

---

## Why Feature-First?

### The Traditional Approach (Express)

```javascript
// ❌ All logic in one place - hard to maintain
app.post('/api/orders', async (req, res) => {
  // 1. Validation
  if (!req.body.productId) {
    return res.status(400).json({ error: 'Missing productId' })
  }

  // 2. Check stock
  const stock = await checkStock(req.body.productId)
  if (stock < req.body.quantity) {
    return res.status(400).json({ error: 'Out of stock' })
  }

  // 3. Begin transaction
  const tx = await db.beginTransaction()

  try {
    // 4. Create order
    const order = await createOrder(req.body, tx)

    // 5. Update stock
    await updateStock(req.body.productId, req.body.quantity, tx)

    // 6. Commit transaction
    await tx.commit()

    // 7. Send notification (async)
    sendNotification(order).catch(console.error)

    res.json({ success: true, order })
  } catch (error) {
    await tx.rollback()
    res.status(500).json({ error: error.message })
  }
})
```

**Problems:**
- ❌ 100+ lines of complex code
- ❌ Manual transaction management
- ❌ Complicated error handling
- ❌ Not reusable
- ❌ Hard to test
- ❌ Difficult to maintain

### The Feature-First Approach

**app.js (Just one line!)**:

```javascript
const numflow = require('numflow')
const app = numflow()

// Register all features automatically!
app.registerFeatures('./features')

app.listen(3000, () => {
  console.log('Server running on port 3000')
})
```

**Folder Structure (Convention over Configuration)**:

```
features/
└── api/
    └── orders/
        └── @post/                    # POST /api/orders
            ├── index.js             # Feature configuration
            ├── steps/               # Auto-executed steps
            │   ├── 100-validate.js
            │   ├── 200-check-stock.js
            │   ├── 300-create-order.js
            │   └── 400-update-stock.js
            └── async-tasks/         # Background tasks
                └── send-notification.js
```

**Feature Configuration (features/api/orders/@post/index.js)**:

```javascript
const numflow = require('numflow')

module.exports = numflow.feature({
  // method: 'POST'             ← Auto-inferred from 'post' folder!
  // path: '/api/orders'        ← Auto-inferred from folder structure!
  // steps: './steps'           ← Auto-discovered!
  // asyncTasks: './async-tasks' ← Auto-discovered!

  // Only add custom configuration if needed
  onError: async (error, context, req, res) => {
    // Custom error handling (e.g., rollback transaction)
    if (context.dbClient) {
      await context.dbClient.query('ROLLBACK')
    }
    res.statusCode = 500
    res.end(JSON.stringify({ error: error.message }))
  },
})
```

**Step Files (Auto-discovered and executed)**:

```javascript
// steps/100-validate.js
module.exports = async (ctx, req, res) => {
  if (!req.body.productId) {
    throw new Error('Missing productId')
  }
  // That's it! Auto-proceeds to next step
}

// steps/200-check-stock.js
module.exports = async (ctx, req, res) => {
  const stock = await checkStock(req.body.productId)
  if (stock < req.body.quantity) {
    throw new Error('Out of stock')
  }
  ctx.stock = stock  // Save to context
  // Auto-proceeds to next step
}

// steps/300-create-order.js
module.exports = async (ctx, req, res) => {
  const order = await createOrder(req.body)
  ctx.order = order  // Save to context
  // Auto-proceeds to next step
}

// steps/400-update-stock.js
module.exports = async (ctx, req, res) => {
  await updateStock(req.body.productId, req.body.quantity)
  // Done! Auto-completes
}

// async-tasks/send-notification.js (runs after steps complete)
module.exports = async (ctx) => {
  await sendNotification(ctx.order)
}
```

**Benefits:**
- ✅ **One line** (`app.registerFeatures`) registers all features
- ✅ Folder structure = API structure (intuitive)
- ✅ No need to edit app.js when adding features (Zero Edit)
- ✅ Each step is independent and reusable
- ✅ Errors are auto-caught and sent to `onError`
- ✅ Convention over Configuration (minimal setup)
- ✅ Easy to test
- ✅ Maximum readability and maintainability

---

## Quick Start

**Get started with Feature-First in 5 minutes!**

### Step 1: Create Project Structure

```
my-app/
├── features/
│   └── api/
│       └── orders/
│           └── @post/                # POST /api/orders
│               ├── index.js         # Feature config
│               └── steps/           # Step files
│                   ├── 100-validate.js
│                   ├── 200-check-stock.js
│                   ├── 300-create-order.js
│                   └── 400-update-stock.js
└── app.js
```

### Step 2: Create Feature Configuration

**features/api/orders/@post/index.js**:

```javascript
const numflow = require('numflow')

module.exports = numflow.feature({
  // Everything is auto-inferred!
  // No configuration needed unless you want custom behavior
})
```

### Step 3: Create Step Files

**features/api/orders/@post/steps/100-validate.js**:

```javascript
module.exports = async (ctx, req, res) => {
  if (!req.body.productId || !req.body.quantity) {
    throw new Error('Missing required fields')
  }
}
```

**features/api/orders/@post/steps/200-check-stock.js**:

```javascript
const checkStock = require('../../../../services/inventory')

module.exports = async (ctx, req, res) => {
  const stock = await checkStock(req.body.productId)
  if (stock < req.body.quantity) {
    throw new Error('Insufficient stock')
  }
  ctx.stock = stock
}
```

**features/api/orders/@post/steps/300-create-order.js**:

```javascript
const createOrder = require('../../../../services/orders')

module.exports = async (ctx, req, res) => {
  const order = await createOrder({
    productId: req.body.productId,
    quantity: req.body.quantity,
  })
  ctx.order = order

  // Send response
  res.status(201).json({ order })
}
```

### Step 4: Register Features in App

**app.js**:

```javascript
const numflow = require('numflow')
const app = numflow()

// One line to register all features!
app.registerFeatures('./features')

app.listen(3000, () => {
  console.log('Server running on port 3000')
})
```

**Multiple Directories (Optional):**

You can register features from multiple directories:

```javascript
const numflow = require('numflow')
const app = numflow()

// Register multiple directories
app.registerFeatures('./features')         // Main features
app.registerFeatures('./admin-features')   // Admin features

app.listen(3000)
```

⚠️ **Warning:** If the same `method:path` exists in multiple directories, the program will terminate immediately (Fail-Fast). See [Feature API - Multiple Directories](../api/feature.md#multiple-features-directories) for details.

### Step 5: Test It!

```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{"productId": "123", "quantity": 2}'
```

**Response:**
```json
{
  "order": {
    "id": "order_456",
    "productId": "123",
    "quantity": 2,
    "status": "created"
  }
}
```

---

## Implicit vs Explicit Features

Numflow supports two ways to define Features:

### Implicit Feature ⭐ Recommended

No index.js required! Just create `@method` folder with `steps/`:

```
features/todos/
└── @get/                    # GET /todos
    └── steps/               # ← No index.js!
        └── 100-list.js
```

Everything is auto-inferred from folder structure.

### Explicit Feature

Add index.js for custom configuration:

```
features/api/orders/
└── @post/                   # POST /api/orders
    ├── index.js             # ← Custom config
    └── steps/
        └── 100-create.js
```

Use explicit features when you need:
- contextInitializer
- Custom onError handler
- Feature-specific middlewares

See [API Reference](../api/feature.md#implicit-vs-explicit-features) for details.

---

## Convention over Configuration

Numflow follows **Convention over Configuration** - folder structure defines your API.

### Folder Naming Rules

#### HTTP Methods

Folder names automatically map to HTTP methods:

```
features/
├── api/
│   └── users/
│       ├── get/       # GET /api/users
│       ├── post/      # POST /api/users
│       ├── put/       # PUT /api/users
│       ├── patch/     # PATCH /api/users
│       └── @delete/    # DELETE /api/users
```

#### Dynamic Parameters

Use `[param]` for dynamic route parameters (converted to `:param`):

```
features/
└── api/
    └── users/
        └── [id]/           # :id parameter
            ├── get/        # GET /api/users/:id
            ├── put/        # PUT /api/users/:id
            └── @delete/     # DELETE /api/users/:id
```

**Result**: Routes like `/api/users/123`, `/api/users/456`

#### Nested Resources

Create nested routes naturally:

```
features/
└── api/
    └── users/
        └── [userId]/
            └── posts/
                ├── get/            # GET /api/users/:userId/posts
                ├── post/           # POST /api/users/:userId/posts
                └── [postId]/
                    ├── get/        # GET /api/users/:userId/posts/:postId
                    ├── put/        # PUT /api/users/:userId/posts/:postId
                    └── @delete/     # DELETE /api/users/:userId/posts/:postId
```

### Auto-Discovery

Two directories are automatically discovered if they exist:

#### 1. `steps/` Directory

All `.js` files in the `steps/` folder are automatically discovered and executed in numeric order:

```
steps/
├── 100-validate.js    ← Executed first
├── 200-process.js     ← Executed second
├── 300-complete.js    ← Executed third
└── 999-cleanup.js     ← Executed last
```

**Size-based sorting**: `100 < 200 < 300 < 1000 < 10000`

#### 2. `async-tasks/` Directory

All `.js` files in the `async-tasks/` folder run asynchronously **after** all steps complete:

```
async-tasks/
├── send-email.js         ← Runs async
├── update-analytics.js   ← Runs async
└── notify-webhook.js     ← Runs async
```

**Order doesn't matter** - all async tasks run in parallel after response is sent.

---

## Step Functions

### Function Signature

Each step exports an `async` function with three parameters:

```javascript
module.exports = async (ctx, req, res) => {
  // ctx: Shared context object
  // req: Standard Node.js request object
  // res: Standard Node.js response object
}
```

### Return Values

Steps can return values that are automatically merged into `ctx.results`:

```javascript
// steps/100-validate.js
module.exports = async (ctx, req, res) => {
  return {
    isValid: true,
    validatedData: { /* ... */ }
  }
}

// steps/200-process.js
module.exports = async (ctx, req, res) => {
  // Access previous step's return value
  console.log(ctx.results.isValid)  // true
  console.log(ctx.results.validatedData)
}
```

### Sending Response

Any step can send the response. Subsequent steps still run, but cannot modify the response:

```javascript
// steps/300-send-response.js
module.exports = async (ctx, req, res) => {
  res.status(200).json({ success: true, data: ctx.results })
  // Response sent! But next steps still run
}

// steps/400-cleanup.js
module.exports = async (ctx, req, res) => {
  // This still runs for cleanup
  await cleanupTempFiles()
  // But cannot modify response (already sent)
}
```

### Early Exit

Throw an error to stop execution and trigger `onError`:

```javascript
module.exports = async (ctx, req, res) => {
  if (!ctx.user.isAdmin) {
    throw new Error('Unauthorized')  // Stops here, calls onError
  }
  // This won't run if error is thrown
}
```

---

## Context Management

### What is Context?

The **context** (`ctx`) is a shared object passed to all steps. Use it to share data between steps.

### Default Context

Numflow automatically provides:

```javascript
{
  req,      // HTTP request object
  res,      // HTTP response object
  results: {}  // Merged return values from steps
}
```

### Custom Context Initialization

Provide a `contextInitializer` function to add custom properties:

```javascript
const numflow = require('numflow')

module.exports = numflow.feature({
  contextInitializer: async (ctx, req, res) => {
    // Add database client
    ctx.db = await getDatabaseClient()

    // Add authenticated user
    ctx.user = await getUserFromToken(req.headers.authorization)

    // Add logger
    ctx.logger = createLogger(req.id)
  },

  onError: async (error, ctx, req, res) => {
    // Clean up resources
    if (ctx.db) {
      await ctx.db.close()
    }
  }
})
```

Now all steps can access `ctx.db`, `ctx.user`, and `ctx.logger`.

### Context Best Practices

**✅ DO:**
- Use context for data that flows between steps
- Initialize expensive resources in `contextInitializer`
- Clean up resources in `onError`

**❌ DON'T:**
- Store large objects in context (memory leak risk)
- Mutate `req` or `res` directly (use context instead)
- Use context for temporary data (use local variables)

---

## Error Handling

### Automatic Error Catching

All errors thrown in steps are automatically caught:

```javascript
// steps/100-validate.js
module.exports = async (ctx, req, res) => {
  if (!req.body.email) {
    throw new Error('Email required')  // Auto-caught!
  }
}
```

### Custom Error Handler

Define an `onError` handler to customize error responses:

```javascript
const numflow = require('numflow')

module.exports = numflow.feature({
  onError: async (error, ctx, req, res) => {
    // Log error
    console.error('Feature error:', error.message)

    // Rollback transaction if needed
    if (ctx.transaction) {
      await ctx.transaction.rollback()
    }

    // Send error response
    const statusCode = error.statusCode || 500
    res.status(statusCode).json({
      error: {
        message: error.message,
        code: error.code || 'INTERNAL_ERROR'
      }
    })
  }
})
```

### Error Handling Patterns

#### Pattern 1: Transaction Rollback

```javascript
module.exports = numflow.feature({
  contextInitializer: async (ctx) => {
    ctx.transaction = await db.beginTransaction()
  },

  onError: async (error, ctx, req, res) => {
    if (ctx.transaction) {
      await ctx.transaction.rollback()
    }
    res.status(500).json({ error: error.message })
  }
})
```

#### Pattern 2: Cleanup Resources

```javascript
module.exports = numflow.feature({
  contextInitializer: async (ctx) => {
    ctx.tempFile = await createTempFile()
  },

  onError: async (error, ctx, req, res) => {
    // Always cleanup
    if (ctx.tempFile) {
      await deleteTempFile(ctx.tempFile)
    }
    res.status(500).json({ error: error.message })
  }
})
```

#### Pattern 3: Custom Error Codes

```javascript
class ValidationError extends Error {
  constructor(message) {
    super(message)
    this.statusCode = 400
    this.code = 'VALIDATION_ERROR'
  }
}

// In step:
module.exports = async (ctx, req, res) => {
  if (!req.body.email) {
    throw new ValidationError('Email required')
  }
}

// In onError:
module.exports = numflow.feature({
  onError: async (error, ctx, req, res) => {
    const statusCode = error.statusCode || 500
    const code = error.code || 'INTERNAL_ERROR'

    res.status(statusCode).json({
      error: {
        code,
        message: error.message
      }
    })
  }
})
```

---

## Async Tasks

### What are Async Tasks?

**Async tasks** are background operations that run **after** the response is sent to the client. They're perfect for:

- Sending emails
- Updating analytics
- Triggering webhooks
- Logging events
- Cache invalidation

### Creating Async Tasks

Create a file in the `async-tasks/` folder:

**async-tasks/send-email.js**:

```javascript
module.exports = async (ctx) => {
  // Note: Only receives ctx parameter (no req, res)
  await sendEmail({
    to: ctx.user.email,
    subject: 'Order Confirmation',
    body: `Your order #${ctx.order.id} has been placed.`
  })
}
```

### Execution Flow

```
HTTP Request
  ↓
Steps: 100 → 200 → 300
  ↓
Response Sent (200 OK)
  ↓
Async Tasks: send-email, update-analytics (parallel)
  ↓
Done
```

**Key points:**
- Async tasks run **after** response is sent
- They run in **parallel** (order doesn't matter)
- Errors in async tasks are logged but don't affect the response
- They only receive `ctx` (no `req`, `res`)

### Real-World Example

**Feature: Order Creation**

```
features/api/orders/@post/
├── index.js
├── steps/
│   ├── 100-validate.js       # Validate input
│   ├── 200-check-inventory.js # Check stock
│   ├── 300-create-order.js    # Create order in DB
│   └── 400-send-response.js   # Send 201 response
└── async-tasks/
    ├── send-confirmation-email.js  # Email customer
    ├── update-analytics.js         # Update dashboard
    ├── notify-warehouse.js         # Alert warehouse
    └── trigger-webhook.js          # Call external API
```

**Flow:**
1. Steps 100-400 execute (order created, response sent)
2. Client receives response immediately
3. Async tasks run in background (no impact on response time)

---

## Real-World Example

Let's build a complete **user registration** feature with validation, database operations, and email confirmation.

### Project Structure

```
features/
└── api/
    └── users/
        └── @post/                    # POST /api/users
            ├── index.js
            ├── steps/
            │   ├── 100-validate.js
            │   ├── 200-check-duplicate.js
            │   ├── 300-hash-password.js
            │   ├── 400-create-user.js
            │   └── 500-send-response.js
            └── async-tasks/
                └── send-welcome-email.js
```

### Implementation

**features/api/users/@post/index.js**:

```javascript
const numflow = require('numflow')

module.exports = numflow.feature({
  contextInitializer: async (ctx, req, res) => {
    // Initialize database client
    ctx.db = await getDatabase()
  },

  onError: async (error, ctx, req, res) => {
    // Close database connection
    if (ctx.db) {
      await ctx.db.close()
    }

    // Send error response
    res.status(error.statusCode || 500).json({
      error: error.message
    })
  }
})
```

**steps/100-validate.js**:

```javascript
module.exports = async (ctx, req, res) => {
  const { email, password, name } = req.body

  // Validate required fields
  if (!email || !password || !name) {
    const error = new Error('Missing required fields: email, password, name')
    error.statusCode = 400
    throw error
  }

  // Validate email format
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    const error = new Error('Invalid email format')
    error.statusCode = 400
    throw error
  }

  // Validate password strength
  if (password.length < 8) {
    const error = new Error('Password must be at least 8 characters')
    error.statusCode = 400
    throw error
  }

  // Store validated data in context
  ctx.userData = { email, password, name }
}
```

**steps/200-check-duplicate.js**:

```javascript
module.exports = async (ctx, req, res) => {
  // Check if email already exists
  const existing = await ctx.db.query(
    'SELECT id FROM users WHERE email = $1',
    [ctx.userData.email]
  )

  if (existing.rows.length > 0) {
    const error = new Error('Email already registered')
    error.statusCode = 409
    throw error
  }
}
```

**steps/300-hash-password.js**:

```javascript
const bcrypt = require('bcrypt')

module.exports = async (ctx, req, res) => {
  const hashedPassword = await bcrypt.hash(ctx.userData.password, 10)
  ctx.userData.password = hashedPassword
}
```

**steps/400-create-user.js**:

```javascript
module.exports = async (ctx, req, res) => {
  const { email, password, name } = ctx.userData

  const result = await ctx.db.query(
    'INSERT INTO users (email, password, name, created_at) VALUES ($1, $2, $3, NOW()) RETURNING id, email, name, created_at',
    [email, password, name]
  )

  ctx.user = result.rows[0]
}
```

**steps/500-send-response.js**:

```javascript
module.exports = async (ctx, req, res) => {
  // Close database connection
  await ctx.db.close()

  // Send success response
  res.status(201).json({
    success: true,
    user: {
      id: ctx.user.id,
      email: ctx.user.email,
      name: ctx.user.name,
      createdAt: ctx.user.created_at
    }
  })
}
```

**async-tasks/send-welcome-email.js**:

```javascript
module.exports = async (ctx) => {
  // Send welcome email (async, doesn't block response)
  await sendEmail({
    to: ctx.user.email,
    subject: 'Welcome to our platform!',
    template: 'welcome',
    data: {
      name: ctx.user.name,
      email: ctx.user.email
    }
  })

  console.log(`Welcome email sent to ${ctx.user.email}`)
}
```

### Testing

```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@example.com",
    "password": "securepass123",
    "name": "Alice Smith"
  }'
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user_123",
    "email": "alice@example.com",
    "name": "Alice Smith",
    "createdAt": "2025-10-20T10:30:00Z"
  }
}
```

**What happens:**
1. Validates input (100)
2. Checks for duplicate email (200)
3. Hashes password (300)
4. Creates user in database (400)
5. Sends response immediately (500)
6. **After response:** Sends welcome email asynchronously

---

## Best Practices

### 1. Keep Steps Small and Focused

Each step should do **one thing** well:

**✅ Good:**
```javascript
// steps/100-validate-email.js
module.exports = async (ctx, req, res) => {
  if (!req.body.email) {
    throw new Error('Email required')
  }
}

// steps/200-validate-password.js
module.exports = async (ctx, req, res) => {
  if (!req.body.password || req.body.password.length < 8) {
    throw new Error('Password must be at least 8 characters')
  }
}
```

**❌ Bad:**
```javascript
// steps/100-validate-everything.js
module.exports = async (ctx, req, res) => {
  // Too many responsibilities in one step
  if (!req.body.email) throw new Error('Email required')
  if (!req.body.password) throw new Error('Password required')
  if (!req.body.name) throw new Error('Name required')
  if (req.body.password.length < 8) throw new Error('Password too short')
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(req.body.email)) throw new Error('Invalid email')
  // ... too much!
}
```

### 2. Use Meaningful Step Numbers

Use step numbers to convey execution order:

```
100-199: Validation
200-299: Authorization
300-399: Business Logic
400-499: Database Operations
500-599: Response Sending
600-699: Cleanup
```

**Example:**
```
steps/
├── 100-validate-input.js
├── 150-sanitize-input.js
├── 200-check-auth.js
├── 250-check-permissions.js
├── 300-business-logic.js
├── 400-save-to-db.js
└── 500-send-response.js
```

### 3. Use Context for Shared Data

Always use context (`ctx`) to share data between steps:

**✅ Good:**
```javascript
// 100-fetch-user.js
module.exports = async (ctx, req, res) => {
  ctx.user = await fetchUser(req.params.id)
}

// 200-check-permissions.js
module.exports = async (ctx, req, res) => {
  if (!ctx.user.isAdmin) {
    throw new Error('Unauthorized')
  }
}
```

**❌ Bad:**
```javascript
// Don't use global variables!
let currentUser = null  // ❌ Global variable

module.exports = async (ctx, req, res) => {
  currentUser = await fetchUser(req.params.id)
}
```

### 4. Initialize Resources in contextInitializer

Use `contextInitializer` for expensive setup:

```javascript
module.exports = numflow.feature({
  contextInitializer: async (ctx, req, res) => {
    // Initialize once per request
    ctx.db = await getDatabaseConnection()
    ctx.redis = await getRedisClient()
    ctx.logger = createLogger(req.id)
  },

  onError: async (error, ctx, req, res) => {
    // Cleanup resources
    if (ctx.db) await ctx.db.close()
    if (ctx.redis) await ctx.redis.disconnect()
  }
})
```

### 5. Use Async Tasks for Background Work

Don't block the response with slow operations:

**✅ Good:**
```javascript
// steps/300-create-order.js
module.exports = async (ctx, req, res) => {
  ctx.order = await createOrder(req.body)
  res.status(201).json({ order: ctx.order })
}

// async-tasks/send-email.js (runs after response)
module.exports = async (ctx) => {
  await sendOrderConfirmationEmail(ctx.order)
}
```

**❌ Bad:**
```javascript
// steps/300-create-order.js
module.exports = async (ctx, req, res) => {
  ctx.order = await createOrder(req.body)

  // ❌ Blocks response!
  await sendOrderConfirmationEmail(ctx.order)  // Slow!

  res.status(201).json({ order: ctx.order })
}
```

### 6. Handle Errors Gracefully

Always implement `onError` for cleanup and proper error responses:

```javascript
module.exports = numflow.feature({
  onError: async (error, ctx, req, res) => {
    // 1. Log error
    console.error('Feature error:', {
      message: error.message,
      stack: error.stack,
      path: req.path,
      method: req.method
    })

    // 2. Cleanup resources
    if (ctx.transaction) {
      await ctx.transaction.rollback()
    }
    if (ctx.db) {
      await ctx.db.close()
    }

    // 3. Send appropriate response
    const statusCode = error.statusCode || 500
    res.status(statusCode).json({
      error: {
        message: error.message,
        ...(process.env.NODE_ENV === 'development' && {
          stack: error.stack
        })
      }
    })
  }
})
```

---

## FAQ

### Q: Can I use Feature-First with traditional routes?

**A:** Yes! Mix and match:

```javascript
const numflow = require('numflow')
const app = numflow()

// Traditional routes
app.get('/health', (req, res) => {
  res.json({ status: 'ok' })
})

// Feature-First routes
app.registerFeatures('./features')

app.listen(3000)
```

### Q: How do I debug Feature-First?

**A:** Use debug mode:

```bash
FEATURE_DEBUG=true node app.js
```

This will log:
- Which steps are discovered
- Execution time for each step
- Context data flow
- Errors with full stack traces

### Q: Can I reuse steps across features?

**A:** Yes! Extract common steps to a shared folder:

```javascript
// features/api/orders/@post/steps/100-validate.js
const validateOrder = require('../../../../shared/validators/order')

module.exports = async (ctx, req, res) => {
  await validateOrder(req.body)
}
```

### Q: What happens if no response is sent in steps?

**A:** Numflow automatically sends a 404 response:

```javascript
// No step sends response
// Result: 404 Not Found (auto-generated)
```

### Q: Can async tasks fail?

**A:** Yes, but failures are logged and don't affect the response (already sent). Monitor async task errors in logs.

### Q: How do I test individual steps?

**A:** Steps are just functions! Test them directly:

```javascript
const step = require('./features/api/orders/@post/steps/100-validate')

test('validates order input', async () => {
  const ctx = {}
  const req = { body: { productId: '123' } }
  const res = {}

  await expect(step(ctx, req, res)).resolves.not.toThrow()
})
```

---

## What's Next?

- **[Context Management](../ko/getting-started/feature-context.md)** - Deep dive into context
- **[Async Tasks](../ko/getting-started/feature-async-tasks.md)** - Advanced async patterns
- **[Error Handling](../ko/getting-started/error-handling.md)** - Error handling strategies
- **[Feature API Reference](../ko/api/feature.md)** - Complete API documentation

---

## Need Help?

- 📖 **Examples**: Check `/examples` directory
- 🐛 **Issues**: [GitHub Issues](https://github.com/gazerkr/numflow/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/gazerkr/numflow/discussions)

---

**Happy coding with Feature-First!** 🚀

*Last updated: 2025-10-20*
