/**
 * Response step - Send response

 */
module.exports = async (ctx, req, res) => {
  res.status(200).json({
    success: true,
    data: {
      processedData: ctx.processedData,
      timestamp: ctx.timestamp
    }
  })
}
