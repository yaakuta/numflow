/**
 * CommonJS Step
 */
module.exports = async (ctx, req, res) => {
  ctx.step2 = 'completed'
  return true
}
