/**
 * Step 900: Send Response
 *
 * Send final response to client.
 */

module.exports = async (ctx, req, res) => {
  // v0.3.0: ctx contains only pure business data
  const data = ctx

  console.log('🔹 Step 900: Send response')

  res.status(201).json({
    success: true,
    data,
  })
}
