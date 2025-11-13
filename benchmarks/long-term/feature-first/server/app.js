/**
 * Feature-First Long-term Test Server
 *
 * Includes complex Features that simulate real production scenarios.
 *
 * Features:
 * - POST /api/orders - Complex order creation through multiple Steps
 * - POST /api/users - Transaction + Async Tasks
 * - GET /api/health - Health check
 */

const numflow = require('../../../../dist/cjs/index.js')
const path = require('path')

const app = numflow()

// ============================================
// Global data (database in production)
// ============================================

global.testData = {
  users: [],
  orders: [],
  products: [
    { id: 1, name: 'Product A', price: 100, stock: 1000 },
    { id: 2, name: 'Product B', price: 200, stock: 500 },
    { id: 3, name: 'Product C', price: 300, stock: 250 },
  ],
  asyncTasksCompleted: 0,
  asyncTasksFailed: 0,
  transactionsCommitted: 0,
  transactionsRolledBack: 0,
  totalStepsExecuted: 0,
}

// ============================================
// Register Features
// ============================================

app.registerFeatures(path.join(__dirname, '../features'))

// ============================================
// Health Check (includes Feature-First metrics)
// ============================================

app.get('/api/health', (req, res) => {
  const uptime = process.uptime()
  const memUsage = process.memoryUsage()

  res.json({
    status: 'healthy',
    uptime: uptime.toFixed(0) + ' sec',
    memory: {
      rss: (memUsage.rss / 1024 / 1024).toFixed(2) + ' MB',
      heapUsed: (memUsage.heapUsed / 1024 / 1024).toFixed(2) + ' MB',
    },
    featureFirst: {
      totalStepsExecuted: global.testData.totalStepsExecuted,
      asyncTasksCompleted: global.testData.asyncTasksCompleted,
      asyncTasksFailed: global.testData.asyncTasksFailed,
      transactionsCommitted: global.testData.transactionsCommitted,
      transactionsRolledBack: global.testData.transactionsRolledBack,
      users: global.testData.users.length,
      orders: global.testData.orders.length,
    },
  })
})

// ============================================
// Collect metrics (Feature-First specific)
// ============================================

let metricsInterval
if (process.env.FEATURE_METRICS === 'true') {
  metricsInterval = setInterval(() => {
    console.log({
      timestamp: new Date().toISOString(),
      steps: global.testData.totalStepsExecuted,
      asyncTasks: {
        completed: global.testData.asyncTasksCompleted,
        failed: global.testData.asyncTasksFailed,
      },
      transactions: {
        committed: global.testData.transactionsCommitted,
        rolledBack: global.testData.transactionsRolledBack,
      },
      data: {
        users: global.testData.users.length,
        orders: global.testData.orders.length,
      },
    })
  }, 30000) // Every 30 seconds
}

// ============================================
// Start server
// ============================================

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
  console.log(
    `\n✅ Feature-First test server is running at http://localhost:${PORT} .\n`
  )

  console.log('📊 Features:')
  console.log('  POST /api/orders  - Complex order creation (5 Steps)')
  console.log('  POST /api/users   - User creation (Transaction + Async Tasks)')
  console.log('  GET  /api/health  - Health check + Feature-First metrics\n')

  console.log('💡 Environment Variables:')
  console.log('  FEATURE_METRICS=true  - Auto print metrics (every 30s)')
  console.log('  FEATURE_DEBUG=true    - Print Step execution logs\n')
})

// Graceful shutdown
process.on('SIGINT', () => {
  if (metricsInterval) clearInterval(metricsInterval)
  console.log('\n\n✅ Server stopped')
  process.exit(0)
})

process.on('SIGTERM', () => {
  if (metricsInterval) clearInterval(metricsInterval)
  console.log('\n\n✅ Server stopped')
  process.exit(0)
})
