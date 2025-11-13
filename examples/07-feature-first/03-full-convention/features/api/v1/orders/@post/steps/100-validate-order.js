/**
 * Step 100: Validate Order
 *
 * Validate order data.
 * - productId, quantity, userId required
 * - quantity must be positive
 */

module.exports = async (ctx, req, res) => {
  console.log('🔹 Step 100: Validate order')

  const { productId, quantity, userId } = ctx.orderData

  // Validate required fields
  if (!productId || !quantity || !userId) {
    throw new Error('productId, quantity, and userId are required.')
  }

  // Validate quantity
  if (typeof quantity !== 'number' || quantity <= 0) {
    throw new Error('Please enter a valid quantity. (positive number)')
  }

  console.log('  ✅ Order validation passed')
  console.log(`     - Product ID: ${productId}`)
  console.log(`     - Quantity: ${quantity}`)
  console.log(`     - User ID: ${userId}`)

  ctx.validated = true
  ctx.validatedAt = Date.now()
}
