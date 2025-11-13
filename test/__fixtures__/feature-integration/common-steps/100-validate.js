/**
 * Common validation step
 * Used by multiple integration tests
 */
module.exports = async (ctx, req, res) => {
  ctx.results.validated = true
  return true
}
