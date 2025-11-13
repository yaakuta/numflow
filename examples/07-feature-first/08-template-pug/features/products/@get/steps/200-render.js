module.exports = async function renderProducts(ctx, req, res) {
  console.log('[Step 200] Rendering Pug template...')
  res.render('products/index', {
    title: 'Product Catalog - Numflow',
    products: ctx.products,
  })
  console.log('[Step 200] Rendering complete')
}
