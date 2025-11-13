/**
 * Step 200: Check Inventory
 *
 * Check inventory and verify availability.
 * (In production, query from database)
 */

module.exports = async (ctx, req, res) => {
  console.log('🔹 Step 200: Check inventory')

  const { productId, quantity } = ctx.orderData

  // In production, query from database
  // const inventory = await db.inventory.findOne({ productId })
  // Simulation for this example
  const mockInventory = {
    PROD001: 50,
    PROD002: 30,
    PROD003: 10,
  }

  const availableStock = mockInventory[productId] || 0

  console.log(`  📦 Current stock: ${availableStock}`)
  console.log(`  🛒 Requested quantity: ${quantity}`)

  // Validate sufficient stock
  if (availableStock < quantity) {
    throw new Error(`Insufficient stock. (available: ${availableStock}, requested: ${quantity})`)
  }

  console.log('  ✅ Inventory check complete - order available')

  ctx.inventory = {
    productId,
    availableStock,
    requestedQuantity: quantity,
    remainingStock: availableStock - quantity,
  }
}
