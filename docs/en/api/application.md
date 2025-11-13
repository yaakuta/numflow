# Application API Reference

> Complete reference for Numflow Application class

The `Application` class is the main entry point for creating Numflow applications.

---

## Table of Contents

- [Creating an Application](#creating-an-application)
- [Server Methods](#server-methods)
- [Routing Methods](#routing-methods)
- [Middleware Methods](#middleware-methods)
- [Feature Methods](#feature-methods)
- [Settings Methods](#settings-methods)
- [Properties](#properties)
- [Error Handling](#error-handling)

---

## Creating an Application

### numflow()

Creates a new Numflow application instance.

**Syntax:**
```javascript
const app = numflow()
```

**JavaScript (CommonJS):**
```javascript
const numflow = require('numflow')
const app = numflow()
```

**JavaScript (ESM):**
```javascript
import numflow from 'numflow'
const app = numflow()
```

**TypeScript:**
```typescript
import numflow, { Application } from 'numflow'
const app: Application = numflow()
```

**Returns:** `Application` instance

---

## Server Methods

### app.listen(port, [hostname], [backlog], [callback])

Starts the HTTP server and listens for connections. Automatically waits for all Feature registrations to complete if `app.registerFeatures()` was called.

**Parameters:**
- `port` (number): Port number to listen on
- `hostname` (string, optional): Hostname to bind to
- `backlog` (number, optional): Maximum length of the queue of pending connections
- `callback` (function, optional): Callback executed when server starts

**Examples:**
```javascript
// Basic usage
app.listen(3000)

// With callback
app.listen(3000, () => {
  console.log('Server running on port 3000')
})

// With hostname
app.listen(3000, 'localhost')

// With Feature auto-registration
app.registerFeatures('./features')
app.listen(3000, () => {
  console.log('Server started with all features registered')
})
```

**Returns:** `http.Server` instance

---

### app.close([callback])

Closes the HTTP server. Useful for graceful shutdown and testing.

**Parameters:**
- `callback` (function, optional): Callback executed when server closes

**Example:**
```javascript
const server = app.listen(3000)

// Graceful shutdown
process.on('SIGTERM', () => {
  app.close(() => {
    console.log('Server closed')
    process.exit(0)
  })
})
```

---

## Routing Methods

### app.get(path, ...handlers)

Registers a GET route handler.

**Parameters:**
- `path` (string): Route path (e.g., `/users`, `/users/:id`)
- `handlers` (RequestHandler[]): Route handlers (middleware + final handler)

**Examples:**
```javascript
// Simple route
app.get('/', (req, res) => {
  res.send('Hello World')
})

// Route with parameters
app.get('/users/:id', (req, res) => {
  res.json({ userId: req.params.id })
})

// Route with middleware
app.get('/admin', requireAuth, (req, res) => {
  res.json({ admin: true })
})

// Multiple middleware
app.get('/protected', auth, validator, handler)
```

**Returns:** `Application` (supports chaining)

**Note:** `app.get(key)` is also used to retrieve settings. See [Settings Methods](#settings-methods).

---

### app.post(path, ...handlers)

Registers a POST route handler.

**Example:**
```javascript
app.post('/users', (req, res) => {
  const user = req.body
  res.status(201).json({ user })
})
```

**Returns:** `Application`

---

### app.put(path, ...handlers)

Registers a PUT route handler.

**Example:**
```javascript
app.put('/users/:id', (req, res) => {
  res.json({ message: `User ${req.params.id} updated` })
})
```

**Returns:** `Application`

---

### app.delete(path, ...handlers)

Registers a DELETE route handler.

**Example:**
```javascript
app.delete('/users/:id', (req, res) => {
  res.json({ message: `User ${req.params.id} deleted` })
})
```

**Returns:** `Application`

---

### app.patch(path, ...handlers)

Registers a PATCH route handler.

**Example:**
```javascript
app.patch('/users/:id', (req, res) => {
  res.json({ message: `User ${req.params.id} patched` })
})
```

**Returns:** `Application`

---

### app.options(path, ...handlers)

Registers an OPTIONS route handler.

**Example:**
```javascript
app.options('/users', (req, res) => {
  res.setHeader('Allow', 'GET, POST, PUT, DELETE')
  res.status(204).send()
})
```

**Returns:** `Application`

---

### app.head(path, ...handlers)

Registers a HEAD route handler.

**Example:**
```javascript
app.head('/users', (req, res) => {
  res.setHeader('Content-Length', '1234')
  res.status(200).send()
})
```

**Returns:** `Application`

---

### app.all(path, ...handlers)

Registers a route handler for all HTTP methods.

**Example:**
```javascript
app.all('/ping', (req, res) => {
  res.json({
    message: 'pong',
    method: req.method
  })
})
```

**Returns:** `Application`

---

### app.route(path)

Creates a route chain for registering multiple HTTP methods on the same path.

**Example:**
```javascript
app.route('/users')
  .get((req, res) => {
    res.json({ users: [] })
  })
  .post((req, res) => {
    res.status(201).json({ message: 'User created' })
  })
  .put((req, res) => {
    res.json({ message: 'User updated' })
  })
  .delete((req, res) => {
    res.json({ message: 'User deleted' })
  })
```

**Returns:** `RouteChain` object

---

## Middleware Methods

### app.use([path], ...middleware)

Registers middleware or mounts a Router/Feature.

**Parameters:**
- `path` (string, optional): Path to apply middleware to
- `middleware` (RequestHandler | ErrorHandler | Router | Feature[]): Middleware function(s), Router, or Feature

**Examples:**

**Global middleware:**
```javascript
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`)
  next()
})
```

**Path-specific middleware:**
```javascript
app.use('/api', (req, res, next) => {
  console.log('API request')
  next()
})
```

**Multiple middleware:**
```javascript
app.use(logger, auth, validator)
app.use('/admin', adminAuth, adminLogger)
```

**Mount Router:**
```javascript
const apiRouter = numflow.Router()
app.use('/api', apiRouter)
```

**Mount Feature:**
```javascript
const createOrderFeature = numflow.feature({ ... })
app.use(createOrderFeature)
```

**Returns:** `Application` (supports chaining)

---

### app.disableBodyParser()

Disables automatic body parsing. Useful if you want to use custom body parsers.

**Example:**
```javascript
const app = numflow()
app.disableBodyParser()

// Use custom body parser
app.use(customBodyParser())
```

**Returns:** `Application`

---

### app.configureBodyParser(options)

Configures the built-in body parser.

**Parameters:**
- `options.limit` (string): Maximum request body size (default: `'1mb'`)

**Example:**
```javascript
app.configureBodyParser({
  limit: '10mb'
})
```

**Returns:** `Application`

---

## Feature Methods

### app.registerFeature(feature)

Registers a single Feature for auto-orchestration. The `app.listen()` method automatically waits for registration to complete.

**Parameters:**
- `feature` (Feature): Feature instance created with `numflow.feature()`

**Example:**
```javascript
const createOrderFeature = numflow.feature({
  method: 'POST',
  path: '/api/orders',
  steps: './steps',
})

// Register (no await needed!)
app.registerFeature(createOrderFeature)

// Chaining
app
  .registerFeature(feature1)
  .registerFeature(feature2)

// app.listen() automatically waits
app.listen(3000)
```

**Returns:** `Application` (supports chaining)

**See also:** [Feature API Reference](./feature.md)

---

### app.registerFeatures(directory, [options])

Auto-scans and registers all Features in a directory using Convention over Configuration. The `app.listen()` method automatically waits for all registrations to complete.

**Parameters:**
- `directory` (string): Path to features directory
- `options` (object, optional): Scan options
  - `indexPatterns` (string[]): File patterns to look for (default: `['index.js']`)
  - `excludeDirs` (string[]): Directories to exclude (default: `['node_modules', '.git']`)
  - `debug` (boolean): Enable debug logging (default: `false`)

**Example:**
```javascript
const numflow = require('numflow')
const app = numflow()

// Auto-scan features (no await needed!)
app.registerFeatures('./features')

// app.listen() automatically waits
app.listen(3000, () => {
  console.log('Server started with all features')
})
```

**Directory structure:**
```
features/
├── api/
│   ├── v1/
│   │   ├── orders/
│   │   │   └── @post/
│   │   │       └── index.js  ← POST /api/v1/orders
│   │   └── users/
│   │       ├── get/
│   │       │   └── index.js  ← GET /api/v1/users
│   │       └── [id]/
│   │           └── @get/
│   │               └── index.js  ← GET /api/v1/users/:id
```

**With options:**
```javascript
app.registerFeatures('./features', {
  indexPatterns: ['index.js', 'feature.js'],
  excludeDirs: ['__tests__', 'utils'],
  debug: true,
})
app.listen(3000)
```

**Returns:** `Application` (supports chaining)

**See also:** [Feature-First Guide](../guides/feature-first.md)

---

## Settings Methods

### app.set(key, value)

Sets an application setting.

**Parameters:**
- `key` (string): Setting key
- `value` (any): Setting value

**Examples:**
```javascript
app.set('port', 3000)
app.set('view engine', 'pug')
app.set('views', './views')
app.set('trust proxy', true)
```

**Returns:** `Application` (supports chaining)

---

### app.get(key)

Gets an application setting. Note: This is overloaded with `app.get(path, handler)` for routing.

**Parameters:**
- `key` (string): Setting key

**Examples:**
```javascript
const port = app.get('port')
const viewEngine = app.get('view engine')
```

**Returns:** Setting value

---

### app.enable(key)

Enables a boolean setting (sets to `true`).

**Example:**
```javascript
app.enable('trust proxy')
app.enable('case sensitive routing')
```

**Returns:** `Application` (supports chaining)

---

### app.disable(key)

Disables a boolean setting (sets to `false`).

**Example:**
```javascript
app.disable('trust proxy')
app.disable('x-powered-by')
```

**Returns:** `Application` (supports chaining)

---

### app.enabled(key)

Checks if a boolean setting is enabled.

**Example:**
```javascript
if (app.enabled('trust proxy')) {
  console.log('Trust proxy is enabled')
}
```

**Returns:** `boolean`

---

### app.disabled(key)

Checks if a boolean setting is disabled.

**Example:**
```javascript
if (app.disabled('x-powered-by')) {
  console.log('X-Powered-By header is disabled')
}
```

**Returns:** `boolean`

---

## Properties

### app.mountpath

The path pattern(s) where this application was mounted on a parent application.

**Type:** `string | string[]`

**Basic Example:**
```javascript
const app = numflow()
const admin = numflow()

admin.get('/dashboard', (req, res) => {
  console.log(admin.mountpath) // '/admin'
  res.send('Admin Dashboard')
})

app.use('/admin', admin)
```

**Multiple Mount Paths:**
```javascript
const app = numflow()
const blog = numflow()

blog.get('/', (req, res) => {
  console.log(blog.mountpath) // ['/blog', '/articles']
  res.send('Blog Home')
})

// Mount on multiple paths
app.use(['/blog', '/articles'], blog)
```

**Difference from app.path():**
- `app.mountpath`: Property that returns the immediate mount pattern(s) where the app was mounted
- `app.path()`: Method that returns the accumulated full path including all parent mounts

**Example Showing the Difference:**
```javascript
const app = numflow()
const admin = numflow()
const users = numflow()

users.get('/', (req, res) => {
  res.json({
    mountpath: users.mountpath, // '/users' (immediate mount pattern)
    path: users.path()           // '/admin/users' (full accumulated path)
  })
})

admin.use('/users', users)
app.use('/admin', admin)
```

**Unmounted Applications:**
```javascript
const app = numflow()
console.log(app.mountpath) // '' (empty string for unmounted apps)
```

**Note:** The `mountpath` property is automatically set when an application is mounted using `app.use()`.

---

## Error Handling

### app.onError(handler)

Registers a global error handler. All errors from routes, middleware, and Features are passed to this handler.

**Parameters:**
- `handler` (ErrorHandler): Error handler function `(err, req, res) => void`

**Basic Example:**
```javascript
app.onError((err, req, res) => {
  console.error(err)
  res.status(500).json({ error: 'Internal Server Error' })
})
```

**Error Type Handling:**
```javascript
const numflow = require('numflow')
const { ValidationError, NotFoundError } = numflow
const app = numflow()

app.onError((err, req, res) => {
  console.error(err)

  if (err instanceof ValidationError) {
    return res.status(400).json({
      error: err.message,
      validationErrors: err.validationErrors
    })
  }

  if (err instanceof NotFoundError) {
    return res.status(404).json({ error: err.message })
  }

  res.status(500).json({ error: 'Internal Server Error' })
})
```

**Environment-Specific Handling:**
```javascript
if (process.env.NODE_ENV === 'production') {
  // Production: safe error messages
  app.onError((err, req, res) => {
    console.error('[ERROR]', err)
    res.status(err.statusCode || 500).json({
      error: err.message || 'Internal Server Error'
    })
  })
} else {
  // Development: include stack trace
  app.onError((err, req, res) => {
    res.status(err.statusCode || 500).json({
      error: {
        message: err.message,
        stack: err.stack
      }
    })
  })
}
```

**Returns:** `Application` (supports chaining)

**Notes:**
- Error handler can only be registered once
- If not registered, a default error handler is used
- Feature errors are also passed to this handler

**See also:** [Error Handling Guide](../guides/error-handling.md)

---

## Method Chaining

Most Application methods return the Application instance, enabling method chaining:

```javascript
const numflow = require('numflow')

numflow()
  .set('port', 3000)
  .enable('trust proxy')
  .disable('x-powered-by')
  .use(logger)
  .use('/api', apiRouter)
  .get('/', (req, res) => res.send('Home'))
  .post('/users', (req, res) => res.status(201).send())
  .registerFeatures('./features')
  .onError(errorHandler)
  .listen(3000, () => console.log('Server running'))
```

---

## TypeScript Types

```typescript
import numflow, {
  Application,
  Request,
  Response,
  NextFunction,
  RequestHandler,
  ErrorHandler,
  Router,
  Feature,
} from 'numflow'

const app: Application = numflow()

const handler: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
  res.json({ message: 'Hello' })
}

const errorHandler: ErrorHandler = (err: Error, req: Request, res: Response) => {
  res.status(500).json({ error: err.message })
}

app.get('/', handler)
app.onError(errorHandler)
```

---

## Related Documentation

- **[Request API](./request.md)** - Request object reference
- **[Response API](./response.md)** - Response object reference
- **[Router API](./router.md)** - Router class reference
- **[Feature API](./feature.md)** - Feature class reference
- **[Getting Started Guide](../guides/getting-started.md)** - Beginner tutorial
- **[Routing Guide](../guides/routing.md)** - Routing patterns
- **[Middleware Guide](../guides/middleware.md)** - Middleware usage

---

*Last updated: 2025-10-20*
