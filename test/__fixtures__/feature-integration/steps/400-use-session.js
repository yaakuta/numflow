/**
 * Mock step for session integration testing
 */

module.exports = async (ctx, req, res) => {
  ctx.sessionUserId = ctx.userId
  return true
}
