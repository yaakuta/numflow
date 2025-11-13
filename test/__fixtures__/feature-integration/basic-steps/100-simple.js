/**
 * Simplest possible step

 */
module.exports = async (ctx, req, res) => {
  ctx.executed = true
  return true
}
