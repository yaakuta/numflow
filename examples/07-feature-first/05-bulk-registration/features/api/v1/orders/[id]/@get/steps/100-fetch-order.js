module.exports = async (ctx, req, res) => {
  console.log('🔹 Step 1: Fetching order from database')

  const orderId = req.params?.id

  // In production, query from database
  const order = {
    orderId,
    userId: 'user-123',
    product: 'MacBook Pro',
    quantity: 1,
    status: 'delivered',
    createdAt: '2025-10-15T10:00:00Z',
    deliveredAt: '2025-10-16T14:30:00Z',
  }

  console.log(`   ✓ Order found: ${orderId}`)

  // v0.4.0: Store directly in Context
  ctx.order = order
  // Done! Automatically proceeds to next Step
}
