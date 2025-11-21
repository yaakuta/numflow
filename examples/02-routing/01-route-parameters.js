/**
 * 01-route-parameters.js
 *
 * Example using dynamic route parameters.
 * Handles parts of the URL path as variables.
 *
 * Learning Objectives:
 * - Defining dynamic parameters with :param syntax
 * - Reading parameter values with req.params
 * - Parameter validation
 *
 * How to Run:
 * node examples/02-routing/01-route-parameters.js
 *
 * Testing:
 * curl http://localhost:3000/users/123
 * curl http://localhost:3000/users/alice
 * curl http://localhost:3000/products/macbook-pro
 * curl http://localhost:3000/posts/2024/10/hello-world
 */

const numflow = require("numflow")

const app = numflow()

// ===========================================
// In-memory database
// ===========================================

const users = [
  { id: 1, name: 'Alice', age: 25 },
  { id: 2, name: 'Bob', age: 30 },
  { id: 3, name: 'Charlie', age: 35 },
]

const products = [
  { id: 'macbook-pro', name: 'MacBook Pro', price: 2499 },
  { id: 'iphone-15', name: 'iPhone 15', price: 999 },
  { id: 'airpods-pro', name: 'AirPods Pro', price: 249 },
]

const posts = [
  { year: 2024, month: 10, slug: 'hello-world', title: 'Hello World' },
  { year: 2024, month: 9, slug: 'getting-started', title: 'Getting Started' },
]

// ===========================================
// 1. Basic Parameters (Numeric ID)
// ===========================================

// /users/:id
// :id is a dynamic parameter (can receive any value)
app.get('/users/:id', (req, res) => {
  // Read parameter value with req.params.id
  const userId = parseInt(req.params.id)

  // Handle non-numeric case
  if (isNaN(userId)) {
    return res.status(400).json({
      success: false,
      error: 'ID must be a number.',
    })
  }

  // Find user
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

// ===========================================
// 2. String Parameters (Slug)
// ===========================================

// /products/:slug
// Slug is a URL-friendly string (e.g., macbook-pro)
app.get('/products/:slug', (req, res) => {
  const productSlug = req.params.slug

  const product = products.find((p) => p.id === productSlug)

  if (!product) {
    return res.status(404).json({
      success: false,
      error: 'Product not found.',
    })
  }

  res.json({
    success: true,
    data: product,
  })
})

// ===========================================
// 3. Multiple Parameters
// ===========================================

// /posts/:year/:month/:slug
// Using multiple parameters simultaneously
app.get('/posts/:year/:month/:slug', (req, res) => {
  // All parameters are in req.params
  const { year, month, slug } = req.params

  // Convert to numbers
  const yearNum = parseInt(year)
  const monthNum = parseInt(month)

  if (isNaN(yearNum) || isNaN(monthNum)) {
    return res.status(400).json({
      success: false,
      error: 'year and month must be numbers.',
    })
  }

  // Find post
  const post = posts.find(
    (p) => p.year === yearNum && p.month === monthNum && p.slug === slug
  )

  if (!post) {
    return res.status(404).json({
      success: false,
      error: 'Post not found.',
    })
  }

  res.json({
    success: true,
    data: post,
  })
})

// ===========================================
// 4. Parameter Debugging Route
// ===========================================

// Return all parameters as-is (for debugging)
// Optional parameters are not supported, so routes are separated
app.get('/debug/:param1', (req, res) => {
  res.json({
    params: req.params,
    paramKeys: Object.keys(req.params),
  })
})

app.get('/debug/:param1/:param2', (req, res) => {
  res.json({
    params: req.params,
    paramKeys: Object.keys(req.params),
  })
})

app.get('/debug/:param1/:param2/:param3', (req, res) => {
  res.json({
    params: req.params,
    paramKeys: Object.keys(req.params),
  })
})

// ===========================================
// Start Server
// ===========================================

const PORT = 3000
app.listen(PORT, () => {
  console.log(`✅ Route Parameters server is running at http://localhost:${PORT}\n`)
  console.log('Test commands:')
  console.log(`  # Get user (numeric ID)`)
  console.log(`  curl http://localhost:${PORT}/users/1`)
  console.log(`  curl http://localhost:${PORT}/users/123\n`)

  console.log(`  # Get product (string Slug)`)
  console.log(`  curl http://localhost:${PORT}/products/macbook-pro`)
  console.log(`  curl http://localhost:${PORT}/products/iphone-15\n`)

  console.log(`  # Get post (multiple parameters)`)
  console.log(`  curl http://localhost:${PORT}/posts/2024/10/hello-world`)
  console.log(`  curl http://localhost:${PORT}/posts/2024/9/getting-started\n`)

  console.log(`  # Debugging (optional parameters)`)
  console.log(`  curl http://localhost:${PORT}/debug/foo`)
  console.log(`  curl http://localhost:${PORT}/debug/foo/bar`)
  console.log(`  curl http://localhost:${PORT}/debug/foo/bar/baz`)
})
