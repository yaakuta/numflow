module.exports = async (context, req, res) => {
  context.step10 = 'processed-10'

  // Send response (last step)
  res.json({ success: true, result: context })
}
