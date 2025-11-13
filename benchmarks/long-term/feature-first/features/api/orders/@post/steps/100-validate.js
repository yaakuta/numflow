module.exports = async function validate(ctx, req, res) {
  global.testData.totalStepsExecuted++

  const { userId, productId, quantity } = req.body

  if (!userId || !productId || !quantity) {
    throw new Error('Missing required fields')
  }

  if (quantity <= 0) {
    throw new Error('Invalid quantity')
  }

  // Save to context
  ctx.userId = userId
  ctx.productId = productId
  ctx.quantity = quantity
  ctx.validatedAt = Date.now()
}
