/**
 * Response step - Only executes when validation succeeds

 */
module.exports = async (ctx, req, res) => {
  res.status(200).json({
    success: true,
    data: {
      validated: ctx.validated,
      processed: ctx.processed,
      step200Executed: ctx.step200Executed
    }
  })
}
