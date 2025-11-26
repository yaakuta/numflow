# Error Handling

Numflow provides simple Express-style error handling.

## Table of Contents

- [Basic Error Handling](#basic-error-handling)
- [Setting statusCode](#setting-statuscode)
- [Feature's onError Handler](#features-onerror-handler)
- [Global Error Handler](#global-error-handler)
- [Checking Step Information](#checking-step-information)
- [Accessing Original Error](#accessing-original-error)
- [Retry](#retry)
- [Development vs Production](#development-vs-production)

---

## Basic Error Handling

When you throw an error in a Step, it's automatically handled.

```javascript
// features/api/users/@get/steps/100-fetch.js
module.exports = async (ctx, req, res) => {
  const user = await db.findUser(req.params.id)

  if (!user) {
    throw new Error('User not found')  // Handled as 500 error
  }

  ctx.user = user
}
```

**Automatic Response (500 Internal Server Error):**
```json
{
  "error": {
    "message": "User not found",
    "statusCode": 500
  }
}
```

---

## Setting statusCode

Add a `statusCode` property to the error to respond with that status code.

```javascript
// features/api/users/@get/steps/100-fetch.js
module.exports = async (ctx, req, res) => {
  const user = await db.findUser(req.params.id)

  if (!user) {
    const error = new Error('User not found')
    error.statusCode = 404  // Respond with 404
    throw error
  }

  ctx.user = user
}
```

**Response (404 Not Found):**
```json
{
  "error": {
    "message": "User not found",
    "statusCode": 404
  }
}
```

### Creating Helper Functions

To reduce repetitive code, create helper functions:

```javascript
// utils/errors.js
function createError(message, statusCode) {
  const error = new Error(message)
  error.statusCode = statusCode
  return error
}

module.exports = { createError }
```

```javascript
// Using in Step
const { createError } = require('../../utils/errors')

module.exports = async (ctx, req, res) => {
  const user = await db.findUser(req.params.id)

  if (!user) {
    throw createError('User not found', 404)
  }

  ctx.user = user
}
```

---

## Feature's onError Handler

You can handle errors per Feature. **Has access to ctx** for transaction rollback, etc.

```javascript
// features/api/orders/@post/index.js
const numflow = require('numflow')

module.exports = numflow.feature({
  contextInitializer: async (ctx, req, res) => {
    ctx.transaction = await db.beginTransaction()
  },

  onError: async (error, ctx, req, res) => {
    console.log('Error occurred:', error.message)

    // Rollback transaction
    if (ctx.transaction) {
      await ctx.transaction.rollback()
    }

    // Send response directly
    const statusCode = error.statusCode || 500
    res.statusCode = statusCode
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({
      success: false,
      error: error.message
    }))
  }
})
```

### Delegating to Global Handler from onError

```javascript
// features/api/orders/@post/index.js
module.exports = numflow.feature({
  onError: async (error, ctx, req, res) => {
    // Only perform transaction rollback
    if (ctx.transaction) {
      await ctx.transaction.rollback()
    }

    // Delegate to global handler
    throw error
  }
})
```

---

## Global Error Handler

Handle all errors from routes and Features in one place using Express-style error middleware.

```javascript
// app.js
const numflow = require('numflow')
const app = numflow()

// Global error handler (Express-style with 4 parameters)
app.use((err, req, res, next) => {
  console.error('Error:', err.message)

  const statusCode = err.statusCode || 500

  res.status(statusCode).json({
    success: false,
    error: err.message
  })
})

app.registerFeatures('./features')
app.listen(3000)
```

**Important:** Error middleware must have exactly 4 parameters: `(err, req, res, next)`. This is how Numflow (and Express) distinguishes error middleware from regular middleware.

---

## Checking Step Information

When an error occurs in a Feature, it's automatically wrapped in a **FeatureError** that includes Step information.

```javascript
// Check Step info in error middleware
app.use((err, req, res, next) => {
  // FeatureError includes step info
  if (err.step) {
    console.error(`Error location: Step ${err.step.number} (${err.step.name})`)
    // Output: Error location: Step 300 (300-check-stock.js)
  }

  const statusCode = err.statusCode || 500
  res.status(statusCode).json({
    error: err.message,
    ...(err.step && { step: err.step })  // Include step info in response
  })
})
```

**Error Response Example:**
```json
{
  "error": "Out of stock",
  "step": {
    "number": 300,
    "name": "300-check-stock.js"
  }
}
```

---

## Accessing Original Error

FeatureError preserves the original error in the `originalError` property. You can access it directly.

```javascript
app.use((err, req, res, next) => {
  // Direct access to original error
  const originalError = err.originalError || err

  // Access custom properties from original error
  const statusCode = originalError.statusCode || 500
  const code = originalError.code  // Custom code property

  res.status(statusCode).json({
    error: originalError.message,
    ...(code && { code })
  })
})
```

---

## Retry

Return `numflow.retry()` from `onError` to retry the Feature.

```javascript
// features/api/chat/@post/index.js
const numflow = require('numflow')

module.exports = numflow.feature({
  contextInitializer: (ctx, req, res) => {
    ctx.provider = 'openai'
    ctx.retryCount = 0
  },

  onError: async (error, ctx, req, res) => {
    // Rate limit error -> Change provider and retry
    if (error.message.includes('rate_limit')) {
      const providers = ['openai', 'anthropic', 'gemini']
      const currentIndex = providers.indexOf(ctx.provider)

      if (currentIndex < providers.length - 1) {
        ctx.provider = providers[currentIndex + 1]
        return numflow.retry({ delay: 500 })  // Retry after 0.5s
      }
    }

    // Timeout error -> Exponential backoff
    if (error.message.includes('timeout')) {
      ctx.retryCount++
      if (ctx.retryCount <= 3) {
        const delay = 1000 * Math.pow(2, ctx.retryCount - 1)  // 1s, 2s, 4s
        return numflow.retry({ delay, maxAttempts: 3 })
      }
    }

    // Cannot retry -> Delegate to global handler
    throw error
  }
})
```

**retry() Options:**
- `delay`: Wait time before retry (ms)
- `maxAttempts`: Maximum retry attempts

---

## Development vs Production

```javascript
// app.js
const numflow = require('numflow')
const app = numflow()

const isProd = process.env.NODE_ENV === 'production'

app.use((err, req, res, next) => {
  // Logging
  if (isProd) {
    // Production: send to external service
    errorTracker.capture(err, { req })
  } else {
    // Development: console output
    console.error(err.stack)
  }

  // Response
  const statusCode = err.statusCode || 500

  res.status(statusCode).json({
    success: false,
    error: isProd ? 'Internal Server Error' : err.message,
    // Include stack only in development
    ...(!isProd && { stack: err.stack })
  })
})
```

---

## Summary

| Handler | Scope | ctx Access | Purpose |
|---------|-------|------------|---------|
| **Feature onError** | Feature only | Yes | Transaction rollback, retry |
| **Error Middleware** | Entire app | No | Unified logging, response format |

---

## Error Handling Flow

```
Step throws new Error()
         |
    Does Feature have onError?
         |
    +----+----+
   Yes        No
    |          |
onError()   Wrap with FeatureError (includes step info)
runs          |
    |      Pass to error middleware
    |
    +-- Send response (res.json/end)
    |   -> Done (error middleware not called)
    |
    +-- Return numflow.retry()
    |   -> Retry Feature
    |
    +-- throw error
        -> Pass to error middleware (app.use with 4 params)
```

---

**Last Updated**: 2025-11-27 (Simplified to Express-style, removed getOriginalError())

**Previous**: [Table of Contents](./README.md)
