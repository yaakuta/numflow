/**
 * Async Task: Update Analytics Data
 *
 * Update order analytics data.
 * (Executed asynchronously in background)
 *
 * @param {Object} ctx - Context object (includes data created in Steps)
 */

module.exports = async (ctx) => {
  console.log('\n📊 [Async Task] Starting analytics data update')

  const { order } = ctx

  // Simulate analytics data update (in production, call analytics service API)
  await new Promise((resolve) => setTimeout(resolve, 800)) // 0.8 second delay

  console.log('  ✅ Analytics data update complete')
  console.log(`     - Order ID: ${order.orderId}`)
  console.log(`     - Product ID: ${order.productId}`)
  console.log(`     - Quantity: ${order.quantity}`)
  console.log(`     - Amount: ${order.totalAmount.toLocaleString()} KRW`)
  console.log(`     - User: ${order.userId}`)

  // In production, call analytics service
  // await analyticsService.track({
  //   event: 'order_created',
  //   properties: {
  //     orderId: order.orderId,
  //     productId: order.productId,
  //     quantity: order.quantity,
  //     totalAmount: order.totalAmount,
  //     userId: order.userId
  //   }
  // })

  ctx.analyticsUpdated = true
  ctx.updatedAt = Date.now()
}
