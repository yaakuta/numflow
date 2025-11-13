module.exports = async function updateInventory(ctx, req, res) {
  global.testData.totalStepsExecuted++

  // Update inventory
  const product = global.testData.products.find((p) => p.id === ctx.productId)
  if (product) {
    product.stock -= ctx.quantity
  }

  ctx.inventoryUpdatedAt = Date.now()
}
