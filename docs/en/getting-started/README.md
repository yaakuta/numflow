# Getting Started with Numflow

A step-by-step guide to getting started with the Numflow framework.

> **Note**: This document includes only currently implemented features and will be updated as new features are added.
>
> **Current Status**: Implementation Complete (res.download(), res.jsonp() added) ✅

---

## 📑 Table of Contents

### Getting Started
- **[Installation & First Application](./first-app.md)** - Installation, Hello World, module systems
- **[Express Migration](./migration-from-express.md)** ⭐ - Complete guide to migrating Express apps to Numflow

### Core Features
- **[Routing](./routing.md)** - HTTP methods, route parameters, query parameters
- **[Request/Response API](./request-response.md)** - Request/Response objects, Body Parser
- **[Middleware](./middleware.md)** - Global/route-specific middleware, error middleware
- **[Error Handling](./error-handling.md)** - Automatic error catching, global error handler

### Advanced Features
- **[Feature-First](./feature-first.md)** ⭐ - Auto-execution system, Step functions
- **[Async Tasks](./async-tasks.md)** - Automatic async task execution
- **[Project Structure](./project-structure.md)** - Structure patterns, Best Practices

### Development Environment
- **[Debug Mode](./debug-mode.md)** 🐛 - Feature debugging, Context tracking
- **[TypeScript](./typescript.md)** - TypeScript configuration

---

## Quick Start

```javascript
const numflow = require('numflow')
const app = numflow()

// Register routes
app.get('/', (req, res) => {
  res.json({ message: 'Hello Numflow!' })
})

// Error handling
app.onError((err, req, res) => {
  res.status(err.statusCode || 500).json({
    error: err.message
  })
})

// Start server
app.listen(3000, () => {
  console.log('Server running on port 3000')
})
```

---

## Next Steps

- **[API Reference](../api/)** - Complete API documentation
- **[Architecture](../ARCHITECTURE.md)** - Design principles
- **[Performance Guide](../PERFORMANCE.md)** - Performance optimization and benchmarks
- **[Examples](../../examples/)** - Practical example code

---

**Last Updated**: 2025-11-11 (Documentation consolidation)
