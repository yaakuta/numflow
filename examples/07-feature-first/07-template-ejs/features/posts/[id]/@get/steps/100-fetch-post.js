/**
 * Step 100: Fetch Post by ID
 *
 * Fetch a specific post by ID.
 *
 * @param {Object} ctx - Feature context
 * @param {Object} req - Request object
 * @param {Object} req.params - Route parameters
 * @param {string} req.params.id - Post ID
 * @param {Object} res - Response object
 * @returns {void}
 */
module.exports = async function fetchPost(ctx, req, res) {
  const postId = parseInt(req.params.id, 10)

  console.log(`[Step 100] Fetching post... (ID: ${postId})`)

  // Find post from global data
  // In production, use database queries
  const posts = global.posts || []
  const post = posts.find((p) => p.id === postId)

  // Return 404 error if post not found
  if (!post) {
    console.log(`[Step 100] Post not found. (ID: ${postId})`)
    const error = new Error(`Post not found (ID: ${postId})`)
    error.statusCode = 404
    throw error
  }

  // Store in context (for use in next step)
  ctx.post = post

  console.log(`[Step 100] Post found: "${post.title}"`)
}
