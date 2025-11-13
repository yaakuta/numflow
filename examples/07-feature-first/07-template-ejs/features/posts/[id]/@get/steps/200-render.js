/**
 * Step 200: Render Post Detail
 *
 * Render post detail using EJS template.
 *
 * @param {Object} ctx - Feature context
 * @param {Object} ctx.post - Post data
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @returns {void}
 */
module.exports = async function renderPostDetail(ctx, req, res) {
  console.log('[Step 200] Rendering post detail template...')

  // Get data from context
  const { post } = ctx

  // Render EJS template
  // Uses views/posts/show.ejs file
  res.render('posts/show', {
    title: `${post.title} - Numflow Blog`,
    post,
  })

  console.log('[Step 200] Post detail rendering complete')
}
