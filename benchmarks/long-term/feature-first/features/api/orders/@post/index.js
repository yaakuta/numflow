/**
 * POST /api/orders
 *
 * Complex order creation Feature (5 Steps)
 *
 * Steps:
 * 1. Input validation
 * 2. Inventory check
 * 3. Price calculation
 * 4. Order creation
 * 5. Inventory update
 *
 * Async Tasks:
 * - Send notification
 */

const numflow = require('../../../../../../../dist/cjs/index.js')

module.exports = numflow.feature({
  // method: 'POST',  // Auto-inferred from @post folder name
  // path: '/api/orders',  // Auto-inferred from folder structure
  // steps: './steps',  // Auto-detected
  // asyncTasks: './async-tasks',  // Auto-detected
})
