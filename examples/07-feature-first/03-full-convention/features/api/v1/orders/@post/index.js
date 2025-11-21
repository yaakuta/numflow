/**
 * Create Order Feature
 *
 * Complete Convention over Configuration demo:
 * - method: 'POST' ← Auto-inferred from folder name 'post'
 * - path: '/api/v1/orders' ← Auto-inferred from folder structure 'api/v1/orders/post'
 * - steps: './steps' ← Automatic detection of 'steps' folder!
 * - asyncTasks: './async-tasks' ← Automatic detection of 'async-tasks' folder!
 *
 * Steps files auto-loaded:
 *   - 100-validate-order.js
 *   - 200-check-inventory.js
 *   - 300-create-order.js
 *
 * Async Tasks files auto-loaded:
 *   - send-email.js
 *   - update-analytics.js
 *
 * All configuration is automatically inferred!
 */

const numflow = require("numflow")

module.exports = numflow.feature({
  // method: 'POST' (auto-inferred from folder name 'post')
  // path: '/api/v1/orders' (auto-inferred from folder structure)
  // steps: './steps' (automatic detection of steps folder)
  // asyncTasks: './async-tasks' (automatic detection of async-tasks folder)

  // Context initialization
  contextInitializer: (ctx, req, res) => {
    console.log('\n🚀 Starting order creation process\n')
    ctx.orderData = req.body
    ctx.requestedAt = Date.now()
  },

  // Error handling
  onError: async (error, ctx, req, res) => {
    console.error('\n❌ Error occurred:', error.message)

    // Return appropriate status code based on error type
    let statusCode = 500
    if (error.message.includes('required') || error.message.includes('valid')) {
      statusCode = 400 // Bad Request
    } else if (error.message.includes('stock') || error.message.includes('inventory')) {
      statusCode = 409 // Conflict
    }

    res.statusCode = statusCode
    res.setHeader('Content-Type', 'application/json')
    res.end(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      })
    )
  },
})
