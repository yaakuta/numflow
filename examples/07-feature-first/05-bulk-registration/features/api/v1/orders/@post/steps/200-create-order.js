/**
 * Step 200: Create Order
 */
module.exports = async function createOrder(ctx, req, res) {
  console.log('🔹 Step 200: Creating order in database')

  const { orderData, userId } = ctx

  // In production, save to database
  const order = {
    orderId: `ORD-${Date.now()}`,
    userId,
    product: orderData.product,
    quantity: orderData.quantity,
    status: 'pending',
    createdAt: new Date().toISOString(),
  }

  console.log(`   ✓ Order created: ${order.orderId}`)

  ctx.order = order
}
