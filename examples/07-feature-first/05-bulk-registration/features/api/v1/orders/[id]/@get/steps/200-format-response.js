module.exports = async (ctx, req, res) => {
  console.log('🔹 Step 2: Formatting response')

  // v0.4.0: Read from Context and store directly in Context
  ctx.formatted = true
  ctx.fetchedAt = new Date().toISOString()
  // Done! Automatically proceeds to next Step
}
