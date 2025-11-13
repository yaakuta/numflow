module.exports = async function fetchProduct(ctx, req, res) {
  const productId = parseInt(req.params.id, 10)
  console.log(`[Step 100] Fetching product... (ID: ${productId})`)

  const products = global.products || []
  const product = products.find((p) => p.id === productId)

  if (!product) {
    const error = new Error(`Product not found (ID: ${productId})`)
    error.statusCode = 404
    throw error
  }

  ctx.product = product
  console.log(`[Step 100] Product found: "${product.name}"`)
}
