const numflow = require('numflow')

// ⭐ Error Handling: Feature level + Retry mechanism
module.exports = numflow.feature({
  contextInitializer: (ctx, req, res) => {
    ctx.amount = req.body.amount
    ctx.retryCount = 0
  },

  // ⭐ Feature level error handler
  onError: async (error, ctx, req, res) => {
    console.error(`❌ Error occurred: ${error.message}`)

    // 1. Handle specific error types
    if (error.message === 'NETWORK_ERROR') {
      console.log('🔁 Network error → Retry')

      // Return retry signal
      return numflow.retry({
        maxAttempts: 3,
        delay: 1000  // Retry after 1 second
      })
    }

    // 2. General error response
    if (!res.headersSent) {
      const statusCode = error.statusCode || 500
      res.status(statusCode).json({
        error: 'Payment failed',
        message: error.message
      })
    }
  }
})
