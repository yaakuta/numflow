# Express Migration

Learn how to migrate Express projects to Numflow.

## 📚 Learning Objectives

- Express → Numflow migration process
- Minimize code changes
- Refactor to Feature-First
- Before/After comparison

## 🚀 Migration Steps

### Step 1: Change Package

```bash
# Remove Express
npm uninstall express

# Install Numflow
npm install numbers
```

### Step 2: Change Import

```javascript
// Before (Express)
const express = require('express')
const app = express()

// After (Numflow)
const numbers = require('numflow')
const app = numbers()
```

**Done!** Most Express code works as-is.

## 💡 Compatibility

### 100% Compatible Features

✅ Routing
```javascript
app.get('/users/:id', (req, res) => { ... })
app.post('/users', (req, res) => { ... })
app.route('/users/:id')
  .get(handler)
  .put(handler)
  .delete(handler)
```

✅ Middleware
```javascript
app.use(middleware)
app.use('/api', middleware)
app.get('/path', middleware1, middleware2, handler)
```

✅ Request/Response
```javascript
req.params, req.query, req.body, req.headers
res.json(), res.send(), res.status(), res.redirect()
```

✅ Express Middleware
```javascript
app.use(helmet())
app.use(morgan('combined'))
app.use(compression())
```

### Additional Features

Numflow provides all Express features plus:

⭐ **Feature-First Architecture**
```javascript
const { feature } = require('numflow')

const myFeature = feature({
  method: 'POST',
  path: '/api/orders',
  steps: './steps',
  asyncTasks: './async-tasks',
  onError: async (error, ctx, req, res) => {
    // Manual transaction rollback
    if (ctx.dbClient) {
      await ctx.dbClient.query('ROLLBACK')
    }
    res.status(500).json({ error: error.message })
  }
})

app.use(myFeature)
```

⚡ **3x Faster Performance**
- Radix Tree Router (find-my-way)
- O(log n) search speed

## 📖 Migration Examples

### Before: Express

```javascript
const express = require('express')
const app = express()

app.use(express.json())

app.get('/api/users', async (req, res) => {
  try {
    const users = await User.findAll()
    res.json({ success: true, data: users })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

app.post('/api/users', async (req, res) => {
  try {
    const { name, email } = req.body

    if (!name || !email) {
      return res.status(400).json({ error: 'name and email are required' })
    }

    const user = await User.create({ name, email })
    res.status(201).json({ success: true, data: user })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

app.listen(3000, () => {
  console.log('Server running on port 3000')
})
```

### After: Numflow (Compatible Mode)

```javascript
const numbers = require('numflow')
const app = numbers()

// JSON body parsing is automatic!

app.get('/api/users', async (req, res) => {
  try {
    const users = await User.findAll()
    res.json({ success: true, data: users })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

app.post('/api/users', async (req, res) => {
  try {
    const { name, email } = req.body

    if (!name || !email) {
      return res.status(400).json({ error: 'name and email are required' })
    }

    const user = await User.create({ name, email })
    res.status(201).json({ success: true, data: user })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

app.listen(3000, () => {
  console.log('Server running on port 3000')
})
```

**Changes**: Only one line changed: `express` → `numbers`!

### After: Numflow (Feature-First Mode)

Refactor complex logic to Feature-First:

```javascript
const numbers = require('numflow')
const { feature } = numbers
const app = numbers()

// Use regular routes for simple queries
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.findAll()
    res.json({ success: true, data: users })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// Use Feature-First for complex logic (Convention over Configuration)
// features/api/users/@post/index.js
module.exports = feature({
  // method: 'POST' (auto-inferred from folder name)
  // path: '/api/users' (auto-inferred from folder structure)
  // steps: './steps' (auto-detected)
})

// features/api/users/@post/steps/100-validate.js
async (ctx, req, res) => {
  const { name, email } = req.body
  if (!name || !email) {
    throw new Error('name and email are required')
  }
  ctx.name = name
  ctx.email = email
}

// features/api/users/@post/steps/200-create-user.js
async (ctx, req, res) => {
  const user = await User.create({
    name: ctx.name,
    email: ctx.email,
  })
  ctx.user = user
}

// features/api/users/@post/steps/900-respond.js
async (ctx, req, res) => {
  res.status(201).json({
    success: true,
    data: ctx.user
  })
  return
}

// Auto-register with Bulk Registration!
app.registerFeatures('./features')

app.listen(3000, () => {
  console.log('Server running on port 3000')
})
```

## 🎯 Migration Checklist

### Phase 1: Migrate to Compatible Mode (1 day)

- [ ] `npm uninstall express && npm install numbers`
- [ ] `require('express')` → `require('numflow')`
- [ ] Run and verify tests
- [ ] Deploy

### Phase 2: Performance Optimization (1 week)

- [ ] Run performance benchmarks
- [ ] Identify bottlenecks
- [ ] Verify Radix Tree router benefits

### Phase 3: Apply Feature-First (2-4 weeks)

- [ ] Identify complex business logic
- [ ] Refactor to Feature-First
- [ ] Add transaction management
- [ ] Separate async tasks

## 💡 Migration Tips

### 1. Gradual Migration

Don't change everything at once. Migrate incrementally.

```javascript
// Mix existing Express routes with Numflow Features
app.get('/old-route', expressHandler)
app.use(numbersFeature)
```

### 2. Tests First

Write sufficient tests before migrating.

### 3. Performance Monitoring

Continuously monitor performance after migration.

### 4. Feature-First is Optional

You don't need to convert all code to Feature-First.
Apply it only to complex logic.

## 📚 Learn More

- **[01-before-express.js](./01-before-express.js)** - Original Express code
- **[02-after-numbers.js](./02-after-numbers.js)** - Migrated Numflow code
- **[COMPATIBILITY.md](../../docs/COMPATIBILITY.md)** - Detailed compatibility info

## Next Steps

After completing migration:

1. **Performance Benchmark**: Verify Numflow's performance improvements
2. **Apply Feature-First**: Refactor complex logic to Feature-First
3. **Production Deployment**: Deploy after thorough testing

---

**Need migration support?**
- GitHub Issues: https://github.com/gazerkr/numflow/issues
- Discussions: https://github.com/gazerkr/numflow/discussions
