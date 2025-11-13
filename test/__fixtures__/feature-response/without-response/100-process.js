/**
 * Process step - Does not send response (error expected)

 */
module.exports = async (ctx, req, res) => {
  ctx.data = 'no-response'
  return true
}
