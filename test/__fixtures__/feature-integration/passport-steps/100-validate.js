/**
 * Common validation step
 * Used by multiple integration tests
 */
module.exports = async (ctx, req, res) => {
  ctx.results.validated = true
  // Copy userId, username set in contextInitializer to results
  ctx.results.userId = ctx.userId
  ctx.results.username = ctx.username
  return true
}
