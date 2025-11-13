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

*Last updated: 2025-10-20*
