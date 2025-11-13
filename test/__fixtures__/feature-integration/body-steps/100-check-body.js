/**
 * Check if body was parsed

 */
module.exports = async (ctx, req, res) => {
  if (ctx.requestBody && typeof ctx.requestBody === 'object') {
    ctx.bodyParsed = true
    ctx.username = ctx.requestBody.username
    ctx.password = ctx.requestBody.password
  } else {
    ctx.bodyParsed = false
    ctx.requestBody = ctx.requestBody
  }
  return true
}
