/**
 * express.Router Compatibility Example
 * Numflow provides the same Router API as Express.
 */

const numflow = require('../../dist/cjs/index.js')
const app = numflow()

// ===================================
// 1. Router Factory Function - Same as Express
// ===================================
const apiRouter = numflow.Router()
const usersRouter = numflow.Router()
const postsRouter = numflow.Router()

// ===================================
// 2. Router-Level Middleware
// ===================================
// Apply common middleware to apiRouter
apiRouter.use((req, res, next) => {
  console.log(`[API] ${req.method} ${req.url}`)
  next()
})

// ===================================
// 3. Users Router - Basic Routes
// ===================================
usersRouter.get('/', (req, res) => {
  res.json({
    message: 'Users list',
    users: [
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' },
    ],
  })
})

usersRouter.get('/:id', (req, res) => {
  res.json({
    message: 'User detail',
    user: { id: req.params.id, name: 'Alice' },
  })
})

usersRouter.post('/', (req, res) => {
  res.status(201).json({
    message: 'User created',
    user: { id: 3, name: req.body.name },
  })
})

// ===================================
// 4. Posts Router - Nested Routes
// ===================================
postsRouter.get('/', (req, res) => {
  res.json({
    message: 'Posts list',
    posts: [
      { id: 1, title: 'First Post' },
      { id: 2, title: 'Second Post' },
    ],
  })
})

postsRouter.get('/:id', (req, res) => {
  res.json({
    message: 'Post detail',
    post: { id: req.params.id, title: 'First Post' },
  })
})

// ===================================
// 5. Nested Routers - Router within Router
// ===================================
// Mount postsRouter inside usersRouter
usersRouter.use('/:userId/posts', postsRouter)

// ===================================
// 6. Mount Router to Application
// ===================================
// Mount usersRouter to apiRouter
apiRouter.use('/users', usersRouter)

// Mount apiRouter to app
app.use('/api', apiRouter)

// ===================================
// 7. Start Server
// ===================================
const PORT = 3000
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
  console.log(`
Test commands:

# 1. Get users list
curl http://localhost:${PORT}/api/users

# 2. Get specific user
curl http://localhost:${PORT}/api/users/123

# 3. Create user
curl -X POST http://localhost:${PORT}/api/users \\
  -H "Content-Type: application/json" \\
  -d '{"name":"Charlie"}'

# 4. Get posts list
curl http://localhost:${PORT}/api/users/123/posts

# 5. Get specific post
curl http://localhost:${PORT}/api/users/123/posts/456

Works with 100% identical API to Express! 🎉
`)
})

/**
 * Key Concepts:
 *
 * 1. numflow.Router() - Create Router instance like Express
 * 2. router.use(middleware) - Router-level middleware
 * 3. router.get/post/put/delete() - Register routes
 * 4. router.use('/path', nestedRouter) - Nested routers
 * 5. app.use('/path', router) - Mount Router to Application
 *
 * Resulting URL Structure:
 * - /api/users → usersRouter's '/' route
 * - /api/users/123 → usersRouter's '/:id' route
 * - /api/users/123/posts → postsRouter's '/' route
 * - /api/users/123/posts/456 → postsRouter's '/:id' route
 *
 * Benefits:
 * - Modularization: Separate Routers by feature for better management
 * - Nesting: Mount Routers within Routers for hierarchical structure
 * - Middleware: Apply common logic with Router-level middleware
 * - Reusability: Mount the same Router to multiple paths
 */
