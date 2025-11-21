/**
 * 04-route-chaining.js
 *
 * Example of registering multiple HTTP methods to the same path using route chaining.
 * Using app.route() makes the code more concise and readable.
 *
 * Learning Objectives:
 * - Route chaining with app.route()
 * - RESTful API pattern (multiple methods on the same path)
 * - Eliminating code duplication
 *
 * How to Run:
 * node examples/02-routing/04-route-chaining.js
 *
 * Testing:
 * # Get users list
 * curl http://localhost:3000/api/users
 *
 * # Create user
 * curl -X POST http://localhost:3000/api/users \
 *   -H "Content-Type: application/json" \
 *   -d '{"name":"John","email":"john@example.com"}'
 *
 * # Get user
 * curl http://localhost:3000/api/users/1
 *
 * # Update user
 * curl -X PUT http://localhost:3000/api/users/1 \
 *   -H "Content-Type: application/json" \
 *   -d '{"name":"Jane"}'
 *
 * # Delete user
 * curl -X DELETE http://localhost:3000/api/users/1
 */

const numflow = require("numflow")

const app = numflow()

// ===========================================
// In-memory database
// ===========================================

let users = [
  { id: 1, name: 'Alice', email: 'alice@example.com', role: 'admin' },
  { id: 2, name: 'Bob', email: 'bob@example.com', role: 'user' },
  { id: 3, name: 'Charlie', email: 'charlie@example.com', role: 'user' },
]

let nextId = 4

let articles = [
  { id: 101, title: 'First Article', content: 'Hello World', published: true },
  { id: 102, title: 'Second Article', content: 'Great day!', published: false },
]

let nextArticleId = 103

// ===========================================
// 1. Basic Route Chaining (app.route)
// ===========================================

// Old way (inefficient)
// app.get('/api/users', getAllUsers)
// app.post('/api/users', createUser)

// Chaining way (efficient) ✅
app
  .route('/api/users')
  .get((req, res) => {
    // GET /api/users - Get users list
    res.json({
      success: true,
      count: users.length,
      data: users,
    })
  })
  .post((req, res) => {
    // POST /api/users - Create user
    const { name, email, role = 'user' } = req.body

    if (!name || !email) {
      return res.status(400).json({
        success: false,
        error: 'name and email are required.',
      })
    }

    const newUser = {
      id: nextId++,
      name,
      email,
      role,
    }

    users.push(newUser)

    res.status(201).json({
      success: true,
      message: 'User created.',
      data: newUser,
    })
  })

// ===========================================
// 2. Route Chaining with Parameters
// ===========================================

app
  .route('/api/users/:id')
  .get((req, res) => {
    // GET /api/users/:id - Get user
    const userId = parseInt(req.params.id)
    const user = users.find((u) => u.id === userId)

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found.',
      })
    }

    res.json({
      success: true,
      data: user,
    })
  })
  .put((req, res) => {
    // PUT /api/users/:id - Update user
    const userId = parseInt(req.params.id)
    const userIndex = users.findIndex((u) => u.id === userId)

    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'User not found.',
      })
    }

    const { name, email, role } = req.body

    // Support partial updates
    users[userIndex] = {
      ...users[userIndex],
      ...(name && { name }),
      ...(email && { email }),
      ...(role && { role }),
    }

    res.json({
      success: true,
      message: 'User updated.',
      data: users[userIndex],
    })
  })
  .patch((req, res) => {
    // PATCH /api/users/:id - Partial update (similar to PUT but semantically for partial updates)
    const userId = parseInt(req.params.id)
    const userIndex = users.findIndex((u) => u.id === userId)

    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'User not found.',
      })
    }

    const updates = req.body

    // Update only provided fields
    users[userIndex] = {
      ...users[userIndex],
      ...updates,
    }

    res.json({
      success: true,
      message: 'User partially updated.',
      data: users[userIndex],
    })
  })
  .delete((req, res) => {
    // DELETE /api/users/:id - Delete user
    const userId = parseInt(req.params.id)
    const userIndex = users.findIndex((u) => u.id === userId)

    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'User not found.',
      })
    }

    const deletedUser = users[userIndex]
    users.splice(userIndex, 1)

    res.json({
      success: true,
      message: 'User deleted.',
      data: deletedUser,
    })
  })

// ===========================================
// 3. Multiple Route Chaining (Articles Example)
// ===========================================

app
  .route('/api/articles')
  .get((req, res) => {
    // GET /api/articles - Get articles list
    const { published } = req.query

    let result = articles

    // Filter with query string
    if (published !== undefined) {
      const isPublished = published === 'true'
      result = articles.filter((a) => a.published === isPublished)
    }

    res.json({
      success: true,
      count: result.length,
      data: result,
    })
  })
  .post((req, res) => {
    // POST /api/articles - Create article
    const { title, content, published = false } = req.body

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        error: 'title and content are required.',
      })
    }

    const newArticle = {
      id: nextArticleId++,
      title,
      content,
      published,
    }

    articles.push(newArticle)

    res.status(201).json({
      success: true,
      message: 'Article created.',
      data: newArticle,
    })
  })

app
  .route('/api/articles/:id')
  .get((req, res) => {
    // GET /api/articles/:id - Get article
    const articleId = parseInt(req.params.id)
    const article = articles.find((a) => a.id === articleId)

    if (!article) {
      return res.status(404).json({
        success: false,
        error: 'Article not found.',
      })
    }

    res.json({
      success: true,
      data: article,
    })
  })
  .put((req, res) => {
    // PUT /api/articles/:id - Update article
    const articleId = parseInt(req.params.id)
    const articleIndex = articles.findIndex((a) => a.id === articleId)

    if (articleIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Article not found.',
      })
    }

    const { title, content, published } = req.body

    articles[articleIndex] = {
      ...articles[articleIndex],
      ...(title && { title }),
      ...(content && { content }),
      ...(published !== undefined && { published }),
    }

    res.json({
      success: true,
      message: 'Article updated.',
      data: articles[articleIndex],
    })
  })
  .delete((req, res) => {
    // DELETE /api/articles/:id - Delete article
    const articleId = parseInt(req.params.id)
    const articleIndex = articles.findIndex((a) => a.id === articleId)

    if (articleIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Article not found.',
      })
    }

    const deletedArticle = articles[articleIndex]
    articles.splice(articleIndex, 1)

    res.json({
      success: true,
      message: 'Article deleted.',
      data: deletedArticle,
    })
  })

// ===========================================
// 4. Benefits of Route Chaining Comparison
// ===========================================

// ❌ Old way (repetitive)
// app.get('/api/old-style', handler1)
// app.post('/api/old-style', handler2)
// app.put('/api/old-style', handler3)
// app.delete('/api/old-style', handler4)

// ✅ Chaining way (concise)
app
  .route('/api/comparison')
  .get((req, res) => res.json({ method: 'GET' }))
  .post((req, res) => res.json({ method: 'POST' }))
  .put((req, res) => res.json({ method: 'PUT' }))
  .delete((req, res) => res.json({ method: 'DELETE' }))

// ===========================================
// Start Server
// ===========================================

const PORT = 3000
app.listen(PORT, () => {
  console.log(`✅ Route Chaining server is running at http://localhost:${PORT}\n`)
  console.log('Test commands:')

  console.log(`\n  # User API`)
  console.log(`  # Get list`)
  console.log(`  curl http://localhost:${PORT}/api/users`)

  console.log(`\n  # Create user`)
  console.log(`  curl -X POST http://localhost:${PORT}/api/users \\`)
  console.log(`    -H "Content-Type: application/json" \\`)
  console.log(`    -d '{"name":"John","email":"john@example.com"}'`)

  console.log(`\n  # Get user`)
  console.log(`  curl http://localhost:${PORT}/api/users/1`)

  console.log(`\n  # Update user`)
  console.log(`  curl -X PUT http://localhost:${PORT}/api/users/1 \\`)
  console.log(`    -H "Content-Type: application/json" \\`)
  console.log(`    -d '{"name":"Jane"}'`)

  console.log(`\n  # Partially update user`)
  console.log(`  curl -X PATCH http://localhost:${PORT}/api/users/1 \\`)
  console.log(`    -H "Content-Type: application/json" \\`)
  console.log(`    -d '{"role":"admin"}'`)

  console.log(`\n  # Delete user`)
  console.log(`  curl -X DELETE http://localhost:${PORT}/api/users/1`)

  console.log(`\n  # Article API`)
  console.log(`  curl http://localhost:${PORT}/api/articles`)
  console.log(`  curl "http://localhost:${PORT}/api/articles?published=true"`)

  console.log(`\n  # Route chaining comparison`)
  console.log(`  curl http://localhost:${PORT}/api/comparison`)
  console.log(`  curl -X POST http://localhost:${PORT}/api/comparison`)
})
