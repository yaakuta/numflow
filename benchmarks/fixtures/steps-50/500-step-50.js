module.exports = async (context, req, res) => {
  context.step50 = 'processed-50'

  // Send response (last step)
  res.json({ success: true, result: context })
}
