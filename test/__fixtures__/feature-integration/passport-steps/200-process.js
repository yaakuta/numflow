/**
 * Common processing step
 * Used by multiple integration tests
 */
module.exports = async (ctx, req, res) => {
  ctx.results.processed = true
  return true
}
