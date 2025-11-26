# Architecture Design

> Comprehensive technical architecture and design decisions

This document provides an in-depth look at Numflow's system architecture, core components, and design principles.

---

## Table of Contents

- [Overview](#overview)
- [Design Principles](#design-principles)
- [System Architecture](#system-architecture)
- [Core Components](#core-components)
- [Performance Optimization](#performance-optimization)
- [Express Compatibility](#express-compatibility)
- [Error Handling Architecture](#error-handling-architecture)
- [JavaScript Developer Support](#javascript-developer-support)

---

## Overview

Numflow is a Node.js web framework that is 100% compatible with Express.js while delivering significantly improved performance.

**Key Characteristics:**
- Express-compatible API (drop-in replacement)
- Radix Tree router (3.4x faster than Express)
- Feature-First Auto-Orchestration (unique pattern)
- TypeScript-first, JavaScript-friendly design
- Zero-config Convention over Configuration

---

## Design Principles

### 1. Complete Express Compatibility

- 100% identical interface with Express API
- Existing Express middleware/plugins work unchanged
- Request/Response object structures match exactly
- Drop-in replacement with no code changes

### 2. High Performance

- **Radix Tree Router**: Using Fastify's find-my-way (O(log n) vs Express's O(n))
- **Object Pooling**: Reuse objects to minimize garbage collection
- **Middleware Chain Optimization**: Pre-compiled middleware execution
- **Minimal Memory Allocation**: Efficient memory management

### 3. TypeScript First, JavaScript Friendly

- **TypeScript**: Complete type inference, generic-based type safety
- **JavaScript**: Type hints through JSDoc, .d.ts type definitions
- **Optional**: TypeScript is a choice, not a requirement
- **Runtime**: Type validation is an optional feature

### 4. Developer Experience

- Automatic error handling (no try-catch required)
- Clear error messages
- Perfect support for both JavaScript and TypeScript

### 5. Numflow Philosophy: "Numbers Control the Flow" ⭐

- **File name numbers represent execution order**: `100-validate.js`, `200-process.js`, `300-complete.js`
- **Size-based sorting**: No sequential numbering needed, just compare number size
- **Flexible extension**: Adding steps in-between requires no changes to other files (e.g., add `150-new-step.js`)
- **Visual flow understanding**: Folder structure reveals entire processing order
- **Auto-orchestration**: Framework automatically executes in order

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                       Application                            │
│  - HTTP Server Management                                   │
│  - Middleware Registration                                  │
│  - Router Management                                        │
│  - Feature Registration                                     │
│  - Error Handler                                            │
└──────────────────┬──────────────────────────────────────────┘
                   │
        ┌──────────┴────────────┐
        │                       │
┌───────▼────────┐   ┌──────────▼──────────┐
│  Router        │   │  FeatureManager     │
│  (find-my-way) │   │  Auto-Orchestration │
│  - O(log n)    │   │  - Auto-discovery   │
│  - req.params  │   │  - Auto-execution   │
│  - req.query   │   │  - Auto-error       │
└───────┬────────┘   └──────────┬──────────┘
        │                       │
        └──────────┬────────────┘
                   │
        ┌──────────▼──────────────────┐
        │   MiddlewareChain           │
        │   - next() logic            │
        │   - Error catch             │
        │   - Async wrap              │
        └──────────┬──────────────────┘
                   │
        ┌──────────▼──────────────────┐
        │   Request / Response        │
        │   - Express compatible      │
        │   - req.params              │
        │   - req.query               │
        │   - Type safe               │
        └─────────────────────────────┘
```

---

## Core Components

### Application Class

**Responsibilities:**
- HTTP server creation and management
- Router registration and lookup
- Global middleware management
- Configuration management

**Key Methods:**
```typescript
class Application {
  listen(port: number, callback?: () => void): Server
  use(middleware: Middleware | string, ...middlewares: Middleware[]): Application
  get/post/put/delete/patch(path: string, ...handlers: Handler[]): Application
  set(key: string, value: any): Application
  get(key: string): any
}
```

**Error Handling:**
Numflow uses Express-style error middleware with 4 parameters:
```typescript
app.use((err, req, res, next) => {
  // Error handling logic
})
```

### Router Class

**Responsibilities:**
- High-speed route matching (Radix Tree, O(log n))
- Automatic path parameter extraction (req.params)
- Automatic query parameter parsing (req.query)
- HTTP method-based handler management
- **Duplicate route validation** (automatic check at server startup)
- Automatic 404 Not Found handling
- Default 500 Error handling

**Dependencies:**
- find-my-way v8.2.2 (Radix Tree router)

**Features:**
- **10-100x faster matching** than Express's linear search
- Memory-efficient tree structure
- Dynamic parameters support (/users/:id)
- Wildcard support (/files/*)
- Regex pattern support (/users/:id(^\\d+$))

**Internal Radix Tree Structure:**
```
/
├── users
│   ├── /                    → GET /users
│   ├── /:id                 → GET /users/:id
│   │   └── /posts
│   │       └── /:postId     → GET /users/:id/posts/:postId
│   └── /search              → GET /users/search
├── api
│   ├── /orders              → POST /api/orders
│   └── /products            → GET /api/products
└── *                        → 404 Not Found
```

**Key Methods:**
```typescript
class Router {
  // Register route
  on(method: string, path: string, handler: RequestHandler): void

  // Route lookup and handler execution
  lookup(req: Request, res: Response): void

  // 404 handler
  private handle404(req: Request, res: Response): void

  // 500 error handler
  private handle500(err: Error, req: Request, res: Response): void
}
```

**Route Registration Example:**
```typescript
const router = new Router()

// Register GET route
router.on('GET', '/users', (req, res) => {
  res.end('User list')
})

// Dynamic parameters
router.on('GET', '/users/:id', (req, res) => {
  // req.params.id automatically extracted by find-my-way
  res.end(`User ${req.params.id}`)
})

// Multiple parameters
router.on('GET', '/users/:userId/posts/:postId', (req, res) => {
  // req.params.userId, req.params.postId automatically extracted
  const { userId, postId } = req.params
  res.end(`Post ${postId} by User ${userId}`)
})
```

**Query Parameter Parsing:**
```typescript
// GET /search?q=numflow&page=2&limit=10
router.on('GET', '/search', (req, res) => {
  // req.query automatically parsed by URLSearchParams
  const { q, page, limit } = req.query
  res.end(`Query: ${q}, Page: ${page}, Limit: ${limit}`)
})
```

**Performance Comparison:**
```
Benchmark: 100 routes
- Express (linear search): O(n) = 100 comparisons
- Numflow (Radix Tree): O(log n) = 7 comparisons
- Speed improvement: ~14x
```

### MiddlewareChain

**Responsibilities:**
- Sequential middleware execution
- next() function implementation
- Error catching and propagation
- Async handler wrapping

**Flow:**
```typescript
Request → Middleware1 → Middleware2 → Handler → Response
              ↓              ↓            ↓
         next()         next()      (no next)
              ↓              ↓            ↓
          Error? ──→ Error Handler ──→ Response
```

**Automatic Error Handling:**
```typescript
// User code
app.get('/users/:id', async (req, res) => {
  const user = await db.findUser(req.params.id) // can throw
  res.json(user)
})

// Internally transformed
app.get('/users/:id', asyncWrapper(async (req, res, next) => {
  try {
    const user = await db.findUser(req.params.id)
    res.json(user)
  } catch (err) {
    next(err) // automatically passed to error handler
  }
}))
```

### Request Extensions

**Express-Compatible Properties:**
```typescript
interface Request extends http.IncomingMessage {
  params: Record<string, string>
  query: Record<string, any>
  body: any
  headers: http.IncomingHttpHeaders
  method: string
  url: string
  path: string
  hostname: string
  ip: string
  protocol: string
  secure: boolean
  xhr: boolean

  // Express methods
  get(field: string): string | undefined
  header(field: string): string | undefined
  accepts(types: string | string[]): string | false
  is(type: string | string[]): string | false
}
```

### Response Extensions

**Express-Compatible Methods:**
```typescript
interface Response extends http.ServerResponse {
  // Status codes
  status(code: number): Response
  sendStatus(code: number): Response

  // Send responses
  send(body: any): Response
  json(body: any): Response
  jsonp(body: any): Response

  // Redirect
  redirect(url: string): void
  redirect(status: number, url: string): void

  // Headers
  set(field: string, value: string): Response
  set(fields: Record<string, string>): Response
  get(field: string): string | undefined

  // Cookies
  cookie(name: string, value: string, options?: any): Response
  clearCookie(name: string, options?: any): Response

  // Files
  sendFile(path: string, options?: any, callback?: any): void
  download(path: string, filename?: string, callback?: any): void

  // Rendering
  render(view: string, locals?: any, callback?: any): void
}
```

### Duplicate Route Detection

Numflow automatically detects duplicate route registrations at server startup and throws an error.

**Purpose:**
- Prevent accidentally registering the same path/method twice
- Provide clear error messages for quick problem identification
- Fail server startup to catch issues before production deployment

**Implementation:**
```typescript
class Router {
  private routes: RouteInfo[] = []

  private checkDuplicateRoute(method: string, path: string): void {
    const existing = this.routes.find(r => r.method === method && r.path === path)
    if (existing) {
      throw new Error(`Duplicate route registration: ${method} ${path}`)
    }
  }

  get(path: string, ...handlers: RouteHandler[]): this {
    this.checkDuplicateRoute('GET', path)
    this.routes.push({ method: 'GET', path, handlers })
    this.router.on('GET', path, this.wrapHandlers(handlers))
    return this
  }
}
```

**Usage Example:**
```javascript
const app = numflow()

// First registration - OK
app.get('/users', (req, res) => {
  res.json({ message: 'Get users' })
})

// Second registration - Error!
app.get('/users', (req, res) => {
  res.json({ message: 'Another handler' })
})
// → Error: Duplicate route registration: GET /users
```

**What's Allowed:**
```javascript
// ✅ Same path, different method - Allowed
app.get('/users', handler)
app.post('/users', handler)

// ✅ Different path, same method - Allowed
app.get('/users', handler)
app.get('/posts', handler)
```

**Interaction with app.all():**
```javascript
// app.all() registers for all methods
app.all('/users', handler)

// So this fails (duplicate):
app.get('/users', handler)
// → Error: Duplicate route registration: GET /users
```

---

## Performance Optimization

### 1. Routing Optimization

**Radix Tree vs Linear Search:**
```
Express (Linear):
Matching time = O(n) where n = number of routes
100 routes = 100 comparisons

Numflow (Radix Tree):
Matching time = O(log n)
100 routes = 7 comparisons
```

### 2. Object Pooling

```typescript
// Request/Response pooling
const requestPool = new Pool(() => new Request())
const responsePool = new Pool(() => new Response())

// Request processing
const req = requestPool.acquire()
const res = responsePool.acquire()
// ... process ...
requestPool.release(req)
responsePool.release(res)
```

### 3. Middleware Optimization

**Pre-compilation:**
```typescript
class CompiledMiddlewareChain {
  private readonly chain: Middleware[]

  constructor(middlewares: Middleware[]) {
    this.chain = this.compile(middlewares)
  }

  private compile(middlewares: Middleware[]): Middleware[] {
    // Optimize middleware chain
    // - Merge synchronous middleware
    // - Remove unnecessary wrappers
    return optimized
  }
}
```

### 4. Memory Optimization

- Regex caching
- Content-Type parser caching
- Header parsing optimization
- Buffer reuse

---

## Express Compatibility

### Prototype Chain Matching

```typescript
// Same prototype structure as Express
Request.prototype = Object.create(http.IncomingMessage.prototype)
Response.prototype = Object.create(http.ServerResponse.prototype)

// Properties expected by Express middleware
Object.defineProperty(Request.prototype, 'app', {
  get() { return this._app }
})
```

### Middleware Compatibility

```typescript
// Fully supports Express middleware signature
type Middleware =
  | ((req: Request, res: Response, next: NextFunction) => void)
  | ((err: Error, req: Request, res: Response, next: NextFunction) => void)

// Automatic detection
function isErrorMiddleware(middleware: Function): boolean {
  return middleware.length === 4
}
```

---

## Error Handling Architecture

### Layered Error Handling

```
Application Layer
    ↓ (error occurs)
Middleware Layer  → AsyncWrapper (automatic catch)
    ↓ (next(err))
Error Middleware  → Type-based error handling
    ↓
Response (error response)
```

### Error Handler Priority

1. Feature-level error handler (onError in Feature config)
2. Express-style error middleware (app.use with 4 parameters)
3. Default error handler

### Automatic Error Type Detection

Numflow uses **duck typing** for error type detection to ensure compatibility across different module instances (e.g., when using `file:../../` or monorepo setups).

```typescript
import { isHttpError, isOperationalError } from 'numflow'

class ErrorHandler {
  handle(err: Error, req: Request, res: Response) {
    // Use isHttpError() for duck typing - works across module instances
    if (isHttpError(err)) {
      return res.status(err.statusCode).json({ error: err.message })
    }
    // Default 500 error
    return res.status(500).json({ error: 'Internal server error' })
  }
}
```

> **Note**: Avoid using `instanceof` checks directly (e.g., `err instanceof ValidationError`) as they may fail when different module instances exist. Always use `isHttpError()` and `isOperationalError()` utility functions for maximum compatibility.

---

## JavaScript Developer Support

### 1. Type Hints through JSDoc

Provides complete auto-completion and type checking in IDE without TypeScript.

```javascript
/**
 * @typedef {Object} User
 * @property {string} id
 * @property {string} name
 * @property {string} email
 */

/**
 * @param {import('numflow').Request} req
 * @param {import('numflow').Response} res
 */
app.get('/users/:id', async (req, res) => {
  const id = req.params.id  // IDE infers type
  const user = await getUser(id)
  res.json(user)  // IDE provides auto-completion
})
```

### 2. .d.ts Type Definitions

Numflow provides complete TypeScript type definitions, so JavaScript projects also receive type hints.

```javascript
// JavaScript files also get type hints
const numflow = require('numflow')
const app = numflow()  // IDE provides method auto-completion

app.get('/users', (req, res) => {
  // Complete type hints for req, res
})
```

### 3. CommonJS and ESM Support

```javascript
// CommonJS
const numflow = require('numflow')
const app = numflow()

// ESM
import numflow from 'numflow'
const app = numflow()
```

### 4. JavaScript Examples First

All documentation and examples are provided in JavaScript first, with TypeScript as optional.

```javascript
// examples/basic.js - JavaScript example
const numflow = require('numflow')
const app = numflow()

app.use(numflow.json())

app.get('/', (req, res) => {
  res.json({ message: 'Hello World' })
})

app.listen(3000, () => {
  console.log('Server running on port 3000')
})
```

### 5. Run Without Building

```bash
# Run directly without TypeScript compilation
node server.js

# Or develop with nodemon
nodemon server.js
```

---

## Feature-First Auto-Orchestration ⭐

Numflow's core differentiator that visualizes and automatically executes complex business logic based on **numeric file names**.

### Philosophy: "Numflow = Numbers Control the Flow"

The true meaning of the framework name "Numflow" is that **file name numbers determine execution order**.

```
features/create-order/steps/
  100-validate-order.js      ← First execution
  200-check-inventory.js     ← Second execution
  300-reserve-stock.js       ← Third execution
  400-process-payment.js     ← Fourth execution
```

Developers just write files, and Numflow automatically:
1. Scans files
2. Extracts and sorts numbers
3. Executes in order
4. Handles errors
5. Queues async tasks

### Problem Recognition

**Problems with Traditional Approach:**

```javascript
// ❌ Manual orchestrator - developer must write
class CreateOrderOrchestrator {
  async execute(data) {
    await this.validateOrder(data)      // Order 1
    await this.checkInventory(data)     // Order 2
    await this.reserveStock(data)       // Order 3
    // ... 10+ manual calls
  }
}

// Adding a step in the middle?
// → Code modification required
// → Other steps also affected
```

**Numflow's Solution:**

```javascript
// ✅ Automatic orchestration - just write files
// features/create-order/index.js
module.exports = numflow.feature({
  steps: './steps',        // Auto-scan and execute
  onError: async (error, context, req, res) => {
    // User directly handles errors (rollback, logging, etc.)
    if (context.txId) {
      await db.rollback(context.txId)
    }
    res.status(500).json({ error: error.message })
  },
})

// Adding a step in the middle?
// → Just add 150-new-step.js file!
// → Other files unchanged!
```

### Size-Based Sorting Principle

**Core Rule: Size comparison, not sequential**

```javascript
// ✅ Recommended (100 units)
100-validate.js
200-check.js
300-process.js

// Adding in the middle
100-validate.js
150-verify-user.js    ← Newly added!
200-check.js          ← Unchanged
300-process.js        ← Unchanged

// Fine-grained addition (10 units)
100-validate.js
150-verify-user.js
200-check.js
250-fraud-check.js    ← Added
300-process.js
```

**Wrong Example (Sequential Numbering):**

```javascript
// ❌ Sequential numbering (hard to maintain)
01-validate.js
02-check.js
03-process.js

// Adding in the middle requires renaming all files
01-validate.js
02-new-step.js        ← Added
03-check.js           ← Changed from 02 → 03
04-process.js         ← Changed from 03 → 04
```

### File Naming Rules

**Required Pattern: `number-description.js`**

```javascript
// ✅ Valid filenames
100-validate-order.js
250-check-inventory.js
1000-complete.js
50-early-check.js

// ❌ Invalid filenames
validate-100.js       // Number not at front
validate.js           // No number
100_validate.js       // Underscore instead of hyphen
```

### Auto-Discovery Engine

Numflow scans the steps folder and automatically determines execution order.

**Internal Operation:**

```javascript
class AutoDiscovery {
  scanSteps(directory) {
    // 1. Scan folder
    const files = fs.readdirSync(directory)

    // 2. Pattern validation
    const validFiles = files.filter(file =>
      /^\d+-.*\.js$/.test(file)
    )

    // 3. Extract numbers and sort
    const sorted = validFiles.sort((a, b) => {
      const numA = parseInt(a.match(/^(\d+)-/)[1])
      const numB = parseInt(b.match(/^(\d+)-/)[1])
      return numA - numB
    })

    // 4. Validate no duplicates
    this.validateNoDuplicates(sorted)

    return sorted
  }
}
```

### Auto-Execution Engine

Executes scanned files in order.

**Context Object:**

```javascript
// Context shared by all steps
const context = {
  userId: 1,
  orderData: { /* ... */ },
  results: {}, // Store each step's results
  // Users can freely add needed fields
}
```

**Step Function Signature:**

```javascript
// All steps follow this form
async function stepName(context, req, res) {
  // 1. Use previous step results
  const prevResult = context.previousStep

  // 2. Perform current step logic
  const result = await doSomething(context.orderData)

  // 3. Store result
  context.currentStep = result

  // Done! Automatically proceeds to next step
}

module.exports = stepName
```

### Error Handler (onError)

Users can directly handle errors that occur during Feature execution.

**Configuration:**

```javascript
numflow.feature({
  steps: './steps',
  onError: async (error, context, req, res) => {
    // 1. Transaction rollback (user implements)
    if (context.txId) {
      await db.rollback(context.txId)
    }

    // 2. Error logging
    console.error('Order creation failed:', error)

    // 3. Send HTTP response
    res.statusCode = 500
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({
      error: error.message,
      orderId: context.orderId
    }))
  },
})
```

**Advantages:**

- **Database Independence**: Free to manage transactions with any DB client
- **Flexible Error Handling**: Can send different responses based on error type
- **User Control**: Framework doesn't force, user has complete control

---

## Related Documentation

- [Getting Started Guide](../guides/getting-started.md)
- [Feature-First Guide](../guides/feature-first.md)
- [Performance Benchmarks](./performance.md)
- [Routing Guide](../guides/routing.md)
- [Middleware Guide](../guides/middleware.md)

---

## Latest Performance Metrics (2025-11-15)

- **vs Express**: **+228%** (64,634 vs 19,694 req/s)
- **vs Fastify**: **-19%** (80,188 req/s slightly faster)
- **POST requests**: **Surpasses Fastify +12%** (57,872 vs 51,664 req/s)
- **Feature-First overhead**: **0.70%** (negligible)
- **Latency**: **1.09ms** (1/4 of Express)

## Test Pass Rates (2025-11-15)

- **Test Suites**: 55 passed, 55 total
- **Tests**: 1018 passed, 1032 total (14 skipped)
- **Coverage**: High coverage

## New Features (2025-11-15)

### WebSocket Support
- ✅ ws library fully supported (100% Express compatible)
- ✅ Socket.IO fully supported (100% Express compatible)
- ✅ HTTP and WebSocket on same port
- ✅ Works without code changes during Express migration

### Subpath Imports Support
- ✅ Clean import paths using Node.js Subpath Imports
- ✅ Solves deep path issues in Feature-First architecture

### Full ESM and CommonJS Support
- ✅ ESM (.mjs, .mts)
- ✅ CommonJS (.js, .cjs)
- ✅ TypeScript (.ts)
- ✅ Perfect operation in all environments

### Manual Configuration Override
- ✅ Convention over Configuration as default
- ✅ Manual override when needed
- ✅ method, path, steps, asyncTasks all support manual configuration

---

*Last updated: 2025-11-15 (Added latest performance metrics and new features)*
*Previous update: 2025-10-21 (Removed hot reload references - use external tools like nodemon instead)*
