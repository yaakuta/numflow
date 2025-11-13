/**
 * Express benchmark server
 * Supports all benchmark scenarios
 */

const express = require('express')

const app = express()

// JSON body parser
app.use(express.json())

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

const port = process.env.PORT || 3001
app.listen(port, () => {
  console.log(`Express server running on port ${port}`)
})
