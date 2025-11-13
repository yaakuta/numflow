/**
 * Mock step for integration testing
 */

module.exports = async (ctx, req, res) => {
  ctx.processed = true
  return true
}
