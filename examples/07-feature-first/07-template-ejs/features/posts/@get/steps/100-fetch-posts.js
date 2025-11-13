/**
 * Step 100: Fetch Posts
 *
 * Fetch the list of posts.
 *
 * @param {Object} ctx - Feature context
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @returns {void}
 */
module.exports = async function fetchPosts(ctx, req, res) {
  console.log('[Step 100] Fetching post list...')

  // Get posts from global data
  // In production, use database queries
  const posts = global.posts || []

  // Store in context (for use in next step)
  ctx.posts = posts

  console.log(`[Step 100] Found ${posts.length} posts.`)
}
