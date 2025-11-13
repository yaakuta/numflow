module.exports = async function checkInventory(ctx, req, res) {
  global.testData.totalStepsExecuted++

  const product = global.testData.products.find((p) => p.id === ctx.productId)

  if (!product) {
    throw new Error('Product not found')
  }

  if (product.stock < ctx.quantity) {
    throw new Error('Insufficient stock')
  }

  ctx.product = product
  ctx.inventoryCheckedAt = Date.now()
}
