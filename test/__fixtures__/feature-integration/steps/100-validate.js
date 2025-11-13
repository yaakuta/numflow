/**
 * Mock step for integration testing
 */

module.exports = async (ctx, req, res) => {
  ctx.validated = true
  return true
}
