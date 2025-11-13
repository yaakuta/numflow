/**
 * Session-specific step
 * Uses session data from ctx
 */
module.exports = async (ctx, req, res) => {
  // contextInitializer should have set userId from session
  ctx.results.sessionUserId = ctx.userId
  return true
}
