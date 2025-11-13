module.exports = async function commitTransaction(ctx, req, res) {
  global.testData.totalStepsExecuted++

  if (ctx.transaction) {
    ctx.transaction.status = 'committed'
    ctx.transaction.committedAt = Date.now()
    global.testData.transactionsCommitted++
  }
}
