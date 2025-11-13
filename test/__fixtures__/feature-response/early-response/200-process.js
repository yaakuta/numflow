/**
 * Process step - This step only executes when validation succeeds

 */
module.exports = async (ctx, req, res) => {
  ctx.processed = true
  ctx.step200Executed = true
  return true
}
