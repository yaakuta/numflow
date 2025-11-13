/**
 * Mock step for session update integration testing
 */

module.exports = async (ctx, req, res) => {
  // Add new data to Context
  ctx.updated = true
  return true
}
