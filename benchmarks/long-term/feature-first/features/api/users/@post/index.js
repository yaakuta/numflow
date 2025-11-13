/**
 * POST /api/users
 *
 * Uses transaction + Async Tasks
 *
 * contextInitializer: Start transaction
 * Steps: Create user
 * asyncTasks: Send welcome email
 * onError: Rollback transaction
 */

const numflow = require('../../../../../../../dist/cjs/index.js')

module.exports = numflow.feature({
  // Start transaction (v0.2.0: initialize by receiving ctx)
  contextInitializer: (ctx, req, res) => {
    ctx.transaction = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      startedAt: Date.now(),
      status: 'started',
    }
  },

  // Rollback on error
  onError: async (error, ctx, req, res) => {
    if (ctx.transaction) {
      ctx.transaction.status = 'rolled_back'
      ctx.transaction.rolledBackAt = Date.now()
      global.testData.transactionsRolledBack++
    }

    // Re-throw error so framework can handle it
    throw error
  },
})
