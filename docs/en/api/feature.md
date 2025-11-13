# Feature API Reference

> Auto-orchestrate complex business logic with Convention over Configuration

Feature-First Auto-Orchestration is Numflow's **killer feature** that automatically executes complex business logic based on folder structure and numbered files.

---

## Table of Contents

- [Quick Start](#quick-start)
- [Implicit vs Explicit Features](#implicit-vs-explicit-features)
- [Convention Rules](#convention-rules)
- [Writing Steps](#writing-steps)
- [Context Object](#context-object)
- [Async Tasks](#async-tasks)
- [Registration Methods](#registration-methods)
- [Advanced Configuration](#advanced-configuration)
- [Error Handling & Retry](#error-handling--retry)
- [Debug Mode](#debug-mode)
- [Complete Examples](#complete-examples)

---

## Quick Start

### 1. Create Folder Structure (Without index.js!)

```
features/
└── api/
    └── v1/
        └── orders/
            └── @post/                   # POST /api/v1/orders
                └── steps/              # ← No index.js! Auto-discovered!
                    ├── 100-validate.js
                    ├── 200-create.js
                    └── 300-notify.js
```

**Implicit Feature**: Just `@method` folder + `steps/` folder automatically creates a Feature!

### 2. Write Steps

```javascript
// features/api/v1/orders/@post/steps/100-validate.js
async function validate(ctx, req, res) {
  if (!req.body.items || req.body.items.length === 0) {
    throw new Error('Order must have items')
  }

  // Store result in context
  ctx.validation = { isValid: true }
}
module.exports = validate

// features/api/v1/orders/@post/steps/200-create.js
async function create(ctx, req, res) {
  const order = await db.orders.create(req.body)
  ctx.order = order
}
module.exports = create
```

### 3. Auto-Register in App

```javascript
// app.js
const numflow = require('numflow')
const app = numflow()

// Register all features! 🎉
app.registerFeatures('./features')

// app.listen() automatically waits for feature registration to complete
app.listen(3000, () => {
  console.log('Server running on port 3000')
})
```

**That's it!** 🎉 Even hundreds of APIs can be auto-registered just by creating folders.

---

## Implicit vs Explicit Features

Numflow supports two ways to define Features.

### Implicit Feature ⭐ Recommended

Define a Feature **without index.js**, using only `@method` folder and `steps/` folder.

```
features/todos/
└── @get/                    # GET /todos
    └── steps/               # ← No index.js!
        ├── 100-list.js
        └── 200-response.js
```

**Auto-inferred**:
- HTTP Method: `@get` → GET
- API Path: `/todos`
- Steps: `./steps` directory
- Async Tasks: `./async-tasks` directory (if exists)

**Use cases**:
- Simple CRUD APIs
- No special configuration needed
- No contextInitializer, onError, etc. required

### Explicit Feature

Provide additional configuration with **index.js** file.

```
features/api/orders/
└── @post/                   # POST /api/orders
    ├── index.js             # ← Additional configuration
    └── steps/
        └── 100-create.js
```

```javascript
// features/api/orders/@post/index.js
const numflow = require('numflow')

module.exports = numflow.feature({
  // Convention still auto-inferred!
  // method: 'POST' ← Inferred from '@post'
  // path: '/api/orders' ← Inferred from folder structure
  // steps: './steps' ← Auto-discovered

  // Add only what you need
  contextInitializer: (ctx, req, res) => {
    ctx.userId = req.user?.id
  },

  onError: async (error, ctx, req, res) => {
    // Custom error handling
  }
})
```

**Use cases**:
- Need contextInitializer
- Need custom onError handler
- Need Feature-specific middlewares

---

## Convention Rules

### HTTP Method Auto-Inference

Folder names become HTTP methods.

```
features/
├── api/
│   └── users/
│       ├── get/          → GET /api/users
│       ├── post/         → POST /api/users
│       └── [id]/
│           ├── get/      → GET /api/users/:id
│           ├── put/      → PUT /api/users/:id
│           └── @delete/   → DELETE /api/users/:id
```

**Supported methods**: `get`, `post`, `put`, `patch`, `delete`

---

### Path Auto-Inference

Folder structure directly maps to API paths.

| Folder Path | API Path |
|-------------|----------|
| `features/api/v1/orders/@post` | `/api/v1/orders` |
| `features/users/@get` | `/users` |
| `features/api/posts/[id]/@get` | `/api/posts/:id` |

---

### Dynamic Routes - `[parameter]` Notation

Folders wrapped in brackets become route parameters.

```
features/
└── api/
    └── users/
        └── [userId]/
            └── posts/
                └── [postId]/
                    └── @get/
```

→ `GET /api/users/:userId/posts/:postId`

---

### Steps/AsyncTasks Auto-Discovery

If `steps/` or `async-tasks/` folders exist in the feature directory, they're automatically discovered.

```
features/api/orders/@post/
├── index.js
├── steps/              # Auto-discovered!
│   ├── 100-validate.js
│   ├── 200-create.js
│   └── 300-process.js
└── async-tasks/        # Auto-discovered!
    ├── send-email.js
    └── send-sms.js
```

---

## Writing Steps

All step functions follow this signature:

### Step Function Signature

```javascript
async function stepName(ctx, req, res) {
  // ctx: Pure business data (Context object)
  // req: HTTP Request object
  // res: HTTP Response object
}
```

### JavaScript Example

```javascript
// features/api/orders/@post/steps/100-validate.js

/**
 * @param {Object} ctx - Context object (pure business data)
 * @param {IncomingMessage} req - HTTP Request
 * @param {ServerResponse} res - HTTP Response
 */
async function validateOrder(ctx, req, res) {
  // 1. Access input data
  const orderData = req.body

  // 2. Validation logic
  if (!orderData.items || orderData.items.length === 0) {
    res.status(400).json({ error: 'Order must have items' })
    return // void - error response sent
  }

  // 3. Store result in context
  ctx.validation = {
    isValid: true,
    validatedAt: new Date(),
  }

  // Done! Automatically proceeds to next step
}

module.exports = validateOrder
```

### TypeScript Example

```typescript
// features/api/orders/@post/steps/100-validate.ts
import { Context } from 'numflow'
import { IncomingMessage, ServerResponse } from 'http'

async function validateOrder(
  ctx: Context,
  req: IncomingMessage,
  res: ServerResponse
): Promise<boolean | void> {
  const orderData = req.body

  if (!orderData.items || orderData.items.length === 0) {
    res.status(400).json({ error: 'Order must have items' })
    return // void
  }

  // Store result in context
  ctx.validation = {
    isValid: true,
    validatedAt: new Date(),
  }

  // Done! Automatically proceeds to next step
}

export default validateOrder
```

### File Naming Rules

- **Start with number**: `100-`, `200-`, `300-`
- **Hyphen required**: `-`
- **Extension**: `.js`
- **Regex pattern**: `/^\d+-.*\.js$/`

### Sorting Behavior

- Sorted by **numeric value** (not sequential!)
- `100, 200, 300` → `100, 150, 200, 300` (can insert in between)

---

## Context Object

Shared pure business data storage across all steps.

`req` and `res` removed from Context to keep it pure business data only. HTTP layer objects are passed as separate parameters to step functions.

```javascript
const context = {
  // Pure business data only
  userId: 1,
  orderData: { /* ... */ },
  validated: true,
  validation: { /* ... */ },
  inventory: { /* ... */ },
  // All user-stored fields...
}

// Step function signature 
module.exports = async (ctx, req, res) => {
  // ctx: Pure business data
  // req: HTTP Request object
  // res: HTTP Response object
}
```

---

## Async Tasks

Async tasks are automatically queued after all steps complete.

AsyncTask functions only receive Context (no req, res). Read required data directly from Context.

### AsyncTask Function Signature

```javascript
async function asyncTaskName(ctx) {
  // ctx: Pure business data
  // No req or res
}
```

### JavaScript Example

```javascript
// features/api/orders/@post/async-tasks/send-email.js

/**
 * @param {Object} ctx - Context object (pure business data)
 */
async function sendEmail(ctx) {
  // Read data directly from Context (root level)
  const { userId, order } = ctx

  // Send email
  await emailService.send({
    to: order.userEmail,
    subject: `Order Confirmation (${order.id})`,
    template: 'order-confirmation',
    data: order,
  })

  // AsyncTask return values are ignored (not stored)
}

module.exports = sendEmail
```

---

## Registration Methods

### Feature Registration - app.registerFeatures()

Recursively scans and auto-registers all Features in a directory.

**Basic Usage:**
```javascript
const numflow = require('numflow')
const app = numflow()

// Recursively scan and register all Features in features directory
app.registerFeatures('./features')

// app.listen() automatically waits for feature registration to complete
app.listen(3000, () => {
  console.log('Server running on port 3000')
})
```

**Folder Structure:**
```
features/
└── api/
    └── v1/
        ├── orders/
        │   ├── post/                   # POST /api/v1/orders
        │   │   ├── index.js
        │   │   └── steps/
        │   │       ├── 100-validate.js
        │   │       └── 200-create.js
        │   └── [id]/
        │       └── @get/                # GET /api/v1/orders/:id
        │           └── index.js
        └── users/
            └── @get/                    # GET /api/v1/users
                └── index.js
```

**With Options:**
```javascript
app.registerFeatures('./features', {
  indexPatterns: ['index.js', 'feature.js'],  // File name patterns to scan
  excludeDirs: ['__tests__', 'utils'],        // Directories to exclude
  debug: true,                                 // Enable debug logging
})

app.listen(3000)
```

**Multiple Features Directories:**

You can register multiple features directories. Directory names don't have to be 'features'.

```javascript
const numflow = require('numflow')
const app = numflow()

// Register multiple directories
app.registerFeatures('./features')           // Default features
app.registerFeatures('./admin-features')     // Admin features
app.registerFeatures('./api-v2')             // API v2 features

app.listen(3000, () => {
  console.log('Server running on port 3000')
})
```

**Path Inference:**

Each directory independently infers paths from its structure:

```
features/api/users/@get          → GET /api/users
admin-features/api/users/@get    → GET /api/users (collision!)
api-v2/users/@get                → GET /users
```

**Use Cases:**

1. **API Version Separation**:
   ```javascript
   app.registerFeatures('./features-v1')  // v1 API
   app.registerFeatures('./features-v2')  // v2 API
   ```

2. **Permission-Based Separation**:
   ```javascript
   app.registerFeatures('./public-api')   // Public API
   app.registerFeatures('./admin-api')    // Admin API
   ```

3. **Domain-Based Separation**:
   ```javascript
   app.registerFeatures('./user-features')     // User domain
   app.registerFeatures('./payment-features')  // Payment domain
   app.registerFeatures('./order-features')    // Order domain
   ```

**⚠️ Route Collision Warning:**

If the same `method:path` combination exists in multiple directories, the program **immediately terminates** with a Fail-Fast policy.

```javascript
// ❌ Collision example
app.registerFeatures('./features-dir1')
// features-dir1/api/user/@get → GET /api/user

app.registerFeatures('./features-dir2')
// features-dir2/api/user/@get → GET /api/user (collision!)

app.listen(3000)  // → Error: Feature already registered: GET:/api/user
```

**Collision Resolution:**

1. **Use different paths**:
   ```javascript
   // features-dir1/api/users/@get → GET /api/users
   // features-dir2/api/products/@get → GET /api/products
   ```

2. **Add namespace**:
   ```javascript
   // features-v1/api/user/@get → GET /api/user
   // features-v2/api/user/@get → GET /api/user (collision!)

   // Solution: Add namespace
   // features-v1/v1/api/user/@get → GET /v1/api/user
   // features-v2/v2/api/user/@get → GET /v2/api/user
   ```

3. **Use different methods**:
   ```javascript
   // features-dir1/api/user/@get → GET /api/user
   // features-dir2/api/user/@post → POST /api/user (OK, different method)
   ```

**Benefits:**
- ✅ Register hundreds of features with one line
- ✅ Understand API structure from folder structure alone
- ✅ Each feature isolated in its own directory
- ✅ Improved scalability and maintainability
- ✅ Enhanced modularity and team collaboration through multiple directories

---

## Advanced Configuration

### numflow.feature(options)

Define a feature and customize auto-orchestration behavior.

#### Convention-First (Recommended)

```javascript
// features/api/orders/@post/index.js
const numflow = require('numflow')

// Everything auto-inferred!
module.exports = numflow.feature()

// Or specify only what you need:
module.exports = numflow.feature({
  // method: 'POST'         ← Auto-inferred from 'post' folder!
  // path: '/api/orders'    ← Auto-inferred from folder structure!
  // steps: './steps'       ← Auto-discovered!
  // asyncTasks: './async-tasks' ← Auto-discovered!
})
```

#### Manual Configuration (Advanced)

```javascript
// features/create-order/index.js
const numflow = require('numflow')

module.exports = numflow.feature({
  // Override Convention (optional)
  method: 'POST',                // Explicit method instead of folder name
  path: '/api/orders',           // Explicit path instead of folder structure

  // Auto-orchestration
  steps: './steps',              // 100, 200, 300... auto-execute
  asyncTasks: './async-tasks',   // Async tasks auto-queue

  // Error handler (custom transaction logic)
  onError: async (error, context, req, res) => {
    // PostgreSQL example
    // await context.dbClient.query('ROLLBACK')

    // MongoDB example
    // await context.session.abortTransaction()

    res.statusCode = 500
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: error.message }))
  },
})
```

---

### Configuration Options

#### method

HTTP method for this feature.

```javascript
method: 'POST'  // 'GET', 'POST', 'PUT', 'DELETE', 'PATCH'
```

**Convention**: Auto-inferred from folder name (`get/`, `post/`, etc.)

---

#### path

Route path for this feature.

```javascript
path: '/api/orders'
path: '/api/orders/:id'
```

**Convention**: Auto-inferred from folder structure

---

#### middlewares

Feature-level middleware array.

```javascript
middlewares: [authenticate, authorize]  // Runs before contextInitializer
```

**Execution Order:**
```
1. Global middlewares (app.use() registered)
2. Feature middlewares (this option)
3. contextInitializer
4. Steps
```

**Example:**
```javascript
// features/api/orders/@post/index.js
const numflow = require('numflow')
const { authenticate, authorize } = require('../../middlewares/auth')

module.exports = numflow.feature({
  // Authentication and authorization
  middlewares: [authenticate, authorize('admin')],

  // Add authenticated user to context
  contextInitializer: (ctx, req, res) => {
    ctx.userId = req.user.id
    ctx.userRole = req.user.role
    ctx.orderData = req.body
  },

  steps: './steps',
})
```

---

#### steps

Path to steps folder (relative path).

```javascript
steps: './steps'  // Or omit (auto-discovered)
```

**Convention**: If omitted, `'./steps'` directory is automatically discovered.

**Folder Structure:**
```
features/create-order/
├── index.js
└── steps/                      ← Auto-discovered!
    ├── 100-validate-order.js   ← Execute in order
    ├── 200-check-inventory.js
    ├── 300-reserve-stock.js
    └── 400-process-payment.js
```

**File Naming Rules:**
- Start with number: `100-`, `200-`, `300-`
- Hyphen required: `-`
- Sorted by numeric value

---

#### asyncTasks

Path to async tasks folder (relative path).

```javascript
asyncTasks: './async-tasks'  // Or omit (auto-discovered)
```

**Convention**: If omitted, `'./async-tasks'` directory is automatically discovered.

**Folder Structure:**
```
features/create-order/
├── index.js
├── steps/
└── async-tasks/               ← Auto-discovered!
    ├── send-email.js          ← Async execution
    ├── send-notification.js
    └── publish-analytics.js
```

**AsyncTask Function:**
```javascript
// async-tasks/send-email.js
module.exports = async (ctx) => {
  // Only receives Context (no req, res)
  await emailService.send(ctx.order)
}
```

---

#### onError

Custom error handler called when an error occurs. Enables custom error handling like database transaction rollback.

**Function Signature:**
```typescript
onError?: (
  error: Error,
  context: Context,
  req: IncomingMessage,
  res: ServerResponse
) => Promise<void> | void
```

**PostgreSQL Example:**
```javascript
onError: async (error, context, req, res) => {
  // PostgreSQL transaction rollback
  if (context.dbClient) {
    await context.dbClient.query('ROLLBACK')
  }

  res.statusCode = 500
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify({ error: error.message }))
}
```

**MongoDB Example:**
```javascript
onError: async (error, context, req, res) => {
  // MongoDB transaction rollback
  if (context.session) {
    await context.session.abortTransaction()
    await context.session.endSession()
  }

  res.statusCode = 500
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify({ error: error.message }))
}
```

**Note**: If no onError handler is provided, errors are passed to the global error handler.

---

#### contextInitializer

Set initial Context values based on HTTP request data.

**Function Signature:**
```typescript
contextInitializer?: (
  ctx: Context,
  req: IncomingMessage,
  res: ServerResponse
) => Promise<void> | void
```

**Parameters**: Receives the Context object and directly modifies it

**Examples:**
```javascript
// Extract authentication info
contextInitializer: (ctx, req, res) => {
  const token = req.headers.authorization
  const userId = validateToken(token)

  ctx.userId = userId
  ctx.userRole = getUserRole(userId)
}

// Async initialization
contextInitializer: async (ctx, req, res) => {
  const user = await db.getUserFromToken(req.headers.authorization)

  ctx.user = user
  ctx.permissions = user.permissions
}
```

---

## Error Handling & Retry

### Error Retry ⭐

Return `numflow.retry()` from onError handler to automatically retry the feature.

**Basic Usage:**

```javascript
const numflow = require('numflow')

module.exports = numflow.feature({
  onError: async (error, ctx, req, res) => {
    // Immediate retry
    if (error.message.includes('rate_limit')) {
      ctx.fallbackProvider = 'openrouter'
      return numflow.retry()
    }

    // Retry after 1 second
    if (error.message.includes('timeout')) {
      return numflow.retry({ delay: 1000 })
    }

    // Retry up to 3 times
    if (error.message.includes('temporary_error')) {
      return numflow.retry({ maxAttempts: 3 })
    }

    // No retry, send error response
    res.status(500).json({ error: error.message })
  }
})
```

**Performance:**
- `numflow.retry()` (no options): Returns Symbol, ultra-fast (0.005µs)
- `numflow.retry({ delay: 1000 })`: Returns object, ultra-fast (0.005µs)
- 70x faster than throw-based approach

**LLM Provider Fallback Example:**

```javascript
// features/api/chat/post/index.js
const numflow = require('numflow')

module.exports = numflow.feature({
  contextInitializer: (ctx, req, res) => {
    ctx.currentProvider = 'openai'
    ctx.providers = ['openai', 'openrouter', 'gemini']
  },

  onError: async (error, ctx, req, res) => {
    const { providers, currentProvider } = ctx
    const currentIndex = providers.indexOf(currentProvider)
    const nextProvider = providers[currentIndex + 1]

    // Rate limit → Fallback to next Provider
    if (error.message.includes('rate_limit') && nextProvider) {
      console.log(`[Retry] Switching provider: ${currentProvider} → ${nextProvider}`)
      ctx.currentProvider = nextProvider
      return numflow.retry({ delay: 500 })
    }

    // All providers failed
    res.status(503).json({ error: 'All LLM providers unavailable' })
  }
})
```

**Exponential Backoff Example:**

```javascript
module.exports = numflow.feature({
  contextInitializer: (ctx, req, res) => {
    ctx.retryCount = 0
  },

  onError: async (error, ctx, req, res) => {
    // Only retry timeout errors
    if (error.message.includes('timeout')) {
      ctx.retryCount++

      // Retry up to 3 times
      if (ctx.retryCount <= 3) {
        // 1s, 2s, 4s (Exponential Backoff)
        const delay = 1000 * Math.pow(2, ctx.retryCount - 1)
        console.log(`[Retry] Attempt ${ctx.retryCount} after ${delay}ms`)
        return numflow.retry({ delay, maxAttempts: 3 })
      }
    }

    // Max retry exceeded or other error
    res.status(504).json({ error: 'Request timeout' })
  }
})
```

**Options:**

| Option | Type | Description | Example |
|--------|------|-------------|---------|
| `delay` | `number` | Delay before retry (milliseconds) | `{ delay: 1000 }` |
| `maxAttempts` | `number` | Maximum retry attempts | `{ maxAttempts: 3 }` |

**Important Notes:**
- Maximum total retries: 10 (prevents infinite loops)
- On retry, all steps re-execute from the beginning
- Context persists across retries (can store Provider fallback, retry count, etc.)

---

## Complete Examples

### Convention-Based Example (Recommended)

```
features/api/orders/@post/
├── index.js              # Feature definition
├── steps/                # Auto-discovered
│   ├── 100-validate.js
│   └── 200-create.js
└── async-tasks/          # Auto-discovered
    └── send-email.js
```

```javascript
// features/api/orders/@post/index.js
const numflow = require('numflow')

// Everything auto-inferred!
module.exports = numflow.feature()
```

```javascript
// features/api/orders/@post/steps/100-validate.js
async function validate(ctx, req, res) {
  if (!req.body.items || req.body.items.length === 0) {
    throw new Error('Order must have items')
  }
  ctx.validation = { isValid: true }
}
module.exports = validate
```

```javascript
// features/api/orders/@post/steps/200-create.js
async function create(ctx, req, res) {
  const order = await db.orders.create(req.body)
  ctx.order = order
}
module.exports = create
```

```javascript
// features/api/orders/@post/async-tasks/send-email.js
async function sendEmail(ctx) {
  const { order } = ctx
  await emailService.send({
    to: order.userEmail,
    orderId: order.id,
  })
}
module.exports = sendEmail
```

```javascript
// app.js
const numflow = require('numflow')
const app = numflow()

app.registerFeatures('./features')
app.listen(3000)
```

---

### Manual Configuration Example

```javascript
// features/create-order/index.js
const numflow = require('numflow')

module.exports = numflow.feature({
  method: 'POST',
  path: '/api/orders',
  steps: './steps',
  asyncTasks: './async-tasks',

  middlewares: [authenticate, authorize],

  contextInitializer: (req, res) => ({
    userId: req.user.id,
    orderData: req.body,
  }),

  onError: async (error, context, req, res) => {
    // Custom error handling (e.g., DB rollback)
    console.error('Error in create-order:', error)

    if (context.dbClient) {
      await context.dbClient.query('ROLLBACK')
    }

    res.statusCode = 500
    res.end(JSON.stringify({ error: error.message }))
  },
})
```

---

## Debugging and Logging

### AutoExecutor Logs

AutoExecutor automatically logs execution status for each step.

**Log Format:**
```
[AutoExecutor] [METHOD /path] message
```

**Log Example:**
```
[AutoExecutor] [POST /api/orders] Executing 3 steps...
[AutoExecutor] [POST /api/orders] Executing step 100: 100-validate.js
[AutoExecutor] [POST /api/orders] Step 100 completed in 2ms
[AutoExecutor] [POST /api/orders] Executing step 200: 200-create.js
[AutoExecutor] [POST /api/orders] Step 200 completed in 15ms
[AutoExecutor] [POST /api/orders] Executing step 300: 300-notify.js
[AutoExecutor] [POST /api/orders] Step 300 completed in 5ms
[AutoExecutor] [POST /api/orders] All 3 steps executed successfully
```

**Error Log Example:**
```
[AutoExecutor] [POST /api/orders] Executing 3 steps...
[AutoExecutor] [POST /api/orders] Executing step 100: 100-validate.js
[AutoExecutor] [POST /api/orders] ERROR: Step 100 failed: Order must have items
```

### Disable Logs

Disable Feature logs in production or specific environments.

**Method 1: Environment Variable**
```bash
# Disable logs
DISABLE_FEATURE_LOGS=true node app.js

# Or in .env file
DISABLE_FEATURE_LOGS=true
```

**Method 2: Auto-disable in Test Environment**
```bash
# Automatically disabled when NODE_ENV=test
NODE_ENV=test npm test
```

**package.json Scripts:**
```json
{
  "scripts": {
    "start": "node app.js",
    "start:silent": "DISABLE_FEATURE_LOGS=true node app.js",
    "test": "NODE_ENV=test jest"
  }
}
```

---

## Debug Mode

Debug Mode visualizes step execution flow and tracks context changes for easier debugging.

> **Note**: Debug Mode only works with Feature-First pattern. For complete documentation, see [Debug Mode Guide](../guides/debug-mode.md).

### Enable Debug Mode

Debug Mode is **disabled by default**. Enable it when debugging is needed:

```bash
# Method 1: Environment variable
FEATURE_DEBUG=true node app.js

# Method 2: .env file
echo "FEATURE_DEBUG=true" >> .env
node app.js

# Method 3: package.json script
{
  "scripts": {
    "dev": "FEATURE_DEBUG=true node app.js",  // Dev (Debug Mode enabled)
    "start": "node app.js"                     // Production (disabled)
  }
}
```

### Debug Output Example

**Success Case:**
```bash
[Feature] POST /api/orders
  [Step 100] validate-order (2ms) ✓
    ├─ Input: {"userId":1,"orderData":{"items":[...]}}
    └─ Context: {"validation":{"isValid":true,"itemCount":1}}

  [Step 200] create-order (15ms) ✓
    ├─ Input: {"userId":1,"orderData":{...}}
    └─ Context: {"order":{"orderId":"12345","status":"created"}}

  [Summary]
    Total: 17ms
    Steps: 2/2 passed
    Status: ✓ Success
```

**Error Case:**
```bash
[Feature] POST /api/orders
  [Step 100] validate-order (2ms) ✗
    ├─ Input: {"userId":1,"orderData":{"items":[]}}
    └─ Error: Order must have items

  [Summary]
    Total: 2ms
    Steps: 0/1 passed
    Status: ✗ Failed
    Error: Order must have items
```

### Key Features

1. **Step-by-Step Tracking**
   - Execution time for each step (milliseconds)
   - Success/Failure indicator (✓/✗)
   - Input state before step execution
   - Context changes after step execution

2. **Performance Profiling**
   - Easily identify slow steps
   - Total execution time
   - Step-by-step timing breakdown

3. **Context Flow Visualization**
   - See how data flows between steps
   - Track what each step adds to context
   - Identify where data gets lost or corrupted

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `FEATURE_DEBUG` | `false` | Set to `true` to enable detailed step-by-step debug output |
| `DISABLE_FEATURE_LOGS` | `false` | Set to `true` to disable all Feature logs (overrides DEBUG) |
| `NODE_ENV` | - | Automatically disables all logs when set to `test` |

### Performance Impact

Debug Mode has **minimal performance overhead** (approximately 2-3%):

- Debug Mode OFF: 42,104 req/s
- Debug Mode ON: ~41,000 req/s

**Recommendation**: Keep disabled in production environments.

### Best Practices

```javascript
// ✅ Good: Enable in development
{
  "scripts": {
    "dev": "FEATURE_DEBUG=true node app.js",
    "start": "node app.js"
  }
}

// ✅ Good: Use for debugging specific features
FEATURE_DEBUG=true node app.js

// ❌ Bad: Enable in production
// Performance overhead and may expose sensitive data in logs
```

For complete documentation, examples, and advanced usage, see the **[Debug Mode Guide](../guides/debug-mode.md)**.

---

## Benefits

### 1. Convention over Configuration ⭐
Just create folder structure, APIs are auto-registered.

### 2. Bulk Registration
Register hundreds of features with one line, understand API structure from folder structure alone.

### 3. Auto-Execution
No need to write Orchestrator classes.

### 4. Visual Flow
Understand entire flow just by looking at file list.

### 5. Flexible Extension
Adding steps in between doesn't require modifying other files.

### 6. Flexible Error Handling
Database-independent error handling with onError handler.

### 7. Automatic Error Catching
Errors automatically caught without try-catch and passed to onError handler.

---

## Related Documentation

- **[Feature-First Guide](../guides/feature-first.md)** - Complete guide with examples
- **[Debug Mode Guide](../guides/debug-mode.md)** - Debugging Features with FEATURE_DEBUG
- **[Application API](./application.md)** - app.registerFeatures() method
- **[Getting Started](../guides/getting-started.md)** - Beginner tutorial
- **[Examples](../../examples/07-feature-first/)** - Real-world examples

---

*Last updated: 2025-11-09*
