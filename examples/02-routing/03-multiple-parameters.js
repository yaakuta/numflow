/**
 * 03-multiple-parameters.js
 *
 * Example of using route parameters together with query strings.
 * Learn how to implement complex REST API endpoints.
 *
 * Learning Objectives:
 * - Combining route parameters + query strings
 * - Nested Resources (Hierarchical Resources)
 * - RESTful API patterns
 *
 * How to Run:
 * node examples/02-routing/03-multiple-parameters.js
 *
 * Testing:
 * # User's posts list
 * curl "http://localhost:3000/users/1/posts"
 * curl "http://localhost:3000/users/1/posts?page=1&limit=2"
 *
 * # User's specific post
 * curl "http://localhost:3000/users/1/posts/101"
 *
 * # Post's comments
 * curl "http://localhost:3000/posts/101/comments"
 * curl "http://localhost:3000/posts/101/comments?sortBy=date&order=desc"
 */

const numflow = require('../../dist/cjs/index.js')

const app = numflow()

// ===========================================
// In-memory database
// ===========================================

const users = [
  { id: 1, name: 'Alice', email: 'alice@example.com' },
  { id: 2, name: 'Bob', email: 'bob@example.com' },
  { id: 3, name: 'Charlie', email: 'charlie@example.com' },
]

const posts = [
  { id: 101, userId: 1, title: 'First Post', content: 'Hello World', likes: 10 },
  { id: 102, userId: 1, title: 'Second Post', content: 'Great day!', likes: 5 },
  { id: 103, userId: 2, title: 'Bob Post', content: 'Nice weather', likes: 8 },
  { id: 104, userId: 2, title: 'Another Bob Post', content: 'Learning Numflow', likes: 15 },
  { id: 105, userId: 3, title: 'Charlie Post', content: 'Coffee time', likes: 3 },
]

const comments = [
  { id: 1, postId: 101, author: 'Bob', text: 'Great!', date: '2024-10-10' },
  { id: 2, postId: 101, author: 'Charlie', text: 'Nice post', date: '2024-10-11' },
  { id: 3, postId: 102, author: 'Bob', text: 'Cool', date: '2024-10-12' },
  { id: 4, postId: 103, author: 'Alice', text: 'I agree', date: '2024-10-13' },
  { id: 5, postId: 101, author: 'Alice', text: 'Thanks!', date: '2024-10-14' },
]

// ===========================================
// 1. User's Posts List
// ===========================================

// GET /users/:userId/posts
// Route parameters: userId
// Query strings: page, limit (optional)
app.get('/users/:userId/posts', (req, res) => {
  const userId = parseInt(req.params.userId)
  const page = parseInt(req.query.page) || 1
  const limit = parseInt(req.query.limit) || 10

  // Check if user exists
  const user = users.find((u) => u.id === userId)
  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'User not found.',
    })
  }

  // Filter posts for this user
  const userPosts = posts.filter((p) => p.userId === userId)

  // Pagination
  const startIndex = (page - 1) * limit
  const endIndex = page * limit
  const paginatedPosts = userPosts.slice(startIndex, endIndex)

  res.json({
    success: true,
    user: { id: user.id, name: user.name },
    pagination: {
      currentPage: page,
      limit: limit,
      totalItems: userPosts.length,
      totalPages: Math.ceil(userPosts.length / limit),
    },
    data: paginatedPosts,
  })
})

// ===========================================
// 2. User's Specific Post
// ===========================================

// GET /users/:userId/posts/:postId
// Route parameters: userId, postId
app.get('/users/:userId/posts/:postId', (req, res) => {
  const userId = parseInt(req.params.userId)
  const postId = parseInt(req.params.postId)

  // Check user
  const user = users.find((u) => u.id === userId)
  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'User not found.',
    })
  }

  // Check post (verify it belongs to this user)
  const post = posts.find((p) => p.id === postId && p.userId === userId)
  if (!post) {
    return res.status(404).json({
      success: false,
      error: 'Post not found or does not belong to this user.',
    })
  }

  res.json({
    success: true,
    user: { id: user.id, name: user.name },
    data: post,
  })
})

// ===========================================
// 3. Post's Comments List
// ===========================================

// GET /posts/:postId/comments
// Route parameters: postId
// Query strings: sortBy, order (optional)
app.get('/posts/:postId/comments', (req, res) => {
  const postId = parseInt(req.params.postId)
  const sortBy = req.query.sortBy || 'id'
  const order = req.query.order || 'asc'

  // Check if post exists
  const post = posts.find((p) => p.id === postId)
  if (!post) {
    return res.status(404).json({
      success: false,
      error: 'Post not found.',
    })
  }

  // Filter comments for this post
  let postComments = comments.filter((c) => c.postId === postId)

  // Sorting
  postComments.sort((a, b) => {
    if (order === 'asc') {
      return a[sortBy] > b[sortBy] ? 1 : -1
    } else {
      return a[sortBy] < b[sortBy] ? 1 : -1
    }
  })

  res.json({
    success: true,
    post: { id: post.id, title: post.title },
    sorting: { sortBy, order },
    count: postComments.length,
    data: postComments,
  })
})

// ===========================================
// 4. Post's Specific Comment
// ===========================================

// GET /posts/:postId/comments/:commentId
// Route parameters: postId, commentId
app.get('/posts/:postId/comments/:commentId', (req, res) => {
  const postId = parseInt(req.params.postId)
  const commentId = parseInt(req.params.commentId)

  // Check post
  const post = posts.find((p) => p.id === postId)
  if (!post) {
    return res.status(404).json({
      success: false,
      error: 'Post not found.',
    })
  }

  // Check comment (verify it belongs to this post)
  const comment = comments.find((c) => c.id === commentId && c.postId === postId)
  if (!comment) {
    return res.status(404).json({
      success: false,
      error: 'Comment not found or does not belong to this post.',
    })
  }

  res.json({
    success: true,
    post: { id: post.id, title: post.title },
    data: comment,
  })
})

// ===========================================
// 5. Complex Nested Structure
// ===========================================

// GET /users/:userId/posts/:postId/comments
// User → Post → Comments (3-level hierarchy)
app.get('/users/:userId/posts/:postId/comments', (req, res) => {
  const userId = parseInt(req.params.userId)
  const postId = parseInt(req.params.postId)

  // Check user
  const user = users.find((u) => u.id === userId)
  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'User not found.',
    })
  }

  // Check post (verify it belongs to this user)
  const post = posts.find((p) => p.id === postId && p.userId === userId)
  if (!post) {
    return res.status(404).json({
      success: false,
      error: 'Post not found or does not belong to this user.',
    })
  }

  // Filter comments
  const postComments = comments.filter((c) => c.postId === postId)

  res.json({
    success: true,
    user: { id: user.id, name: user.name },
    post: { id: post.id, title: post.title },
    count: postComments.length,
    data: postComments,
  })
})

// ===========================================
// 6. Statistics Endpoint
// ===========================================

// GET /users/:userId/stats?metric=posts,comments
app.get('/users/:userId/stats', (req, res) => {
  const userId = parseInt(req.params.userId)
  const metrics = req.query.metric ? req.query.metric.split(',') : ['posts']

  // Check user
  const user = users.find((u) => u.id === userId)
  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'User not found.',
    })
  }

  const stats = {}

  // Posts statistics
  if (metrics.includes('posts')) {
    const userPosts = posts.filter((p) => p.userId === userId)
    const totalLikes = userPosts.reduce((sum, post) => sum + post.likes, 0)

    stats.posts = {
      total: userPosts.length,
      totalLikes: totalLikes,
      avgLikes: userPosts.length > 0 ? totalLikes / userPosts.length : 0,
    }
  }

  // Comments statistics
  if (metrics.includes('comments')) {
    const userPostIds = posts.filter((p) => p.userId === userId).map((p) => p.id)
    const commentsOnUserPosts = comments.filter((c) => userPostIds.includes(c.postId))

    stats.comments = {
      received: commentsOnUserPosts.length,
    }
  }

  res.json({
    success: true,
    user: { id: user.id, name: user.name },
    metrics: metrics,
    stats: stats,
  })
})

// ===========================================
// Start Server
// ===========================================

const PORT = 3000
app.listen(PORT, () => {
  console.log(
    `✅ Multiple Parameters server is running at http://localhost:${PORT}\n`
  )
  console.log('Test commands:')

  console.log(`\n  # 1. User's posts list`)
  console.log(`  curl "http://localhost:${PORT}/users/1/posts"`)
  console.log(`  curl "http://localhost:${PORT}/users/1/posts?page=1&limit=2"`)

  console.log(`\n  # 2. User's specific post`)
  console.log(`  curl "http://localhost:${PORT}/users/1/posts/101"`)
  console.log(`  curl "http://localhost:${PORT}/users/2/posts/103"`)

  console.log(`\n  # 3. Post's comments list`)
  console.log(`  curl "http://localhost:${PORT}/posts/101/comments"`)
  console.log(`  curl "http://localhost:${PORT}/posts/101/comments?sortBy=date&order=desc"`)

  console.log(`\n  # 4. Post's specific comment`)
  console.log(`  curl "http://localhost:${PORT}/posts/101/comments/1"`)

  console.log(`\n  # 5. Complex nested structure`)
  console.log(`  curl "http://localhost:${PORT}/users/1/posts/101/comments"`)

  console.log(`\n  # 6. Statistics`)
  console.log(`  curl "http://localhost:${PORT}/users/1/stats?metric=posts,comments"`)
})
