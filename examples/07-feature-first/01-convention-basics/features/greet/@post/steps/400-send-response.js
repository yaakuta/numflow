/**
 * Step 4: Send response
 */
module.exports = async (ctx, req, res) => {
  console.log('🔹 Step 4: Send response')

  // v0.3.0: ctx contains only pure business data
  const data = ctx
  res.status(200).json({
    success: true,
    data,
  })
  return // ⚠️ return required! res.json() alone does not stop the function
}
