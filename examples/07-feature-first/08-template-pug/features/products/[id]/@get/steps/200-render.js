module.exports = async function renderProduct(ctx, req, res) {
  console.log('[Step 200] Rendering product detail template...')
  res.render('products/show', {
    title: `${ctx.product.name} - Numflow Products`,
    product: ctx.product,
  })
  console.log('[Step 200] Rendering complete')
}
