/**
 * Step 1: Process Transfer
 */

module.exports = async (ctx, req, res) => {
  const { from, to, amount } = ctx

  console.log(`  💸 Processing transfer: ${from} → ${to}, ${amount} KRW`)

  // Implement actual transfer logic here
  // In this example, just save result to ctx
  ctx.transferCompleted = true
  ctx.transferredAt = new Date().toISOString()
}
