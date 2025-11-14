/**
 * CommonJS Step
 */
module.exports = async (ctx, req, res) => {
  ctx.step1 = 'completed'
  return true
}
