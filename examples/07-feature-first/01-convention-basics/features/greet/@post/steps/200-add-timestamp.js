/**
 * Step 2: Add timestamp
 */
module.exports = async (ctx, req, res) => {
  console.log('🔹 Step 2: Add timestamp')

  // v0.4.0: Store directly in ctx
  ctx.timestamp = new Date().toISOString()
  // Done! Automatically proceeds to next Step
}
