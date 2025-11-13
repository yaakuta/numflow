module.exports = async function fetchProducts(ctx, req, res) {
  console.log('[Step 100] Fetching product list...')
  ctx.products = global.products || []
  console.log(`[Step 100] Found ${ctx.products.length} products.`)
}
