/**
 * 04-transaction
 *
 * Example using transaction management and onError handler.
 *
 * Learning Objectives:
 * - Start transaction with contextInitializer
 * - Handle transaction rollback with onError
 * - Process complex business logic through steps
 * - Automatic rollback on error
 *
 * How to Run:
 * cd examples/07-feature-first/04-transaction
 * node app.js
 *
 * Testing:
 * curl -X POST http://localhost:3000/api/transfer \
 *   -H "Content-Type: application/json" \
 *   -d '{"from":"ACC001","to":"ACC002","amount":5000}'
 */

const numflow = require("numflow")

const app = numflow()

// ===========================================
// Transaction Management Example
// ===========================================
//
// Folder structure:
//   features/api/transfer/@post/
//     index.js
//     steps/
//       100-validate.js
//       200-check-accounts.js
//       300-withdraw.js
//       400-deposit.js
//       500-record-history.js
//
// Convention rules:
//   - 'post' folder name → method: 'POST'
//   - 'api/transfer' path → path: '/api/transfer'
//   - 'steps' folder → steps: './steps' auto-detected
//
// Transaction management:
//   - contextInitializer: Start transaction
//   - Steps: Execute sequentially within transaction
//   - onError: Rollback transaction on error
// ===========================================

const transferFeature = require('./features/api/transfer/@post/index.js')

app.use(transferFeature)

// ===========================================
// Start Server
// ===========================================

const PORT = 3000
app.listen(PORT, () => {
  console.log(
    `✅ Transaction server is running at http://localhost:${PORT}\n`
  )

  console.log('📖 What is Transaction Management?')
  console.log('  - Group multiple operations as one unit')
  console.log('  - Commit if all operations succeed')
  console.log('  - Rollback all if any fails')
  console.log('  - Guarantee data consistency\n')

  console.log('📁 Folder Structure:')
  console.log('  features/')
  console.log('    api/')
  console.log('      transfer/')
  console.log('        post/')
  console.log('          index.js')
  console.log('          steps/')
  console.log('            100-validate.js')
  console.log('            200-check-accounts.js')
  console.log('            300-withdraw.js')
  console.log('            400-deposit.js')
  console.log('            500-record-history.js')
  console.log('')
  console.log('  → method: POST (folder name "@post")')
  console.log('  → path: /api/transfer (folder structure "api/transfer")')
  console.log('  → steps: ./steps (auto-detected!)\n')

  console.log('🔄 Transaction Flow:')
  console.log('  1. contextInitializer: Start transaction')
  console.log('  2. Steps: Execute sequentially (validate → check → withdraw → deposit → record)')
  console.log('  3-a. Success: Commit transaction (automatic)')
  console.log('  3-b. Failure: Rollback transaction in onError\n')

  console.log('Test Commands:')

  console.log(`\n  # 1. Normal case (success)`)
  console.log(`  curl -X POST http://localhost:${PORT}/api/transfer \\`)
  console.log(`    -H "Content-Type: application/json" \\`)
  console.log(`    -d '{"from":"ACC001","to":"ACC002","amount":5000}'`)

  console.log(`\n  # 2. Missing required field (error → rollback)`)
  console.log(`  curl -X POST http://localhost:${PORT}/api/transfer \\`)
  console.log(`    -H "Content-Type: application/json" \\`)
  console.log(`    -d '{"from":"ACC001","amount":5000}'`)

  console.log(`\n  # 3. Invalid amount (error → rollback)`)
  console.log(`  curl -X POST http://localhost:${PORT}/api/transfer \\`)
  console.log(`    -H "Content-Type: application/json" \\`)
  console.log(`    -d '{"from":"ACC001","to":"ACC002","amount":-1000}'`)

  console.log(`\n  # 4. Insufficient balance (error → rollback)`)
  console.log(`  curl -X POST http://localhost:${PORT}/api/transfer \\`)
  console.log(`    -H "Content-Type: application/json" \\`)
  console.log(`    -d '{"from":"ACC001","to":"ACC002","amount":999999}'`)

  console.log(`\n  # 5. Same account transfer (error → rollback)`)
  console.log(`  curl -X POST http://localhost:${PORT}/api/transfer \\`)
  console.log(`    -H "Content-Type: application/json" \\`)
  console.log(`    -d '{"from":"ACC001","to":"ACC001","amount":5000}'`)

  console.log(
    `\n💡 Watch console logs to observe transaction start, commit/rollback process!`
  )
  console.log(`💡 Verify that rollback executes in onError when error occurs!`)
})
