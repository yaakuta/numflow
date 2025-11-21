/**
 * Routing Example
 * Demonstrates various routing features of the Numflow framework
 */

const numflow = require("numflow")

const app = numflow()

// 1. Basic routes
app.get('/', (req, res) => {
  res.statusCode = 200
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify({
    message: 'Welcome to Numflow Framework Routing Example!',
    routes: [
      'GET /',
      'GET /users',
      'POST /users',
      'GET /users/:id',
      'GET /users/:userId/posts/:postId',
      'GET /search?q=keyword',
    ],
  }))
})

// 2. Get user list
app.get('/users', (req, res) => {
  res.statusCode = 200
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify({
    users: [
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' },
      { id: 3, name: 'Charlie' },
    ],
  }))
})

// 3. Create user
app.post('/users', (req, res) => {
  res.statusCode = 201
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify({
    success: true,
    message: 'User created',
    user: { id: 4, name: 'New User' },
  }))
})

// 4. Path parameter - single parameter
app.get('/users/:id', (req, res) => {
  const { id } = req.params
  res.statusCode = 200
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify({
    user: { id, name: `User ${id}` },
  }))
})

// 5. Path parameter - multiple parameters
app.get('/users/:userId/posts/:postId', (req, res) => {
  const { userId, postId } = req.params
  res.statusCode = 200
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify({
    post: {
      id: postId,
      userId,
      title: `Post ${postId} by User ${userId}`,
    },
  }))
})

// 6. Query parameters
app.get('/search', (req, res) => {
  const { q, page = '1', limit = '10' } = req.query
  res.statusCode = 200
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify({
    query: q,
    page: parseInt(page),
    limit: parseInt(limit),
    results: [
      { id: 1, title: `Result matching "${q}"` },
      { id: 2, title: `Another result for "${q}"` },
    ],
  }))
})

// 7. Route chaining - multiple methods on same path
app.route('/products')
  .get((req, res) => {
    res.statusCode = 200
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({
      products: [
        { id: 1, name: 'Product A', price: 100 },
        { id: 2, name: 'Product B', price: 200 },
      ],
    }))
  })
  .post((req, res) => {
    res.statusCode = 201
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({
      success: true,
      message: 'Product created',
      product: { id: 3, name: 'New Product', price: 150 },
    }))
  })

// 8. PUT, DELETE, PATCH methods
app.put('/users/:id', (req, res) => {
  const { id } = req.params
  res.statusCode = 200
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify({
    success: true,
    message: `User ${id} updated`,
  }))
})

app.delete('/users/:id', (req, res) => {
  const { id } = req.params
  res.statusCode = 200
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify({
    success: true,
    message: `User ${id} deleted`,
  }))
})

app.patch('/users/:id', (req, res) => {
  const { id } = req.params
  res.statusCode = 200
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify({
    success: true,
    message: `User ${id} patched`,
  }))
})

// 9. all() method - handle all HTTP methods
app.all('/ping', (req, res) => {
  res.statusCode = 200
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify({
    message: 'pong',
    method: req.method,
  }))
})

// Start server
const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════╗
║  Numflow Framework - Routing Example                    ║
╚══════════════════════════════════════════════════════════╝

Server started at: http://localhost:${PORT}

Available routes:

  Basic routes:
    GET  /                                Home page

  User management:
    GET  /users                           List users
    POST /users                           Create user
    GET  /users/:id                       Get user
    PUT  /users/:id                       Update user
    PATCH /users/:id                      Partial update user
    DELETE /users/:id                     Delete user

  Posts:
    GET  /users/:userId/posts/:postId     Get post

  Search:
    GET  /search?q=keyword&page=1&limit=10 Search

  Products:
    GET  /products                        List products
    POST /products                        Create product

  Misc:
    ALL  /ping                            Ping test (all methods)

Test commands:
  curl http://localhost:${PORT}/
  curl http://localhost:${PORT}/users
  curl http://localhost:${PORT}/users/123
  curl http://localhost:${PORT}/users/1/posts/456
  curl "http://localhost:${PORT}/search?q=numflow&page=2"
  curl -X POST http://localhost:${PORT}/users
  curl -X DELETE http://localhost:${PORT}/users/123
  `)
})
