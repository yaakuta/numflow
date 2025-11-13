# Error Handling

Learn about Numflow's unified error handling system.

## 📚 Learning Objectives

- Writing custom error classes
- Global error handlers
- Synchronous/asynchronous error handling
- Feature error handling
- Production vs development environment error responses

## 💡 Core Concepts

### Error Middleware

Error middleware requires exactly 4 parameters:

```javascript
app.use((err, req, res, next) => {
  console.error(err)

  res.status(err.statusCode || 500).json({
    success: false,
    error: {
      message: err.message,
      statusCode: err.statusCode || 500,
    },
  })
})
```

### Custom Error Classes

```javascript
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = true
    Error.captureStackTrace(this, this.constructor)
  }
}

class ValidationError extends AppError {
  constructor(message) {
    super(message, 400)
    this.name = 'ValidationError'
  }
}

class NotFoundError extends AppError {
  constructor(resource) {
    super(`${resource} not found.`, 404)
    this.name = 'NotFoundError'
  }
}
```

### Error Handling Patterns

#### 1. Synchronous Errors

```javascript
app.get('/sync-error', (req, res) => {
  throw new Error('Synchronous error occurred!')
  // Automatically passed to error middleware
})
```

#### 2. Asynchronous Errors

```javascript
app.get('/async-error', async (req, res, next) => {
  try {
    await someAsyncOperation()
    res.json({ success: true })
  } catch (error) {
    next(error) // Pass to error middleware
  }
})
```

#### 3. Feature Errors

```javascript
// features/api/data/@post/index.js
module.exports = feature({
  // method: 'POST' (auto-inferred from folder name)
  // path: '/api/data' (auto-inferred from folder structure)
  // steps: './steps' (auto-recognized)
})

// features/api/data/@post/steps/100-validate.js
module.exports = async (ctx, req, res) => {
  // Errors thrown in steps are automatically handled
  const { data } = req.body

  if (!data) {
    throw new ValidationError('Data is required.')
  }

  ctx.data = data
  ctx.validated = true
}
```

## 📖 Practical Patterns

### Unified Error Handler

```javascript
// Development environment
function developmentErrorHandler(err, req, res, next) {
  res.status(err.statusCode || 500).json({
    success: false,
    error: {
      message: err.message,
      statusCode: err.statusCode || 500,
      stack: err.stack, // Include stack trace
    },
  })
}

// Production environment
function productionErrorHandler(err, req, res, next) {
  if (err.isOperational) {
    // Expose message only for expected errors
    res.status(err.statusCode).json({
      success: false,
      error: {
        message: err.message,
        statusCode: err.statusCode,
      },
    })
  } else {
    // Replace unexpected errors with generic message
    res.status(500).json({
      success: false,
      error: {
        message: 'Server error occurred.',
        statusCode: 500,
      },
    })
  }
}

// Choose based on environment
const isDevelopment = process.env.NODE_ENV !== 'production'
app.use(isDevelopment ? developmentErrorHandler : productionErrorHandler)
```

### 404 Handler

```javascript
// Register after all routes
app.use((req, res, next) => {
  next(new NotFoundError(`${req.method} ${req.path}`))
})
```

## 🎯 Best Practices

1. **Use Custom Error Classes**: Separate classes for different error types
2. **isOperational Flag**: Distinguish between expected errors and bugs
3. **Environment-Specific Error Responses**: Separate development/production
4. **Error Logging**: Log all errors to logging system
5. **Register 404 Handler Last**: Execute only when no route matches

## Detailed Examples

For detailed examples, see:
- **[../03-middleware/04-error-middleware.js](../03-middleware/04-error-middleware.js)** - Detailed error middleware examples

## Next Steps

- **[06-advanced](../06-advanced/)** - Advanced middleware
- **[07-feature-first](../07-feature-first/)** - Feature-First architecture
