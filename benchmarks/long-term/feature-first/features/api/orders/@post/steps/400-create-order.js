module.exports = async function createOrder(ctx, req, res) {
  global.testData.totalStepsExecuted++

  const order = {
    id: global.testData.orders.length + 1,
    userId: ctx.userId,
    productId: ctx.productId,
    quantity: ctx.quantity,
    pricing: ctx.pricing,
    status: 'pending',
    createdAt: new Date().toISOString(),
  }

  global.testData.orders.push(order)

  ctx.order = order
  ctx.orderCreatedAt = Date.now()
}
