/**
 * Mock step for integration testing
 * Checks if user ctx is properly set
 */

module.exports = async (ctx, req, res) => {
  // Verify values set in contextInitializer
  if (!ctx.userId) {
    throw new Error('userId not found in ctx')
  }

  ctx.userChecked = true
  return true
}
