# Error Handling

> Comprehensive error handling patterns and best practices

This document provides detailed information about Numflow's error handling system, including built-in error classes, error handlers, and best practices.

---

## Table of Contents

- [Overview](#overview)
- [Built-in Error Classes](#built-in-error-classes)
- [Error Handler Setup](#error-handler-setup)
- [Error Response Format](#error-response-format)
- [Feature-First Error Handling](#feature-first-error-handling)
- [Best Practices](#best-practices)
- [Environment-Specific Handling](#environment-specific-handling)

---

## Overview

Numflow provides a unified error handling system that works seamlessly with both regular routes and Feature-First patterns.

**Key Features:**
- **Built-in Error Classes**: HTTP status code-based error classes
- **Automatic Error Catching**: Async errors automatically caught
- **Type-Safe Error Handling**: Full TypeScript support
- **Helpful Error Messages**: Includes suggestions and documentation URLs
- **Operational vs Programming Errors**: Distinguish between expected and unexpected errors

---

## Built-in Error Classes

### HttpError Base Class

All Numflow error classes extend from `HttpError`:

```typescript
class HttpError extends Error {
  statusCode: number
  isOperational: boolean
  suggestion?: string
  docUrl?: string
}
```

**Properties:**
- `statusCode` - HTTP status code (400, 404, 500, etc.)
- `isOperational` - `true` if error is expected (won't crash server)
- `suggestion` - Helpful suggestion for fixing the error
- `docUrl` - Link to documentation

### 4xx Client Errors

#### ValidationError (400)

Validation failures for request data.

```javascript
const { ValidationError } = require('numflow')

app.post('/users', (req, res) => {
  const errors = validateUser(req.body)

  if (errors) {
    throw new ValidationError('Validation failed', {
      name: ['Name is required', 'Name must be at least 2 characters'],
      email: ['Invalid email format']
    })
  }

  res.json({ message: 'User created' })
})
```

**Response:**
```json
{
  "error": {
    "message": "Validation failed",
    "statusCode": 400,
    "validationErrors": {
      "name": ["Name is required", "Name must be at least 2 characters"],
      "email": ["Invalid email format"]
    },
    "suggestion": "Check the validationErrors field for details...",
    "docUrl": "https://numflow.dev/docs/errors#validation-error"
  }
}
```

#### BusinessError (400)

Business logic violations.

```javascript
const { BusinessError } = require('numflow')

app.post('/orders', async (req, res) => {
  const stock = await checkStock(req.body.productId)

  if (stock === 0) {
    throw new BusinessError('Product out of stock', 'OUT_OF_STOCK')
  }

  res.json({ message: 'Order created' })
})
```

**Response:**
```json
{
  "error": {
    "message": "Product out of stock",
    "statusCode": 400,
    "code": "OUT_OF_STOCK",
    "suggestion": "Review your request data..."
  }
}
```

#### UnauthorizedError (401)

Authentication failures.

```javascript
const { UnauthorizedError } = require('numflow')

app.get('/profile', (req, res) => {
  const token = req.get('Authorization')

  if (!token) {
    throw new UnauthorizedError('Missing authentication token')
  }

  res.json({ profile: getProfile(token) })
})
```

#### ForbiddenError (403)

Authorization failures (authenticated but no permission).

```javascript
const { ForbiddenError } = require('numflow')

app.delete('/users/:id', (req, res) => {
  if (!req.user.isAdmin) {
    throw new ForbiddenError('Only admins can delete users')
  }

  res.json({ message: 'User deleted' })
})
```

#### NotFoundError (404)

Resource not found.

```javascript
const { NotFoundError } = require('numflow')

app.get('/users/:id', async (req, res) => {
  const user = await findUser(req.params.id)

  if (!user) {
    throw new NotFoundError(`User ${req.params.id} not found`)
  }

  res.json(user)
})
```

#### ConflictError (409)

Resource conflicts (e.g., duplicate email).

```javascript
const { ConflictError } = require('numflow')

app.post('/users', async (req, res) => {
  const existing = await findUserByEmail(req.body.email)

  if (existing) {
    throw new ConflictError('Email already exists')
  }

  res.json({ message: 'User created' })
})
```

#### PayloadTooLargeError (413)

Request body exceeds size limit.

```javascript
const { PayloadTooLargeError } = require('numflow')

app.post('/upload', (req, res) => {
  if (req.body.size > MAX_SIZE) {
    throw new PayloadTooLargeError('File exceeds 10MB limit')
  }

  res.json({ message: 'Upload successful' })
})
```

#### TooManyRequestsError (429)

Rate limit exceeded.

```javascript
const { TooManyRequestsError } = require('numflow')

app.get('/api/data', (req, res) => {
  if (exceedsRateLimit(req.ip)) {
    throw new TooManyRequestsError('Rate limit exceeded', 60)
  }

  res.json({ data: [] })
})
```

**Response includes `retryAfter`:**
```json
{
  "error": {
    "message": "Rate limit exceeded",
    "statusCode": 429,
    "retryAfter": 60,
    "suggestion": "Rate limit exceeded. Please retry after 60 seconds."
  }
}
```

### 5xx Server Errors

#### InternalServerError (500)

Unexpected server errors.

```javascript
const { InternalServerError } = require('numflow')

app.get('/data', (req, res) => {
  try {
    const data = dangerousOperation()
    res.json(data)
  } catch (err) {
    throw new InternalServerError('Failed to process data')
  }
})
```

#### NotImplementedError (501)

Feature not yet implemented.

```javascript
const { NotImplementedError } = require('numflow')

app.get('/v2/users', (req, res) => {
  throw new NotImplementedError('API v2 is under development')
})
```

#### ServiceUnavailableError (503)

Service temporarily unavailable.

```javascript
const { ServiceUnavailableError } = require('numflow')

app.get('/data', (req, res) => {
  if (!isHealthy()) {
    throw new ServiceUnavailableError('Database maintenance in progress')
  }

  res.json({ data: [] })
})
```

---

## Error Handler Setup

### Global Error Handler

Register a global error handler with `app.onError()`:

```javascript
const numflow = require('numflow')
const { ValidationError, NotFoundError } = numflow

const app = numflow()

app.onError((err, req, res) => {
  console.error('Error occurred:', err)

  // Type-based error handling
  if (err instanceof ValidationError) {
    return res.status(400).json({
      error: err.message,
      validationErrors: err.validationErrors
    })
  }

  if (err instanceof NotFoundError) {
    return res.status(404).json({ error: err.message })
  }

  // Default: Internal Server Error
  res.status(500).json({ error: 'Internal Server Error' })
})
```

### Default Error Handler

If no custom error handler is registered, Numflow uses a default handler:

**Development Mode:**
```json
{
  "error": {
    "message": "Error message",
    "statusCode": 500,
    "stack": "Error: ...\n    at ..."
  }
}
```

**Production Mode (no stack trace):**
```json
{
  "error": {
    "message": "Error message",
    "statusCode": 500
  }
}
```

### Automatic Async Error Catching

Numflow automatically catches async errors:

```javascript
// ✅ No try-catch needed!
app.get('/users/:id', async (req, res) => {
  const user = await db.findUser(req.params.id) // Can throw
  res.json(user)
})

// Internally wrapped:
app.get('/users/:id', asyncWrapper(async (req, res, next) => {
  try {
    const user = await db.findUser(req.params.id)
    res.json(user)
  } catch (err) {
    next(err) // Automatically passed to error handler
  }
}))
```

---

## Error Response Format

### Standard Error Response

```typescript
interface ErrorResponse {
  error: {
    message: string
    statusCode: number
    code?: string                    // BusinessError
    stack?: string                   // Development mode only
    validationErrors?: Record<string, string[]>  // ValidationError
    step?: {                         // FeatureExecutionError
      number: number
      name: string
    }
    suggestion?: string              // Helpful suggestion
    docUrl?: string                  // Documentation link
  }
}
```

### Example Responses

**ValidationError:**
```json
{
  "error": {
    "message": "Validation failed",
    "statusCode": 400,
    "validationErrors": {
      "email": ["Invalid email format"],
      "age": ["Must be at least 18"]
    },
    "suggestion": "Check the validationErrors field...",
    "docUrl": "https://numflow.dev/docs/errors#validation-error"
  }
}
```

**NotFoundError:**
```json
{
  "error": {
    "message": "User not found",
    "statusCode": 404,
    "suggestion": "Check the URL path and ensure the requested resource exists.",
    "docUrl": "https://numflow.dev/docs/errors#not-found-error"
  }
}
```

**FeatureExecutionError:**
```json
{
  "error": {
    "message": "Failed to create order",
    "statusCode": 500,
    "step": {
      "number": 200,
      "name": "check-inventory"
    },
    "suggestion": "Error occurred in step 200 (check-inventory)..."
  }
}
```

---

## Custom Error Handling with originalError Preservation

Numflow **automatically preserves the original error** when wrapping errors from steps in FeatureError. This means all custom properties (`code`, `validationErrors`, etc.) are retained and accessible.

### Throwing Custom Errors in Steps

Simply throw errors in your steps - all custom properties are automatically preserved:

```javascript
// features/api/orders/post/steps/100-check-stock.js
const { BusinessError } = require('numflow')

module.exports = async (ctx, req, res) => {
  const stock = await db.getStock(ctx.productId)

  if (stock === 0) {
    // ✅ The 'code' property is automatically preserved!
    throw new BusinessError('Out of stock', 'OUT_OF_STOCK')
  }

  ctx.stockLevel = stock
}
```

**Automatic Response:**
```json
{
  "error": {
    "message": "Out of stock",
    "statusCode": 400,
    "code": "OUT_OF_STOCK",
    "step": {
      "number": 100,
      "name": "100-check-stock.js"
    }
  }
}
```

### Accessing originalError in onError

Access custom properties through `error.originalError` in Feature's `onError` handler:

```javascript
// features/api/payments/post/index.js
const numflow = require('numflow')

module.exports = numflow.feature({
  onError: async (error, ctx, req, res) => {
    // ✅ Check error code via originalError.code
    if (error.originalError && error.originalError.code === 'NETWORK_ERROR') {
      // Switch to fallback provider and retry
      ctx.fallbackProvider = 'backup'
      return numflow.retry({ delay: 10, maxAttempts: 2 })
    }

    // ✅ Access originalError.validationErrors
    if (error.originalError && error.originalError.validationErrors) {
      res.statusCode = 400
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({
        success: false,
        errors: error.originalError.validationErrors
      }))
      return
    }

    // Default error response
    res.statusCode = 500
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: error.message }))
  }
})
```

### Creating Custom Error Classes

Extend HttpError to create your own error classes. **All custom properties are automatically included in the response:**

```javascript
// errors/PaymentError.js
const { HttpError } = require('numflow')

class PaymentError extends HttpError {
  constructor(message, transactionId, provider) {
    super(message, 400)
    this.transactionId = transactionId  // Custom property 1
    this.provider = provider            // Custom property 2
    this.retryable = true               // Custom property 3
  }
}

module.exports = PaymentError
```

**Using in Steps:**
```javascript
// features/api/orders/get/steps/100-fetch.js
const PaymentError = require('../../../../errors/PaymentError.js')

module.exports = async (ctx, req, res) => {
  const result = await processPayment()

  if (!result.success) {
    throw new PaymentError('Payment failed', 'tx_123', 'stripe')
  }
}
```

**Automatic Response (All custom properties included!):**
```json
{
  "error": {
    "message": "Payment failed",
    "statusCode": 400,
    "transactionId": "tx_123",
    "provider": "stripe",
    "retryable": true,
    "step": {
      "number": 100,
      "name": "100-fetch.js"
    }
  }
}
```

### Using Custom Properties in onError

```javascript
// features/api/orders/get/index.js
const numflow = require('numflow')

module.exports = numflow.feature({
  onError: async (error, ctx, req, res) => {
    // ✅ Access all custom error properties!
    if (error.originalError && error.originalError.transactionId) {
      res.statusCode = 400
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({
        success: false,
        transactionId: error.originalError.transactionId,
        provider: error.originalError.provider,
        retryable: error.originalError.retryable
      }))
      return
    }
  }
})
```

### Key Benefits

✅ **Automatic Property Preservation**: All custom properties from thrown errors are automatically preserved
✅ **onError Access**: Access all custom properties through `error.originalError`
✅ **Retry Logic**: Implement conditional retry based on error codes
✅ **Scalable**: Create new custom errors without modifying framework code (works automatically!)
✅ **Global Response**: Global error handler automatically includes custom properties

### Important Notes

⚠️ **Standard Error Properties Excluded**: `message`, `stack`, `name` are automatically excluded (prevents duplication)
⚠️ **onError Priority**: If onError sends a response directly, the global error handler won't run

---

## Feature-First Error Handling

### onError Handler

Feature-First provides an `onError` handler for transaction rollback and custom error handling:

```javascript
const numflow = require('numflow')

module.exports = numflow.feature({
  steps: './steps',
  onError: async (error, context, req, res) => {
    // 1. Rollback transaction
    if (context.client) {
      await context.client.query('ROLLBACK')
      context.client.release()
    }

    // 2. Log error
    console.error('Order creation failed:', error)

    // 3. Send response
    res.statusCode = 500
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({
      error: error.message,
      orderId: context.orderId
    }))
  }
})
```

### Database-Specific Examples

#### PostgreSQL

```javascript
onError: async (error, context, req, res) => {
  if (context.client) {
    await context.client.query('ROLLBACK')
    context.client.release()
  }
  res.status(500).json({ error: error.message })
}
```

#### MongoDB

```javascript
onError: async (error, context, req, res) => {
  if (context.session) {
    await context.session.abortTransaction()
    context.session.endSession()
  }
  res.status(500).json({ error: error.message })
}
```

#### Prisma (automatic rollback)

```javascript
onError: async (error, context, req, res) => {
  // Prisma automatically rolls back on error
  res.status(500).json({ error: error.message })
}
```

### FeatureExecutionError

Numflow automatically wraps Feature step errors in `FeatureExecutionError`:

```javascript
// Step throws error
// steps/200-check-inventory.js
module.exports = async (context, req, res) => {
  if (context.stockLevel === 0) {
    throw new Error('Out of stock')
  }
}

// Wrapped in FeatureExecutionError
// Response:
{
  "error": {
    "message": "Out of stock",
    "statusCode": 500,
    "step": {
      "number": 200,
      "name": "check-inventory"
    },
    "suggestion": "Error occurred in step 200 (check-inventory)..."
  }
}
```

---

### onError and Global Error Handler Integration

Understanding how `onError` interacts with the global error handler (`app.onError` or `app.use((err, req, res, next) => {...})`) is crucial for proper error handling.

#### Error Flow Decision Tree

```
Step throws error
    ↓
Does Feature have onError?
    ├─ NO  → Automatically wrapped in FeatureExecutionError
    │         → Passed to Global Error Handler ✅
    │
    └─ YES → onError executes
              ↓
              What does onError return?
              ├─ Sends response (res.json/send/end)
              │   → Global Error Handler NOT executed ❌
              │
              ├─ Returns RETRY signal
              │   → Retry the Feature (no Global Error Handler)
              │
              └─ Throws error (throw error)
                  → Passed to Global Error Handler ✅
```

---

#### Pattern 1: onError Sends Response (Global Handler NOT Called)

When `onError` sends a response, the request ends immediately and the global error handler is **not executed**.

```javascript
// Feature configuration
const numflow = require('numflow')

module.exports = numflow.feature({
  onError: async (error, ctx, req, res) => {
    // Cleanup (e.g., rollback transaction)
    if (ctx.transaction) {
      await ctx.transaction.rollback()
    }

    // Send response → Global error handler NOT called
    res.status(500).json({
      error: error.message,
      orderId: ctx.orderId
    })

    // Implicit return → execution stops here
  }
})

// Global error handler
app.use((err, req, res, next) => {
  // ❌ This will NOT be executed!
  console.log('Global error handler:', err)
})
```

**Use Case:**
- Feature-specific error responses
- Custom error formats per Feature
- Different error handling logic per business domain

---

#### Pattern 2: onError Throws Error (Global Handler Called)

When `onError` throws an error, it's passed to the global error handler.

```javascript
// Feature configuration
const numflow = require('numflow')

module.exports = numflow.feature({
  onError: async (error, ctx, req, res) => {
    // Cleanup only (no response)
    if (ctx.transaction) {
      await ctx.transaction.rollback()
    }

    // Throw error → Passed to global error handler
    throw error
  }
})

// Global error handler
app.use((err, req, res, next) => {
  // ✅ This WILL be executed!
  console.log('Global error handler:', err)

  // Unified error logging
  logger.error('Error occurred', {
    message: err.message,
    stack: err.stack,
    path: req.path
  })

  // Unified error response
  res.status(err.statusCode || 500).json({
    error: err.message,
    code: err.code || 'INTERNAL_ERROR',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  })
})
```

**Use Case:**
- Centralized error logging
- Unified error response format
- Cleanup in Feature, response in global handler

---

#### Pattern 3: No onError (Global Handler Automatically Called)

When a Feature has no `onError` handler, errors are automatically passed to the global error handler.

**Source Code Reference:**
```typescript
// src/feature/index.ts (line 267-279)
// Pass to Global Error Handler if no custom error handler
// Wrap with FeatureExecutionError
throw new FeatureExecutionError(error as Error, step)
```

**Example:**

```javascript
// Feature configuration - NO onError
const numflow = require('numflow')

module.exports = numflow.feature({
  // No onError handler
  contextInitializer: (ctx, req, res) => {
    ctx.userId = req.user?.id
  }
})

// Step throws error
// steps/100-validate.js
const { ValidationError } = require('numflow')

module.exports = async (ctx, req, res) => {
  if (!ctx.userId) {
    throw new ValidationError('User ID is required', {
      userId: ['User must be authenticated']
    })
  }
}

// Global error handler
app.use((err, req, res, next) => {
  // ✅ This WILL be executed!
  // err is wrapped in FeatureExecutionError
  // err.originalError contains the ValidationError

  const original = err.originalError || err

  res.status(original.statusCode || 500).json({
    error: original.message,
    validationErrors: original.validationErrors,
    step: err.step  // { number: 100, name: "100-validate.js" }
  })
})
```

**Use Case:**
- Simple Features without cleanup logic
- Centralized error handling
- No transaction management needed

---

#### Comparison Table

| Pattern | onError Handler | Response Sent | Global Handler Called | Use Case |
|---------|-----------------|---------------|----------------------|----------|
| **1. Send Response** | ✅ Yes | In `onError` | ❌ **No** | Feature-specific error formats |
| **2. Throw Error** | ✅ Yes | In global handler | ✅ **Yes** | Cleanup in Feature + unified response |
| **3. No onError** | ❌ No | In global handler | ✅ **Yes** | Simple Features, centralized handling |

---

#### Best Practice Recommendations

**Recommended: Pattern 2 (Cleanup + Throw)**

```javascript
// Feature handles cleanup, global handler handles response
module.exports = numflow.feature({
  contextInitializer: async (ctx, req, res) => {
    ctx.transaction = await sequelize.transaction()
  },

  onError: async (error, ctx, req, res) => {
    // ✅ Cleanup only
    if (ctx.transaction) {
      await ctx.transaction.rollback()
    }

    // ✅ Throw to global handler
    throw error
  }
})

// Global handler: unified logging + response
app.use((err, req, res, next) => {
  // Centralized logging
  logger.error({
    message: err.message,
    path: req.path,
    userId: req.user?.id
  })

  // Centralized response format
  res.status(err.statusCode || 500).json({
    error: err.message,
    code: err.code
  })
})
```

**Benefits:**
- ✅ Separation of concerns (cleanup vs response)
- ✅ Centralized error logging
- ✅ Unified error response format
- ✅ Easy to maintain

---

#### Anti-Pattern: Response + Throw

**❌ Don't do this:**

```javascript
onError: async (error, ctx, req, res) => {
  await ctx.transaction.rollback()

  res.status(500).json({ error: error.message })  // ← Response sent

  throw error  // ← ❌ Throws after response!
  // Global handler executes but can't send response (headers already sent)
  // May cause "Error: Cannot set headers after they are sent" warnings
}
```

**✅ Do one of these:**

```javascript
// Option 1: Send response only
onError: async (error, ctx, req, res) => {
  await ctx.transaction.rollback()
  res.status(500).json({ error: error.message })
  return  // ← Explicit return (no throw)
}

// Option 2: Throw only (response in global handler)
onError: async (error, ctx, req, res) => {
  await ctx.transaction.rollback()
  throw error  // ← No response here
}
```

---

## Best Practices

### 1. Use Specific Error Classes

```javascript
// ❌ Generic Error
throw new Error('Invalid email')

// ✅ Specific Error Class
throw new ValidationError('Invalid email', {
  email: ['Email format is invalid']
})
```

### 2. Provide Helpful Error Messages

```javascript
// ❌ Vague message
throw new NotFoundError('Not found')

// ✅ Specific message
throw new NotFoundError(`User with ID ${userId} not found`)
```

### 3. Include Error Codes for Business Errors

```javascript
// ✅ Error codes help client handle errors
throw new BusinessError('Insufficient balance', 'INSUFFICIENT_BALANCE')
throw new BusinessError('Order already cancelled', 'ORDER_CANCELLED')
```

### 4. Log Errors Appropriately

```javascript
app.onError((err, req, res) => {
  // Operational errors: info level
  if (err.isOperational) {
    console.info(`[${err.statusCode}] ${err.message}`)
  } else {
    // Programming errors: error level
    console.error(`[500] ${err.message}`)
    console.error(err.stack)
  }

  res.status(err.statusCode || 500).json({ error: err.message })
})
```

### 5. Don't Expose Internal Details in Production

```javascript
app.onError((err, req, res) => {
  const isDevelopment = process.env.NODE_ENV !== 'production'

  res.status(err.statusCode || 500).json({
    error: isDevelopment ? err.message : 'Internal Server Error',
    stack: isDevelopment ? err.stack : undefined
  })
})
```

### 6. Use onError for Transaction Management

```javascript
// ✅ Feature onError for database transactions
module.exports = numflow.feature({
  steps: './steps',
  onError: async (error, context, req, res) => {
    // Rollback on any step failure
    if (context.txClient) {
      await context.txClient.query('ROLLBACK')
    }
    res.status(500).json({ error: error.message })
  }
})
```

---

## Environment-Specific Handling

### Development Mode

**Features:**
- Full stack traces included
- Detailed error messages
- All error properties exposed

```javascript
// Development: Detailed errors
{
  "error": {
    "message": "Cannot read property 'id' of undefined",
    "statusCode": 500,
    "stack": "TypeError: Cannot read property...\n    at ...",
    "suggestion": "Check your code for null/undefined access"
  }
}
```

### Production Mode

**Features:**
- No stack traces
- Generic error messages for unexpected errors
- Minimal information exposure

```javascript
// Production: Safe errors
{
  "error": {
    "message": "Internal Server Error",
    "statusCode": 500
  }
}
```

### Environment Configuration

```javascript
const app = numflow()

const isDevelopment = process.env.NODE_ENV !== 'production'

app.onError((err, req, res) => {
  const statusCode = err.statusCode || 500

  res.status(statusCode).json({
    error: {
      message: isDevelopment || err.isOperational
        ? err.message
        : 'Internal Server Error',
      statusCode,
      stack: isDevelopment ? err.stack : undefined,
      ...err.isOperational && {
        suggestion: err.suggestion,
        docUrl: err.docUrl
      }
    }
  })
})
```

---

## Error Utilities

### isHttpError()

Check if error is an HttpError:

```javascript
const { isHttpError } = require('numflow')

app.onError((err, req, res) => {
  if (isHttpError(err)) {
    res.status(err.statusCode).json({ error: err.message })
  } else {
    res.status(500).json({ error: 'Internal Server Error' })
  }
})
```

### isOperationalError()

Check if error is operational (expected):

```javascript
const { isOperationalError } = require('numflow')

app.onError((err, req, res) => {
  if (isOperationalError(err)) {
    console.info('Operational error:', err.message)
  } else {
    console.error('Programming error:', err.message)
    console.error(err.stack)
  }

  res.status(err.statusCode || 500).json({ error: err.message })
})
```

---

## Related Documentation

- [Getting Started Guide](../guides/getting-started.md)
- [Feature-First Guide](../guides/feature-first.md)
- [Application API](../api/application.md)
- [Request/Response API](../api/request.md)

---

*Last updated: 2025-11-17 (Added custom error originalError preservation feature)*
