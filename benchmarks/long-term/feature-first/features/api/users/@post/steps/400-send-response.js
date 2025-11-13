module.exports = async function sendResponse(ctx, req, res) {
  global.testData.totalStepsExecuted++

  res.status(201).json({
    success: true,
    user: ctx.user,
    transaction: {
      id: ctx.transaction.id,
      status: ctx.transaction.status,
      duration: ctx.transaction.committedAt - ctx.transaction.startedAt,
    },
  })
}
