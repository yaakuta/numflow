/**
 * Passport-specific user validation step
 * Verifies that userId and username are properly set in ctx
 */
module.exports = async (ctx, req, res) => {
  // contextInitializer should have set userId and username
  if (typeof ctx.userId !== 'number') {
    throw new Error('userId not found in ctx')
  }
  if (typeof ctx.username !== 'string') {
    throw new Error('username not found in ctx')
  }

  ctx.results.userChecked = true
  // Copy ctx information to results
  ctx.results.userId = ctx.userId
  ctx.results.username = ctx.username
  ctx.results.email = ctx.email
  return true
}
