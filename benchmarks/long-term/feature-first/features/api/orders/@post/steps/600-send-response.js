module.exports = async function sendResponse(ctx, req, res) {
  global.testData.totalStepsExecuted++

  res.status(201).json({
    success: true,
    order: ctx.order,
    processingTime: {
      validation: ctx.validatedAt,
      inventoryCheck: ctx.inventoryCheckedAt - ctx.validatedAt,
      priceCalculation: ctx.priceCalculatedAt - ctx.inventoryCheckedAt,
      orderCreation: ctx.orderCreatedAt - ctx.priceCalculatedAt,
      inventoryUpdate: ctx.inventoryUpdatedAt - ctx.orderCreatedAt,
      total: Date.now() - ctx.validatedAt,
    },
  })
}
