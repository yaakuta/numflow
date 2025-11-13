/**
 * Session update step
 * Demonstrates that steps can modify ctx
 */
module.exports = async (ctx, req, res) => {
  ctx.results.updated = true
  return true
}
