/**
 * Step 300: Send Order Confirmation
 */
module.exports = async function sendConfirmation(ctx, req, res) {
  console.log('🔹 Step 300: Sending order confirmation')

  const { order } = ctx

  // In production, send email/SMS
  console.log(`   ✓ Confirmation sent for order ${order.orderId}`)

  ctx.confirmationSent = true
  ctx.confirmationTimestamp = new Date().toISOString()
}
