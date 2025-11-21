/**
 * 03-full-convention
 *
 * Complete Convention over Configuration example using both Steps and Async Tasks.
 *
 * Learning Objectives:
 * - Automatic detection and loading of steps/ folder
 * - Automatic detection and loading of async-tasks/ folder
 * - Separate complex business logic into steps
 * - Separate background tasks into async tasks
 * - Auto-infer all configuration from folder structure
 *
 * How to Run:
 * cd examples/07-feature-first/03-full-convention
 * node app.js
 *
 * Testing:
 * curl -X POST http://localhost:3000/api/v1/orders \
 *   -H "Content-Type: application/json" \
 *   -d '{"productId":"PROD001","quantity":2,"userId":"USER123"}'
 */

const numflow = require("numflow")

const app = numflow()

// ===========================================
// Convention over Configuration (Full Example)
// ===========================================
//
// Folder structure:
//   features/api/v1/orders/@post/
//     index.js
//     steps/
//       100-validate-order.js
//       200-check-inventory.js
//       300-create-order.js
//     async-tasks/
//       send-email.js
//       update-analytics.js
//
// Convention rules:
//   - 'post' folder name → method: 'POST'
//   - 'api/v1/orders' path → path: '/api/v1/orders'
//   - 'steps' folder → steps: './steps' auto-detected!
//   - 'async-tasks' folder → asyncTasks: './async-tasks' auto-detected!
//
// Steps: Execute sequentially, subsequent steps won't run if any fails
// Async Tasks: Execute asynchronously in background, no impact on response time
// ===========================================

const createOrderFeature = require('./features/api/v1/orders/@post/index.js')

app.use(createOrderFeature)

// ===========================================
// Start Server
// ===========================================

const PORT = 3000
app.listen(PORT, () => {
  console.log(
    `✅ Full Convention server is running at http://localhost:${PORT}\n`
  )

  console.log('📖 Difference between Steps and Async Tasks:')
  console.log('  Steps:')
  console.log('    - Execute sequentially')
  console.log('    - Must complete before response')
  console.log('    - Subsequent steps won\'t run if any fails')
  console.log('    - Examples: validation, inventory check, order creation')
  console.log('  ')
  console.log('  Async Tasks:')
  console.log('    - Execute asynchronously in background')
  console.log('    - No impact on response time')
  console.log('    - Failure doesn\'t affect other tasks')
  console.log('    - Examples: email send, analytics data update\n')

  console.log('📁 Folder Structure:')
  console.log('  features/')
  console.log('    api/')
  console.log('      v1/')
  console.log('        orders/')
  console.log('          post/')
  console.log('            index.js')
  console.log('            steps/')
  console.log('              100-validate-order.js')
  console.log('              200-check-inventory.js')
  console.log('              300-create-order.js')
  console.log('            async-tasks/')
  console.log('              send-email.js')
  console.log('              update-analytics.js')
  console.log('')
  console.log('  → method: POST (folder name "@post")')
  console.log('  → path: /api/v1/orders (folder structure "api/v1/orders")')
  console.log('  → steps: ./steps (auto-detected!)')
  console.log('  → asyncTasks: ./async-tasks (auto-detected!)\n')

  console.log('Test Commands:')

  console.log(`\n  # 1. Normal case`)
  console.log(`  curl -X POST http://localhost:${PORT}/api/v1/orders \\`)
  console.log(`    -H "Content-Type: application/json" \\`)
  console.log(`    -d '{"productId":"PROD001","quantity":2,"userId":"USER123"}'`)

  console.log(`\n  # 2. Missing required field (error)`)
  console.log(`  curl -X POST http://localhost:${PORT}/api/v1/orders \\`)
  console.log(`    -H "Content-Type: application/json" \\`)
  console.log(`    -d '{"productId":"PROD001"}'`)

  console.log(`\n  # 3. Insufficient stock (error)`)
  console.log(`  curl -X POST http://localhost:${PORT}/api/v1/orders \\`)
  console.log(`    -H "Content-Type: application/json" \\`)
  console.log(
    `    -d '{"productId":"PROD001","quantity":100,"userId":"USER123"}'`
  )

  console.log(`\n  # 4. Invalid quantity (error)`)
  console.log(`  curl -X POST http://localhost:${PORT}/api/v1/orders \\`)
  console.log(`    -H "Content-Type: application/json" \\`)
  console.log(
    `    -d '{"productId":"PROD001","quantity":-1,"userId":"USER123"}'`
  )

  console.log(
    `\n💡 Watch console logs to see how Steps and Async Tasks execute!`
  )
  console.log(`💡 Async Tasks continue running in background even after response is sent!`)
})
