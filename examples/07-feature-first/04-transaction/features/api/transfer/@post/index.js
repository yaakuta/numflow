const numflow = require("../../../../../../../dist/cjs/index.js")

module.exports = numflow.feature({
  contextInitializer: (ctx, req, res) => {
    const transactionId = Math.random().toString(36).substring(7)
    console.log(`  ⚡ Starting transaction (ID: ${transactionId})`)
    const snapshot = JSON.parse(JSON.stringify(global.accounts))
    ctx.from = req.body.from
    ctx.to = req.body.to
    ctx.amount = req.body.amount
    ctx.transactionId = transactionId
    ctx.snapshot = snapshot
  },
  onError: async (error, ctx, req, res) => {
    console.log('  ❌ Error occurred! Rolling back transaction...')
    console.log(`  Error message: ${error.message}`)
    if (ctx.snapshot) {
      global.accounts = ctx.snapshot
      console.log('  🔄 Transaction rollback complete')
    }
    res.statusCode = 400
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ success: false, error: error.message, transactionId: ctx.transactionId }))
  },
})
