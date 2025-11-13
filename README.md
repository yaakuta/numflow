# Numflow

> High-performance Node.js web framework with Express 5.x compatibility

Numflow is a Node.js web framework that is fully compatible with Express 5.x API while providing 3x faster performance on average.

[![npm version](https://img.shields.io/npm/v/numflow.svg)](https://www.npmjs.com/package/numflow)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Tests: 779 passing](https://img.shields.io/badge/tests-779%20passing-brightgreen.svg)](https://github.com/gazerkr/numflow)

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

Radix Tree-based routing provides 211% faster performance compared to Express on average.

| Scenario | Express | Numflow | Fastify |
|---------|---------|---------|---------|
| Hello World | 15,041 req/s | 54,922 req/s | 52,191 req/s |
| JSON Response (GET) | 14,383 req/s | 43,923 req/s | 53,043 req/s |
| JSON Parse (POST) | 12,422 req/s | 36,682 req/s | 32,339 req/s |
| Average | 14,124 req/s | 43,865 req/s | 49,030 req/s |

Performance improvements:
- vs Express: +211% (3x faster on average)
- vs Fastify: -11% (Numflow is faster in some scenarios)

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
- **Zero Configuration**: API generation from folder structure without `index.js`
- **Convention over Configuration**: Auto-infer HTTP method, path, execution order from folder structure
- **Transaction Management Structure**: Transaction management via `contextInitializer`, `onError` hooks
- **Auto-execute Async Tasks**: Automatic async-tasks execution after response
- **Centralized Error Handling**: Unified error handling with `onError` hook
- **Minimal Overhead**: 1.02% performance overhead (based on 10 steps)

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
- 779 tests passing 100%
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
| Hello World | 15,041 | 54,922 | 52,191 | +265% | +5% |
| JSON Response (GET) | 14,383 | 43,923 | 53,043 | +205% | -17% |
| JSON Parse (POST) | 12,422 | 36,682 | 32,339 | +195% | +13% |
| Route Parameters (single) | 13,467 | 44,929 | 52,106 | +234% | -14% |
| Route Parameters (multiple) | 14,832 | 43,076 | 52,691 | +190% | -18% |
| Route + Query | 14,404 | 42,220 | 48,525 | +193% | -13% |
| Middleware Chain (4) | 14,321 | 41,305 | 52,316 | +188% | -21% |
| **Average** | **14,124** | **43,865** | **49,030** | **+211%** | **-11%** |

*Unit: req/s (Requests per second)*

### Feature-First Performance

| Scenario | Requests/sec | vs Regular Route |
|---------|--------------|------------------|
| Feature-First (10 Steps) | 35,571 | -1.02% |
| Feature-First (50 Steps) | 28,462 | -20% |
| Regular Route | 35,937 | baseline |

### Key Results

- 3x faster than Express on average (+211%)
- Similar performance class to Fastify (-11%)
- Faster than Fastify in Hello World and JSON Parse
- Feature-First overhead 1.02% (10 steps)

For detailed benchmark results, see [PERFORMANCE.md](docs/en/PERFORMANCE.md)

---

## Testing and Verification

### Tests

- 779 tests passing 100%
- Core functionality tests
- Express compatibility tests
- Middleware compatibility tests
- Feature-First integration tests
- Performance regression tests

### Express Compatibility

- Express 5.x API 100% compatible
- Major Express middleware verified
- Validated with 779 tests

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

## Contributing

Issue reports, feature suggestions, documentation improvements, and code contributions are welcome.

- Bug reports: [Issues](https://github.com/gazerkr/numflow/issues)
- Feature suggestions: [Issues](https://github.com/gazerkr/numflow/issues)
- Pull Requests: [Pull Requests](https://github.com/gazerkr/numflow/pulls)

---

## FAQ

**Q: Is it 100% compatible with Express?**

A: Verified with 779 tests. All core APIs and major middleware of Express 5.x are compatible.

**Q: Is Feature-First mandatory?**

A: It's optional. You can use it with Express-style only.

**Q: Is TypeScript required?**

A: No. JavaScript (CommonJS/ESM) is fully supported. TypeScript is optional.

**Q: Is the 3x faster performance the same in production environments?**

A: Benchmark results show 3x (211%) on average. Actual performance may vary depending on application structure, middleware usage, and business logic.

**Q: What's the difference from Fastify?**

A: Fastify uses its own API. Numflow maintains Express API while providing performance close to Fastify.

---

## License

MIT License

---

## References

This project was inspired by ideas from the following projects:

- [Express.js](https://expressjs.com/) - API compatibility
- [Fastify](https://www.fastify.io/) - Performance optimization
- [find-my-way](https://github.com/delvedor/find-my-way) - Radix Tree routing
