# Numflow

> High-performance Node.js web framework with Express 5.x compatibility

Numflow is a Node.js web framework that is fully compatible with Express 5.x API while providing 3.3x faster performance on average.

[![npm version](https://img.shields.io/npm/v/numflow.svg)](https://www.npmjs.com/package/numflow)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Tests: 1018 passing](https://img.shields.io/badge/tests-1018%20passing-brightgreen.svg)](https://github.com/gazerkr/numflow)

---

## Why Numflow?

While most frameworks focus on "how to implement", Numflow focuses on **"how to develop and maintain"**.

As services grow, code becomes complex and business logic gets scattered across multiple files. If you've ever wondered "Where does the logic for this API start and end?", Numflow is the answer.

### 1. Folder Structure IS the API Specification
Just by looking at `features/api/orders/@post`, you instantly know it's the `POST /api/orders` API.
No need to hunt for router configurations. The folder name and structure are the URL and HTTP method.

### 2. Code is the Living Design Document
Keeping design documents and code in sync is nearly impossible. In Numflow, directories and filenames ARE the current implementation and the design.
Even after years of maintenance, you can grasp exactly how the system works just by looking at the directory structure—it looks just like a design document.
- `100-validate.js`
- `200-check-stock.js`
- `300-payment.js`

### 3. Flexible Structure for Changes
Need to add logic in the middle? No need to rewrite existing code.
Just create a `150-check-coupon.js` file. Numflow automatically executes it between 100 and 200.
Deleting a feature is as simple as deleting a file. Respond quickly to business requirements without worrying about side effects.

### 4. Perfect Cohesion
All related logic (validation, DB operations, async tasks, etc.) is gathered in one folder.
No more wandering through files to modify a feature.

---

## Key Features

### Full Express 5.x Compatibility

Numflow provides 100% API compatibility with Express 5.x.

```javascript
// Express
const express = require('express')
const app = express()

// Numflow - just change the require statement
const numflow = require('numflow')
const app = numflow()
```

Use existing Express code and middleware without any modifications:
- express.json() / express.urlencoded()
- cookie-parser, helmet, morgan, cors
- passport, multer, express-session
- All other Express middleware

### High Performance

Radix Tree-based routing provides **3.3x (228%)** faster performance compared to Express on average.

- vs Express: +228% (3.3x faster on average)
- Outperforms Fastify on POST requests (+12%)
- Feature-First overhead: Only 0.70% (negligible)

For detailed benchmark results, see the [Performance Benchmarks](#performance-benchmarks) section.

### Feature-First Architecture

An architecture that automatically executes complex business logic based on folder structure alone, without configuration files.

**Zero Configuration**: No need to create `index.js` file. APIs are automatically generated from folders and filenames only.

**Folder Structure (Implicit Feature - index.js not required):**
```
features/
  api/
    orders/
      @post/              # POST /api/orders (@ prefix specifies HTTP method)
        steps/            # Auto-execute in numeric filename order
          100-validate.js       # Executes 1st
          200-check-stock.js    # Executes 2nd
          300-create-order.js   # Executes 3rd
        async-tasks/      # Execute asynchronously after response
          send-email.js
          send-push.js
```

`index.js` is **optional**. Features are automatically created from folder structure alone.

**Folder Structure (Explicit Feature - when additional configuration needed):**
```
features/
  api/
    orders/
      @post/
        index.js          # ← Additional configuration like contextInitializer, middlewares
        steps/
          100-validate.js
          200-check-stock.js
        async-tasks/
          send-email.js
```

**When using index.js:**
```javascript
const numflow = require('numflow')

module.exports = numflow.feature({
  // Additional configuration (optional)
  contextInitializer: (ctx, req, res) => {
    ctx.startTime = Date.now()
  },
  middlewares: [authMiddleware, rateLimitMiddleware],
})
```

**Application Registration:**
```javascript
const numflow = require('numflow')
const app = numflow()

app.registerFeatures('./features')  // Auto-scan folder structure
app.listen(3000)
```

**Core Features:**

1. **Zero Configuration**
   - No need to create `index.js` file
   - APIs automatically generated from folder structure alone
   - HTTP method, path, steps, async-tasks all auto-inferred
   - Use `index.js` optionally only when additional configuration needed

2. **Auto-execution Order Based on Numeric Filenames**
   - Automatically execute in order: `100-`, `200-`, `300-`
   - Execution order clearly expressed in filenames
   - No separate configuration file needed

3. **Understand Business Logic from Folder Structure**
   - Understand entire flow without opening code
   - `features/api/orders/@post/steps/` → Processing steps for POST /api/orders
   - `@` prefix explicitly expresses HTTP method (prevents collision with resource names)
   - Each filename describes the role of that step

4. **Flexible Logic Management**
   - **Add**: Create `150-check-user-auth.js` and it automatically inserts and executes between 100 and 200
   - **Delete**: Remove step by deleting file
   - **Reorder**: Change execution order by changing filename numbers
   - Change logic structure without modifying existing code

**Why use `@` prefix:**

The `@` prefix explicitly distinguishes HTTP method folders to prevent collision with resource names.

```
# Collision occurs without @ prefix
features/workflows/[id]/steps/get/  # ← Is "steps" a resource or a folder?

# Clearly distinguished with @ prefix
features/workflows/[id]/steps/@get/  # ← GET /workflows/:id/steps
                          └─ resource name
                                └─ HTTP method
```

**Additional Folder Structure Examples:**
```
features/
  users/@get/              # GET /users
  users/@post/             # POST /users
  users/[id]/@get/         # GET /users/:id
  users/[id]/@put/         # PUT /users/:id
  users/[id]/@delete/      # DELETE /users/:id
  api/v1/orders/@post/     # POST /api/v1/orders
```

**Additional Features:**
- **Transaction Management**: Transaction management via `contextInitializer`, `onError` hooks
- **Auto-execute Async Tasks**: Automatic async-tasks execution after response
- **Centralized Error Handling**: Unified error handling with `onError` hook
- **Minimal Overhead**: 0.70% performance overhead (based on 10 steps)

### WebSocket Support

Numflow supports WebSocket with 100% Express compatibility.

```javascript
const numflow = require('numflow')
const { WebSocketServer } = require('ws')

const app = numflow()
const server = app.listen(3000)

// ws library
const wss = new WebSocketServer({ noServer: true })
server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request)
  })
})

// Socket.IO fully supported
const io = require('socket.io')(server)
io.on('connection', (socket) => {
  socket.emit('welcome', { message: 'Connected!' })
})
```

### Full ESM and CommonJS Support

Numflow perfectly supports all module systems.

```javascript
// CommonJS
const numflow = require('numflow')

// ESM
import numflow from 'numflow'

// TypeScript
import numflow from 'numflow'
import type { Application, Request, Response } from 'numflow'
```

All file extensions supported:
- `.js`, `.cjs` (CommonJS)
- `.mjs`, `.mts` (ESM)
- `.ts` (TypeScript)

---

## Installation

```bash
npm install numflow
```

---

## Quick Start

### Hello World (JavaScript)

**CommonJS:**
```javascript
const numflow = require('numflow')
const app = numflow()

app.get('/', (req, res) => {
  res.json({ message: 'Hello Numflow' })
})

app.listen(3000)
```

**ESM:**
```javascript
import numflow from 'numflow'
const app = numflow()

app.get('/', (req, res) => {
  res.json({ message: 'Hello Numflow' })
})

app.listen(3000)
```

### TypeScript

```typescript
import numflow from 'numflow'
const app = numflow()

app.get('/', (req, res) => {
  res.json({ message: 'Hello Numflow' })
})

app.listen(3000)
```

---

## Migration from Express

### Step 1: Install Package

```bash
npm install numflow
```

### Step 2: Change Import Statement

```javascript
// Before
const express = require('express')

// After
const numflow = require('numflow')
```

### Step 3: Done

The rest of your code works without modification.

**Compatible items:**
- All HTTP methods (GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD)
- All middleware
- req.params, req.query, req.body
- res.json(), res.send(), res.status(), res.redirect()
- Router, app.use(), app.all()
- express.static()

**Verification status:**
- 1,018 tests passing 100%
- Express 5.x API compatibility verified
- Major middleware compatibility verified

---

## Feature-First Usage Examples

### Order Creation API

**Simplest Method (index.js not required):**
```
features/
  api/
    orders/
      @post/
        steps/
          100-validate-request.js
          200-check-user-auth.js
          300-check-product-stock.js
          400-create-order.js
          500-process-payment.js
        async-tasks/
          send-order-email.js
          send-push-notification.js
          update-analytics.js
```

The `POST /api/orders` API is automatically created from folder structure alone.

**When Additional Configuration Needed (using index.js):**
```
features/
  api/
    orders/
      @post/
        index.js          # ← Additional configuration (contextInitializer, middlewares, onError Hook)
        steps/
          ...
```

**features/api/orders/@post/index.js:**
```javascript
const numflow = require('numflow')

module.exports = numflow.feature({
  // method, path, steps, asyncTasks are auto-inferred from folder structure
  // Add configuration only when needed
  contextInitializer: (ctx, req, res) => {
    ctx.startTime = Date.now()
    ctx.userId = req.user?.id
  },
})
```

**steps/100-validate-request.js:**
```javascript
module.exports = async (ctx, req, res) => {
  const { productId, quantity } = req.body

  if (!productId || !quantity) {
    throw new Error('productId and quantity are required')
  }

  ctx.productId = productId
  ctx.quantity = quantity
}
```

**steps/300-check-product-stock.js:**
```javascript
module.exports = async (ctx, req, res) => {
  const product = await db.products.findById(ctx.productId)

  if (product.stock < ctx.quantity) {
    throw new Error('Insufficient stock')
  }

  ctx.product = product
}
```

**steps/400-create-order.js:**
```javascript
module.exports = async (ctx, req, res) => {
  const order = await db.orders.create({
    userId: req.user.id,
    productId: ctx.productId,
    quantity: ctx.quantity,
    totalPrice: ctx.product.price * ctx.quantity,
  })

  ctx.order = order
  res.json({ success: true, orderId: order.id })
}
```

**async-tasks/send-order-email.js:**
```javascript
module.exports = async (ctx) => {
  await emailService.send({
    to: ctx.order.userEmail,
    template: 'order-confirmation',
    data: { order: ctx.order },
  })
}
```

**app.js:**
```javascript
const numflow = require('numflow')
const app = numflow()

app.registerFeatures('./features')
app.listen(3000)
```

### Flexible Logic Management Example

**Scenario: Adding Authorization Check Logic**

When you need to add a new step between existing logic:

```
# Existing structure
steps/
  100-validate-request.js
  300-check-product-stock.js
  400-create-order.js

# Insert logic by adding new file only
steps/
  100-validate-request.js
  200-check-user-auth.js      # ← Newly added (no modification to existing code)
  300-check-product-stock.js
  400-create-order.js
```

**Create steps/200-check-user-auth.js:**
```javascript
module.exports = async (ctx, req, res) => {
  if (!req.user || !req.user.isActive) {
    throw new Error('Unauthorized')
  }

  ctx.userId = req.user.id
}
```

Just restart server and it automatically executes in order: 100 → 200 → 300 → 400.

**Delete Logic:**
```bash
# Remove stock check step
rm steps/300-check-product-stock.js
# Restart server → automatically executes in order: 100 → 200 → 400
```

**Change Execution Order:**
```bash
# When you want to execute payment before order creation
mv steps/500-process-payment.js steps/350-process-payment.js
mv steps/400-create-order.js steps/450-create-order.js
# Restart server → executes in order: 100 → 200 → 300 → 350(payment) → 450(order)
```

---

## Performance Benchmarks

### Test Environment

- Node.js v22.11.0
- macOS (Apple Silicon)
- Autocannon (100 connections, 10s duration)

### Overall Results

| Scenario | Express | Numflow | Fastify | vs Express | vs Fastify |
|---------|---------|---------|---------|-----------|-----------|
| Hello World | 20,542 req/s | 75,626 req/s | 89,108 req/s | +268% | -15% |
| JSON Response (GET) | 20,421 req/s | 65,574 req/s | 86,607 req/s | +221% | -24% |
| JSON Parse (POST) | 18,151 req/s | 57,872 req/s | 51,664 req/s | +219% | +12% ⭐ |
| Route Params (single) | 19,790 req/s | 65,734 req/s | 84,025 req/s | +232% | -22% |
| Route Params (multiple) | 19,982 req/s | 62,387 req/s | 80,992 req/s | +212% | -23% |
| Route + Query | 19,893 req/s | 61,988 req/s | 85,082 req/s | +212% | -27% |
| Middleware Chain | 19,080 req/s | 63,254 req/s | 83,837 req/s | +232% | -25% |
| **Average** | **19,694 req/s** | **64,634 req/s** | **80,188 req/s** | **+228%** | **-19%** |

### Feature-First Performance

The performance overhead of Feature-First architecture is only **0.70%**, which is negligible:

- Regular Route: 49,714 req/s
- Feature (10 Steps): 49,366 req/s
- **Overhead: 0.70%** (based on 10 steps)

You can structure complex business logic with almost no performance loss.

For detailed benchmark results, see [PERFORMANCE.md](docs/en/PERFORMANCE.md)

---

## Testing and Verification

### Tests

- 1,018 tests passing 100%
- Core functionality tests
- Express compatibility tests
- Middleware compatibility tests
- Feature-First integration tests
- Performance regression tests

### Express Compatibility

- Express 5.x API 100% compatible
- Major Express middleware verified
- Validated with 1,018 tests

Detailed compatibility info: [COMPATIBILITY.md](docs/en/COMPATIBILITY.md)

---

## Documentation

### Getting Started

- [Getting Started](docs/en/getting-started/README.md) - Beginner's guide
- [First App](docs/en/getting-started/first-app.md) - Create your first Numflow app
- [Project Structure Guide](docs/en/getting-started/project-structure.md) - Scalable project structure

### Advanced

- [Feature-First Guide](docs/en/getting-started/feature-first.md) - Structuring complex logic
- [Routing](docs/en/getting-started/routing.md) - Complete routing guide
- [Middleware](docs/en/getting-started/middleware.md) - Using middleware
- [Error Handling](docs/en/getting-started/error-handling.md) - Error handling strategies
- [API Documentation](docs/en/api) - Complete API reference
- [Architecture Design](docs/en/ARCHITECTURE.md) - Internal structure

### Performance

- [Performance Comparison](docs/en/PERFORMANCE.md) - Performance optimization techniques

### Compatibility

- [Express Compatibility](docs/en/COMPATIBILITY.md) - Express compatibility details

---

## Showcase

### Real-World Examples

Check out real-world projects built with Numflow's Feature-First architecture:

#### 📝 [Numflow Feature-First Blog](https://github.com/gazerkr/numflow-feature-first-blog)

A fully functional blog application built with Feature-First architecture. It implements the following features:

- Post CRUD (Create, Read, Update, Delete)
- Comment system
- User authentication and authorization
- File upload (images)
- Pagination
- Search functionality

What you can learn from this example:
- How to design Feature-First folder structure
- How to structure business logic with Steps and Async Tasks
- Data sharing using Context
- Transaction management and error handling patterns

---

## Contributing

Issue reports, feature suggestions, documentation improvements, and code contributions are welcome.

- Bug reports: [Issues](https://github.com/gazerkr/numflow/issues)
- Feature suggestions: [Issues](https://github.com/gazerkr/numflow/issues)
- Pull Requests: [Pull Requests](https://github.com/gazerkr/numflow/pulls)

---

## FAQ

**Q: Is it 100% compatible with Express?**

A: Verified with 1,018 tests. All core APIs and major middleware of Express 5.x are compatible.

**Q: Is Feature-First mandatory?**

A: It's optional. You can use it with Express-style only.

**Q: Is TypeScript required?**

A: No. JavaScript (CommonJS/ESM) is fully supported. TypeScript is optional.

**Q: Is the 3.3x faster performance the same in production environments?**

A: Benchmark results show 3.3x (228%) on average. Actual performance may vary depending on application structure, middleware usage, and business logic.

**Q: What's the difference from Fastify?**

A: Fastify uses its own API. Numflow maintains Express API while providing performance close to Fastify.

---

## License

MIT License

---

## Acknowledgements

Special thanks to my wife Carol for her unwavering support and encouragement throughout this project.

I am also grateful to my family for their patience and understanding during the development of this framework.

---

## References

This project was inspired by ideas from the following projects:

- [Express.js](https://expressjs.com/) - API compatibility
- [Fastify](https://www.fastify.io/) - Performance optimization
- [find-my-way](https://github.com/delvedor/find-my-way) - Radix Tree routing
