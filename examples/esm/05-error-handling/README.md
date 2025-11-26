# 05-error-handling (ESM)

Numflow Error Handling & Retry - ES Modules version

## Error Handling Layers

```
Error occurs in Step
        |
Feature.onError() -> Can retry or handle
        |
Express Error Middleware -> Final fallback
app.use((err, req, res, next) => { ... })
```

## Retry Mechanism

```javascript
// In Feature onError
onError: async (error, ctx, req, res) => {
  if (error.message === 'NETWORK_ERROR') {
    return numflow.retry({
      maxAttempts: 3,
      delay: 1000
    })
  }
}
```

## Express-style Error Middleware

```javascript
// Standard Express error handling pattern
app.use((err, req, res, next) => {
  console.error('Error:', err.message)
  res.status(500).json({ error: err.message })
})
```

## Quick Start

```bash
npm install
npm start
```

## Test

```bash
# Try multiple times - 70% fail rate with auto-retry
curl -X POST http://localhost:3000/payments \
  -H "Content-Type: application/json" \
  -d '{"amount": 10000}'

# Watch console for retry logs
```

## Key Points

- Feature `onError` handles feature-specific errors
- Return `numflow.retry()` to automatically retry
- Express error middleware catches unhandled errors
- `res.headersSent` check prevents double response
