const numflow = require('../../../../../../../../dist/cjs/index.js')

/**
 * POST /api/v1/orders - Create Order
 *
 * Convention over Configuration:
 * - method: 'POST' (auto-inferred from folder name 'post')
 * - path: '/api/v1/orders' (auto-inferred from folder structure)
 * - steps: './steps' (steps directory auto-detected)
 */
module.exports = numflow.feature({
  // method and path are auto-inferred by Convention!

  contextInitializer: (ctx, req, res) => {
    ctx.orderData = req.body
    ctx.userId = 'user-123' // In production, use req.user.id
  },

  onError: (error, ctx, req, res) => {
    console.error('❌ Order creation failed:', error.message)
    res.statusCode = 500
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: error.message }))
  },
})
