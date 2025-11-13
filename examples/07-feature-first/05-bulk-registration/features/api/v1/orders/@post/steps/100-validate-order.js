/**
 * Step 100: Validate Order Data
 */
module.exports = async function validateOrder(ctx, req, res) {
  console.log('🔹 Step 100: Validating order data')

  const { orderData } = ctx

  if (!orderData || !orderData.product || !orderData.quantity) {
    throw new Error('Invalid order data: product and quantity required')
  }

  if (orderData.quantity <= 0) {
    throw new Error('Quantity must be greater than 0')
  }

  ctx.validated = true
}
