module.exports = async (ctx, req, res) => {
  console.log('🔹 Step 3: Sending response')

  res.status(200).json({
    success: true,
    data: ctx,
  })
  return // ⚠️ return required! res.json() alone does not stop the function
}
