/**
 * Process step - Process data

 */
module.exports = async (ctx, req, res) => {
  ctx.processedData = 'test-data'
  ctx.timestamp = Date.now()
  return true
}
