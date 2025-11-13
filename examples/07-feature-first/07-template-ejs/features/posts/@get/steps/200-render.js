/**
 * Step 200: Render Template
 *
 * Render the post list using EJS template.
 *
 * @param {Object} ctx - Feature context
 * @param {Array} ctx.posts - Post list
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @returns {void}
 */
module.exports = async function renderTemplate(ctx, req, res) {
  console.log('[Step 200] Rendering template...')

  // Get data from context
  const { posts } = ctx

  // Render EJS template
  // Uses views/posts/index.ejs file
  res.render('posts/index', {
    title: 'Blog Posts - Numflow',
    posts,
  })

  console.log('[Step 200] Template rendering complete')
}
