module.exports = async (ctx, req, res) => {
  console.log('🔹 Step 2: Adding metadata')

  // v0.4.0: Store directly in Context
  ctx.metadata = {
    fetchedAt: new Date().toISOString(),
    version: 'v1',
  }
  // Done! Automatically proceeds to next Step
}
