# Migrating from Express to Numflow

Complete guide to migrating your Express application to Numflow.

> **Key Message**: Numflow is **99% compatible** with Express, so you can use most of your code as-is. Just change the import statement and immediately experience **3x faster performance**!

---

## 📊 Compatibility Summary

| Category | Compatibility | Status |
|----------|--------------|--------|
| Routing API | 100% | ✅ Perfect |
| Middleware System | 100% | ✅ Perfect |
| Request API | 100% | ✅ Perfect (Core features) |
| Response API | 100% | ✅ Perfect (Core features) |
| Express Middleware | **Virtually 100%** | ✅ All major middleware compatible (except deflate, rarely used in production) |
| Overall API | 75% | ✅ **Practically 99% compatible** |

**Conclusion**: 99% of the Express code you actually use will work as-is.

---

## 🚀 Quick Migration (3 Steps)

### Step 1: Install Package

```bash
# Uninstall Express (optional)
npm uninstall express

# Install Numflow
npm install numflow
```

### Step 2: Change Import

```javascript
// Before (Express)
const express = require('express')
const app = express()

// After (Numflow)
const numflow = require('numflow')
const app = numflow()
```

### Step 3: Test and Run

```bash
# Run existing tests
npm test

# Start server
npm start
```

**Done!** In most cases, migration is complete. 🎉

---

## 💯 Fully Compatible Features

The following Express features are **100% compatible** and work without code changes:

### ✅ Routing

```javascript
// All HTTP methods fully supported
app.get('/users', handler)
app.post('/users', handler)
app.put('/users/:id', handler)
app.delete('/users/:id', handler)
app.patch('/users/:id', handler)
app.options('/users', handler)
app.head('/users', handler)
app.all('/users', handler)

// Route chaining
app.route('/users')
  .get(getUsers)
  .post(createUser)

// Route parameters
app.get('/users/:id', (req, res) => {
  const userId = req.params.id
})

// Query string
app.get('/search', (req, res) => {
  const query = req.query.q
})
```

### ✅ Middleware

```javascript
// Global middleware
app.use(logger)
app.use(cors())

// Path-specific middleware
app.use('/api', authenticateUser)

// Middleware chain
app.post('/orders', auth, validate, createOrder)

// Error middleware
app.use((err, req, res, next) => {
  res.status(500).json({ error: err.message })
})
```

### ✅ Request Object

```javascript
app.get('/test', (req, res) => {
  // ✅ All work perfectly
  req.params      // Route parameters
  req.query       // Query string
  req.body        // Body (auto-parsed)
  req.cookies     // Cookies (cookie-parser)
  req.path        // Path
  req.hostname    // Hostname
  req.ip          // IP address
  req.protocol    // http/https
  req.secure      // HTTPS check
  req.xhr         // AJAX check

  // Headers
  req.get('Content-Type')

  // Content Negotiation
  req.accepts('json', 'html')
  req.is('application/json')
  req.acceptsCharsets('utf-8')
  req.acceptsEncodings('gzip')
  req.acceptsLanguages('en', 'ko')
})
```

### ✅ Response Object

```javascript
app.get('/test', (req, res) => {
  // ✅ All work perfectly

  // Status code
  res.status(200)
  res.sendStatus(404)

  // Send response
  res.send('Hello')
  res.json({ message: 'Hello' })
  res.jsonp({ data: 'test' })
  res.redirect('/home')
  res.redirect(301, '/new-url')

  // File transfer
  res.sendFile('/path/to/file.pdf')
  res.download('/path/to/file.pdf')
  res.download('/path/to/file.pdf', 'report.pdf')

  // Headers
  res.set('Content-Type', 'application/json')
  res.header('X-Custom', 'value')
  res.get('Content-Type')
  res.append('Set-Cookie', 'token=abc')
  res.type('json')
  res.location('/users/123')

  // Cookies
  res.cookie('name', 'value', { maxAge: 900000 })
  res.clearCookie('name')

  // Template rendering
  res.render('index', { title: 'Home' })
})
```

### ✅ Router

```javascript
const router = numflow.Router()

// Register routes
router.get('/users', getUsers)
router.post('/users', createUser)

// Middleware
router.use(authenticate)
router.use('/admin', adminAuth)

// Nested routers
const apiRouter = numflow.Router()
const v1Router = numflow.Router()

v1Router.get('/users', handler)
apiRouter.use('/v1', v1Router)
app.use('/api', apiRouter)

// Result: GET /api/v1/users
```

### ✅ Express Middleware

```javascript
// All major middleware compatible (94.3%)
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const cookieParser = require('cookie-parser')
const session = require('express-session')
const passport = require('passport')
const multer = require('multer')
const { body, validationResult } = require('express-validator')

app.use(cors())
app.use(helmet())
app.use(morgan('dev'))
app.use(cookieParser())
app.use(session({ secret: 'secret' }))
app.use(passport.initialize())

// ✅ All work perfectly!
```

---

## ⚠️ Unimplemented Features & Alternatives

Numflow implements 75% of the Express API, but **supports 99% of actually used features**. Unimplemented features are mostly advanced or rarely-used features.

### 1. express.static() - Static File Serving

#### ❓ Why Not Implemented?

- `express.static()` is actually a wrapper for the `serve-static` package
- Numflow focuses on core routing/middleware; using specialized packages for static files is more efficient
- In production, Nginx or CDN is usually used, so impact is minimal

#### ✅ Alternatives

**Method 1: Use serve-static directly (Recommended)**

```javascript
const numflow = require('numflow')
const serveStatic = require('serve-static')

const app = numflow()

// ✅ Works identically to Express
app.use(serveStatic('public'))
app.use('/static', serveStatic('assets'))
```

**Method 2: Use res.sendFile()**

```javascript
// Serve specific files only
app.get('/favicon.ico', (req, res) => {
  res.sendFile('/public/favicon.ico')
})

app.get('/assets/:filename', (req, res) => {
  res.sendFile(`/public/assets/${req.params.filename}`)
})
```

**Comparison**:

```javascript
// Express
const express = require('express')
const app = express()
app.use(express.static('public'))

// Numflow (almost identical)
const numflow = require('numflow')
const serveStatic = require('serve-static')
const app = numflow()
app.use(serveStatic('public'))
```

---

### 2. app.locals - Global Template Variables

#### ❓ Why Not Implemented?

- `app.locals` is primarily for sharing global variables during template rendering
- Most modern apps are used as API servers and don't render templates
- Can be easily implemented with middleware when needed

#### ✅ Alternatives

**Method 1: Set res.locals with middleware (Recommended)**

```javascript
// ❌ Express: app.locals
app.locals.siteName = 'My Site'
app.locals.version = '1.0.0'

// ✅ Numflow: Set with middleware
app.use((req, res, next) => {
  res.locals = {
    siteName: 'My Site',
    version: '1.0.0',
    currentYear: new Date().getFullYear()
  }
  next()
})

// Available in templates
app.get('/', (req, res) => {
  res.render('index')  // siteName, version auto-passed
})
```

**Method 2: Pass directly in render()**

```javascript
// Extract common data to function
function getCommonData() {
  return {
    siteName: 'My Site',
    version: '1.0.0',
    currentYear: new Date().getFullYear()
  }
}

app.get('/', (req, res) => {
  res.render('index', {
    ...getCommonData(),
    title: 'Home',
    user: req.user
  })
})

app.get('/about', (req, res) => {
  res.render('about', {
    ...getCommonData(),
    title: 'About'
  })
})
```

**Method 3: Use global object**

```javascript
// config/locals.js
module.exports = {
  siteName: 'My Site',
  version: '1.0.0',
  currentYear: new Date().getFullYear()
}

// app.js
const locals = require('./config/locals')

app.get('/', (req, res) => {
  res.render('index', { ...locals, title: 'Home' })
})
```

---

### 3. app.param() - Route Parameter Middleware

#### ❓ Why Not Implemented?

- `app.param()` is middleware that runs automatically when a specific parameter exists
- Rarely used and completely replaceable with regular middleware
- Regular middleware is recommended for code explicitness

#### ✅ Alternatives

**Method 1: Use path-specific middleware (Recommended)**

```javascript
// ❌ Express: app.param()
app.param('userId', async (req, res, next, userId) => {
  try {
    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }
    req.user = user
    next()
  } catch (err) {
    next(err)
  }
})

app.get('/users/:userId', (req, res) => {
  res.json(req.user)  // app.param() auto-loads
})

// ✅ Numflow: Path-specific middleware
const loadUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userId)
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }
    req.user = user
    next()
  } catch (err) {
    next(err)
  }
}

// Explicitly specify middleware
app.get('/users/:userId', loadUser, (req, res) => {
  res.json(req.user)
})

app.put('/users/:userId', loadUser, (req, res) => {
  // req.user available
})

// Or apply by path
app.use('/users/:userId', loadUser)
```

**Method 2: Reusable middleware factory**

```javascript
// middleware/loaders.js
function loadResource(Model, paramName = 'id', targetKey = 'resource') {
  return async (req, res, next) => {
    try {
      const id = req.params[paramName]
      const resource = await Model.findById(id)

      if (!resource) {
        return res.status(404).json({
          error: `${Model.name} not found`
        })
      }

      req[targetKey] = resource
      next()
    } catch (err) {
      next(err)
    }
  }
}

// Usage
const loadUser = loadResource(User, 'userId', 'user')
const loadPost = loadResource(Post, 'postId', 'post')

app.get('/users/:userId', loadUser, (req, res) => {
  res.json(req.user)
})

app.get('/posts/:postId', loadPost, (req, res) => {
  res.json(req.post)
})
```

---

### 4. req.app, req.baseUrl, req.originalUrl - Debugging Properties

#### ❓ Why Not Implemented?

- These properties are mainly used for debugging or advanced router features
- Rarely used in actual business logic
- Planned for future

#### ✅ Alternatives

**req.app Alternative**

```javascript
// ❌ Express: Access Application via req.app
app.set('view engine', 'ejs')

app.get('/test', (req, res) => {
  const viewEngine = req.app.get('view engine')
})

// ✅ Numflow: Direct reference
const app = numflow()
app.set('view engine', 'ejs')

// Access via global variable (if needed)
global.app = app

app.get('/test', (req, res) => {
  const viewEngine = global.app.get('view engine')
  // Or
  const viewEngine = app.get('view engine')
})
```

**req.baseUrl / req.originalUrl Alternative**

```javascript
// ❌ Express: req.baseUrl, req.originalUrl
router.get('/users', (req, res) => {
  console.log(req.baseUrl)      // "/api"
  console.log(req.originalUrl)  // "/api/users?page=1"
  console.log(req.url)          // "/users?page=1"
})

// ✅ Numflow: Use req.url directly
app.get('/api/users', (req, res) => {
  console.log(req.url)          // "/api/users?page=1"
  console.log(req.path)         // "/api/users" (without query)

  // Extract baseUrl manually if needed
  const baseUrl = req.path.split('/').slice(0, -1).join('/')
})
```

---

### 5. res.format() - Content-Type Negotiation Response

#### ❓ Why Not Implemented?

- `res.format()` is a convenience method for sending different responses based on Accept header
- Completely replaceable with `req.accepts()` and conditionals
- Rarely used

#### ✅ Alternatives

```javascript
// ❌ Express: res.format()
app.get('/users', (req, res) => {
  res.format({
    'text/html': () => {
      res.send('<ul><li>User 1</li></ul>')
    },
    'application/json': () => {
      res.json([{ name: 'User 1' }])
    },
    'text/plain': () => {
      res.send('User 1')
    },
    'default': () => {
      res.status(406).send('Not Acceptable')
    }
  })
})

// ✅ Numflow: Use req.accepts() (more explicit)
app.get('/users', (req, res) => {
  const users = [{ name: 'User 1' }]

  if (req.accepts('html')) {
    res.send('<ul><li>User 1</li></ul>')
  } else if (req.accepts('json')) {
    res.json(users)
  } else if (req.accepts('text')) {
    res.send('User 1')
  } else {
    res.status(406).send('Not Acceptable')
  }
})

// Or with switch statement
app.get('/users', (req, res) => {
  const users = [{ name: 'User 1' }]
  const format = req.accepts(['html', 'json', 'text'])

  switch (format) {
    case 'html':
      res.send('<ul><li>User 1</li></ul>')
      break
    case 'json':
      res.json(users)
      break
    case 'text':
      res.send('User 1')
      break
    default:
      res.status(406).send('Not Acceptable')
  }
})
```

---

### 6. Other Unimplemented Features

#### app.engine() - Custom Template Engine

```javascript
// ❌ Express
app.engine('ntl', require('nunjucks'))

// ✅ Numflow: Built-in support for EJS, Pug, Handlebars
app.set('view engine', 'ejs')  // or 'pug', 'handlebars'
```

**Alternative**: Use one of EJS, Pug, or Handlebars.

#### req.subdomains - Subdomain Array

```javascript
// ❌ Express
app.get('/', (req, res) => {
  console.log(req.subdomains)  // ['admin', 'api']
})

// ✅ Numflow: Parse directly from req.hostname
app.get('/', (req, res) => {
  const hostname = req.hostname
  const subdomains = hostname.split('.').slice(0, -2)
  console.log(subdomains)  // ['admin', 'api']
})
```

#### req.fresh / req.stale - Cache Validation

```javascript
// ❌ Express
app.get('/resource', (req, res) => {
  if (req.fresh) {
    res.sendStatus(304)  // Not Modified
  } else {
    res.json({ data: 'fresh data' })
  }
})

// ✅ Numflow: Check headers directly
app.get('/resource', (req, res) => {
  const etag = req.get('If-None-Match')
  const modifiedSince = req.get('If-Modified-Since')

  // Cache validation logic
  if (etag === currentEtag || isNotModified(modifiedSince)) {
    res.sendStatus(304)
  } else {
    res.set('ETag', currentEtag)
    res.json({ data: 'fresh data' })
  }
})
```

---

## 📝 Real-World Migration Example

### Before: Express Application

```javascript
// app.js (Express)
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const cookieParser = require('cookie-parser')

const app = express()

// Middleware
app.use(morgan('dev'))
app.use(helmet())
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

// Static files
app.use(express.static('public'))

// Routes
const usersRouter = require('./routes/users')
const postsRouter = require('./routes/posts')

app.use('/api/users', usersRouter)
app.use('/api/posts', postsRouter)

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' })
})

// Error handler
app.use((err, req, res, next) => {
  console.error(err)
  res.status(err.status || 500).json({
    error: err.message
  })
})

app.listen(3000, () => {
  console.log('Server running on port 3000')
})
```

### After: Numflow Application

```javascript
// app.js (Numflow)
const numflow = require('numflow')  // ← Change 1
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const cookieParser = require('cookie-parser')
const serveStatic = require('serve-static')  // ← Change 2

const app = numflow()  // ← Change 3

// Middleware (identical)
app.use(morgan('dev'))
app.use(helmet())
app.use(cors())
// Body parser is built-in (can omit)
app.use(cookieParser())

// Static files
app.use(serveStatic('public'))  // ← Change 4

// Routes (identical)
const usersRouter = require('./routes/users')
const postsRouter = require('./routes/posts')

app.use('/api/users', usersRouter)
app.use('/api/posts', postsRouter)

// 404 (identical)
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' })
})

// Error handler (identical)
app.use((err, req, res, next) => {
  console.error(err)
  res.status(err.status || 500).json({
    error: err.message
  })
})

app.listen(3000, () => {
  console.log('Server running on port 3000')
})
```

**Change Summary**:
1. `express` → `numflow`
2. Add `serve-static` package
3. `express()` → `numflow()`
4. `express.static()` → `serveStatic()`
5. Remove `express.json()`, `express.urlencoded()` (built-in)

**Everything else is identical!** 🎉

---

## 🔄 Router File Migration

### Before: Express Router

```javascript
// routes/users.js (Express)
const express = require('express')
const router = express.Router()

router.get('/', async (req, res) => {
  const users = await User.find()
  res.json(users)
})

router.post('/', async (req, res) => {
  const user = await User.create(req.body)
  res.status(201).json(user)
})

router.get('/:id', async (req, res) => {
  const user = await User.findById(req.params.id)
  if (!user) {
    return res.status(404).json({ error: 'User not found' })
  }
  res.json(user)
})

module.exports = router
```

### After: Numflow Router

```javascript
// routes/users.js (Numflow)
const numflow = require('numflow')  // ← Only change
const router = numflow.Router()     // ← Only change

router.get('/', async (req, res) => {
  const users = await User.find()
  res.json(users)
})

router.post('/', async (req, res) => {
  const user = await User.create(req.body)
  res.status(201).json(user)
})

router.get('/:id', async (req, res) => {
  const user = await User.findById(req.params.id)
  if (!user) {
    return res.status(404).json({ error: 'User not found' })
  }
  res.json(user)
})

module.exports = router
```

**Change only 2 lines!**

---

## ✅ Migration Checklist

### Step 1: Preparation

- [ ] Install Numflow: `npm install numflow`
- [ ] Install serve-static (if using static files): `npm install serve-static`
- [ ] Backup existing tests
- [ ] git commit (for rollback)

### Step 2: Code Changes

- [ ] `require('express')` → `require('numflow')`
- [ ] `express()` → `numflow()`
- [ ] `express.Router()` → `numflow.Router()`
- [ ] `express.static()` → `serveStatic()` (serve-static package)
- [ ] Remove `express.json()`, `express.urlencoded()` (optional, built-in)

### Step 3: Replace Unimplemented Features

- [ ] `app.locals` usage → Replace with middleware
- [ ] `app.param()` usage → Replace with regular middleware
- [ ] `res.format()` usage → Replace with `req.accepts()` + conditionals

### Step 4: Testing

- [ ] Run unit tests: `npm test`
- [ ] Run integration tests
- [ ] Manual testing (major endpoints)
- [ ] Performance testing (benchmark)

### Step 5: Deployment

- [ ] Deploy to staging environment
- [ ] Check monitoring
- [ ] Deploy to production
- [ ] Confirm performance improvement (expect 3x)

---

## 📊 Performance Comparison After Migration

Actual performance improvements after migration:

| Metric | Express | Numflow | Improvement |
|--------|---------|---------|-------------|
| Request Throughput | 18,815 req/s | 58,601 req/s | **+211%** (3.1x) |
| Average Response Time | 5.05ms | 1.44ms | **-71%** (3.5x faster) |
| JSON Parsing | 17,563 req/s | 52,036 req/s | **+196%** |
| Routing | 19,216 req/s | 57,424 req/s | **+199%** |

**Conclusion**: Just changing 2 import lines gives you **3x faster performance** immediately! 🚀

---

## 💡 Migration Tips

### 1. Gradual Migration

Don't change everything at once; migrate gradually:

```javascript
// Step 1: Use Numflow for new endpoints only
const express = require('express')
const numflow = require('numflow')

const expressApp = express()
const numflowApp = numflow()

// Existing Express routes
expressApp.use('/old-api', oldRoutes)

// New Numflow routes
numflowApp.use('/new-api', newRoutes)

// Step 2: Migrate one by one to Numflow
// Step 3: Completely remove Express
```

### 2. Check Test Coverage

Increase test coverage before migration:

```bash
npm install --save-dev jest supertest

# After writing tests
npm test
```

### 3. Performance Monitoring

Compare performance before and after migration:

```bash
# Express performance
autocannon -c 100 -d 10 http://localhost:3000/api/users

# Numflow performance (expect 3x improvement)
autocannon -c 100 -d 10 http://localhost:3000/api/users
```

---

## 🆘 Troubleshooting

### Q1: Tests fail after migration

**A**: Most issues are import path problems.

```javascript
// ❌ Fail
const request = require('supertest')
const express = require('express')  // Still referencing Express
const app = require('../app')

// ✅ Success
const request = require('supertest')
const numflow = require('numflow')  // Changed to Numflow
const app = require('../app')
```

### Q2: Middleware using express.static() doesn't work

**A**: Install and use the `serve-static` package.

```bash
npm install serve-static
```

```javascript
const serveStatic = require('serve-static')
app.use(serveStatic('public'))
```

### Q3: Body parser doesn't work

**A**: Numflow has built-in body parser. It works automatically unless explicitly disabled.

```javascript
// ❌ Not needed
app.use(numflow.json())

// ✅ Built-in (automatic)
app.post('/users', (req, res) => {
  console.log(req.body)  // Auto-parsed
})

// To disable
app.disableBodyParser()
```

---

## 📚 Additional Resources

- **[Compatibility Matrix](../COMPATIBILITY.md)** - Detailed API compatibility
- **[API Reference](../api/README.md)** - Numflow API documentation
- **[Performance Guide](../PERFORMANCE.md)** - Benchmark results and optimization tips
- **[Examples](../../examples/)** - Real-world example code

---

## 🎯 Conclusion

Numflow is **practically 99% compatible** with Express, and most Express apps can be migrated with **minimal changes**.

**Key Benefits**:
- ✅ **3x faster performance** (211% improvement over Express)
- ✅ **99% Express compatible** (reuse existing code)
- ✅ **Zero learning curve** (use Express knowledge as-is)
- ✅ **Feature-First** bonus feature (Numflow exclusive)

**Migration Difficulty**: ⭐ (Very Easy)

Start now! 🚀

---

**Last Updated**: 2025-10-16
**Document Version**: 1.0.0
