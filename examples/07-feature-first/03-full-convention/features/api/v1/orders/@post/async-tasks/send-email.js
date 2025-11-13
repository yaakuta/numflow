/**
 * Async Task: Send Email
 *
 * Send order confirmation email to user.
 * (Executed asynchronously in background)
 *
 * @param {Object} ctx - Context object (includes data created in Steps)
 */

module.exports = async (ctx) => {
  console.log('\n📧 [Async Task] Starting email send')

  const { order } = ctx

  // Simulate email send (in production, call email service API)
  await new Promise((resolve) => setTimeout(resolve, 1000)) // 1 second delay

  console.log('  ✅ Email send complete')
  console.log(`     - Recipient: ${order.userId}`)
  console.log(`     - Subject: Order Confirmation - ${order.orderId}`)
  console.log(`     - Content: Your order has been successfully placed.`)
  console.log(`     - Total amount: ${order.totalAmount.toLocaleString()} KRW`)

  // In production, call email service
  // await emailService.send({
  //   to: order.userId,
  //   subject: `Order Confirmation - ${order.orderId}`,
  //   body: `Your order has been successfully placed. Total amount: ${order.totalAmount} KRW`
  // })

  ctx.emailSent = true
  ctx.sentAt = Date.now()
}
