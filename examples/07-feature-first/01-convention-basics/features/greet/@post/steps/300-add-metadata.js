/**
 * Step 3: Add metadata
 */
module.exports = async (ctx, req, res) => {
  console.log('🔹 Step 3: Add metadata')

  // v0.4.0: Store directly in ctx
  ctx.metadata = {
    language: ctx.language,
    stepsExecuted: 3,
  }
  // Done! Automatically proceeds to next Step
}
