# Routing

Learn various routing patterns using Numflow's high-performance Radix Tree router.

## 📚 Learning Objectives

- Using dynamic route parameters
- Handling query strings
- Multiple parameter routing
- Route chaining
- Modular routing (express.Router)

## 📂 Example List

| File | Difficulty | Description | Time |
|------|------------|-------------|------|
| `01-route-parameters.js` | ⭐⭐ Intermediate | Dynamic parameters (:id) | 10 min |
| `02-query-strings.js` | ⭐⭐ Intermediate | Query string handling (?page=1) | 10 min |
| `03-multiple-parameters.js` | ⭐⭐ Intermediate | Multiple parameters | 10 min |
| `04-route-chaining.js` | ⭐⭐⭐ Advanced | Route chaining | 15 min |
| `05-express-router.js` | ⭐⭐⭐ Advanced | express.Router compatibility (modular) | 20 min |

## 🚀 Quick Start

### 1. Route Parameters

```bash
node examples/02-routing/01-route-parameters.js

# Test
curl http://localhost:3000/users/123
curl http://localhost:3000/products/macbook-pro
```

### 2. Query Strings

```bash
node examples/02-routing/02-query-strings.js

# Test
curl "http://localhost:3000/api/search?q=numflow&page=2&limit=20"
curl "http://localhost:3000/api/filter?category=electronics&minPrice=1000"
```

### 3. express.Router (Modular Routing)

```bash
node examples/02-routing/05-express-router.js

# Test
curl http://localhost:3000/api/users
curl http://localhost:3000/api/users/123
curl -X POST http://localhost:3000/api/users -H "Content-Type: application/json" -d '{"name":"Charlie"}'
curl http://localhost:3000/api/users/123/posts
curl http://localhost:3000/api/users/123/posts/456
```

## 💡 Core Concepts

### Dynamic Parameters (req.params)

Parts of the URL path can be received as variables.

```javascript
app.get('/users/:id', (req, res) => {
  const userId = req.params.id // "123"
  res.json({ userId })
})
```

### Query Strings (req.query)

Parameters after `?` in the URL are automatically parsed.

```javascript
// URL: /api/search?q=numflow&page=2
app.get('/api/search', (req, res) => {
  const { q, page } = req.query // { q: "numflow", page: "2" }
  res.json({ q, page })
})
```

### Modular Routing (express.Router)

Router allows managing routes separated by module.

```javascript
// routes/users.js
const numflow = require('numflow')
const router = numflow.Router()

router.get('/', (req, res) => {
  res.json({ users: [] })
})

module.exports = router

// app.js
const app = numflow()
const usersRouter = require('./routes/users')
app.use('/api/users', usersRouter)  // Mount at /api/users
```

**Benefits of Router:**
- 🗂️ **Modularization**: Manage routes separated by feature
- ♻️ **Reusability**: Mount the same Router to multiple paths
- 🏗️ **Nesting**: Implement hierarchical structure by mounting Router within Router
- 🔧 **Middleware**: Apply common logic with Router-level middleware
- ✅ **100% Express compatible**: Works identically to Express Router

### Advantages of Radix Tree Router

Numflow uses **find-my-way** Radix Tree router:

- ⚡ **O(log n) search speed** (Express is O(n))
- 🚀 **3x faster routing than Express**
- ✅ **Complete Express compatibility**

## 📖 Route Patterns

### 1. Static Paths
```javascript
app.get('/about', handler)        // Matches /about only
```

### 2. Dynamic Parameters
```javascript
app.get('/users/:id', handler)    // /users/123, /users/abc, etc.
```

### 3. Multiple Parameters
```javascript
app.get('/users/:userId/posts/:postId', handler)
// /users/123/posts/456
```

### 4. Optional Parameters
```javascript
app.get('/posts/:id?', handler)   // /posts or /posts/123
```

### 5. Wildcards
```javascript
app.get('/files/*', handler)      // /files/any/path/here
```

## Next Steps

After completing Routing, move to the next section:

- **[03-middleware](../03-middleware/)** - Pre-process requests with middleware
- **[04-request-response](../04-request-response/)** - Advanced Request/Response features
