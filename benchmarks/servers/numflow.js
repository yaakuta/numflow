/**
 * Numflow benchmark server
 * Supports all benchmark scenarios
 */

const numflow = require('../../dist/cjs/index.js')
const path = require('path')

const app = numflow()
const port = process.env.PORT || 3000

// Numflow has built-in body parser

// 1. Hello World
app.get('/', (req, res) => {
  res.send('Hello World')
})

// 2. JSON response
app.get('/json', (req, res) => {
  res.json({
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
  })
})

// 3. JSON POST (body parsing)
app.post('/users', (req, res) => {
  res.json(req.body)
})

// 4. Route parameter (single)
app.get('/users/:id', (req, res) => {
  res.json({
    id: req.params.id,
    name: 'User ' + req.params.id,
  })
})

// 5. Route parameters (multiple)
app.get('/users/:userId/posts/:postId', (req, res) => {
  res.json({
    userId: req.params.userId,
    postId: req.params.postId,
  })
})

// 6. Query string
app.get('/search', (req, res) => {
  res.json({
    query: req.query,
    result: 'Found 10 items',
  })
})

// 7. Middleware chain (4 middlewares)
const middleware1 = (req, res, next) => {
  req.customData = { middleware1: true }
  next()
}
const middleware2 = (req, res, next) => {
  req.customData.middleware2 = true
  next()
}
const middleware3 = (req, res, next) => {
  req.customData.middleware3 = true
  next()
}
const middleware4 = (req, res, next) => {
  req.customData.middleware4 = true
  next()
}

app.get(
  '/middleware-chain',
  middleware1,
  middleware2,
  middleware3,
  middleware4,
  (req, res) => {
    res.json({ success: true, data: req.customData })
  }
)

// 8. Feature-First scenarios
// Disable Feature logs
process.env.DISABLE_FEATURE_LOGS = 'true'

// Feature helpers
const getFixturePath = (name) =>
  path.join(__dirname, '../fixtures', name)

// Feature with 10 steps
app.use(
  numflow.feature({
    method: 'POST',
    path: '/api/feature-10-steps',
    steps: getFixturePath('steps-10'),
    contextInitializer: (ctx, req, res) => {
      ctx.userId = 1
      ctx.data = req.body || {}
    },
  })
)

// Feature with 50 steps
app.use(
  numflow.feature({
    method: 'POST',
    path: '/api/feature-50-steps',
    steps: getFixturePath('steps-50'),
    contextInitializer: (ctx, req, res) => {
      ctx.userId = 1
      ctx.data = req.body || {}
    },
  })
)

// Regular route (for comparison)
app.post('/api/regular-route', (req, res) => {
  let result = { userId: 1, data: req.body || {} }

  for (let i = 0; i < 10; i++) {
    result[`step${i + 1}`] = `processed-${i + 1}`
  }

  res.json({ success: true, result })
})

app.listen(port, () => {
  console.log(`Numflow server running on port ${port}`)
})
