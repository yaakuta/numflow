module.exports = async function calculatePrice(ctx, req, res) {
  global.testData.totalStepsExecuted++

  const basePrice = ctx.product.price * ctx.quantity

  // Simulate complex price calculation
  let discount = 0
  if (ctx.quantity >= 10) {
    discount = 0.1 // 10% discount
  } else if (ctx.quantity >= 5) {
    discount = 0.05 // 5% discount
  }

  const tax = 0.1 // 10% tax
  const subtotal = basePrice * (1 - discount)
  const totalPrice = subtotal * (1 + tax)

  ctx.pricing = {
    basePrice,
    discount,
    subtotal,
    tax,
    totalPrice: Math.round(totalPrice * 100) / 100,
  }

  ctx.priceCalculatedAt = Date.now()
}
