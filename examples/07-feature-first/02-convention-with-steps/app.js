/**
 * 02-convention-with-steps
 *
 * Learn how to manage steps as separate files.
 *
 * Learning Objectives:
 * - Separate steps into individual files
 * - Automatic detection of steps/ folder
 * - Step file naming convention (100-xxx.js, 200-xxx.js)
 * - Separate complex business logic into steps
 *
 * How to Run:
 * cd examples/07-feature-first/02-convention-with-steps
 * node app.js
 *
 * Testing:
 * curl -X POST http://localhost:3000/api/users \
 *   -H "Content-Type: application/json" \
 *   -d '{"name":"Bob","email":"bob@example.com","age":30}'
 */

const numflow = require('../../../dist/cjs/index.js')

const app = numflow()

// ===========================================
// Convention over Configuration
// ===========================================
//
// Folder structure:
//   features/api/users/@post/
//     index.js
//     steps/
//       100-validate.js
//       200-normalize.js
//       300-create-user.js
//
// Convention rules:
//   - '@post' folder name → method: 'POST'
//   - 'api/users' path → path: '/api/users'
//   - 'steps' folder → steps: './steps' auto-detected!
//
// Steps are automatically sorted and executed by number.
// ===========================================

const createUserFeature = require('./features/api/users/@post/index.js')

app.use(createUserFeature)

// ===========================================
// Start Server
// ===========================================

const PORT = 3000
app.listen(PORT, () => {
  console.log(
    `✅ Convention with Steps server is running at http://localhost:${PORT}\n`
  )

  console.log('📖 Benefits of separating steps into files:')
  console.log('  - Each step is managed as an independent file')
  console.log('  - Clear responsibility per step')
  console.log('  - Easy to test')
  console.log('  - Reusable\n')

  console.log('📁 Folder Structure:')
  console.log('  features/')
  console.log('    api/')
  console.log('      users/')
  console.log('        @post/')
  console.log('          index.js')
  console.log('          steps/')
  console.log('            100-validate.js')
  console.log('            200-normalize.js')
  console.log('            300-create-user.js')
  console.log('')
  console.log('  → method: POST (folder name "@post")')
  console.log('  → path: /api/users (folder structure "api/users")')
  console.log('  → steps: ./steps (steps folder auto-detected!)\n')

  console.log('📝 Step File Naming Convention:')
  console.log('  - 100-xxx.js: First step')
  console.log('  - 200-xxx.js: Second step')
  console.log('  - 300-xxx.js: Third step')
  console.log('  - Recommended interval of 100 (allows inserting steps in between)\n')

  console.log('Test Commands:')

  console.log(`\n  # 1. Normal case`)
  console.log(`  curl -X POST http://localhost:${PORT}/api/users \\`)
  console.log(`    -H "Content-Type: application/json" \\`)
  console.log(`    -d '{"name":"Bob","email":"bob@example.com","age":30}'`)

  console.log(`\n  # 2. Missing required fields (error)`)
  console.log(`  curl -X POST http://localhost:${PORT}/api/users \\`)
  console.log(`    -H "Content-Type: application/json" \\`)
  console.log(`    -d '{"name":"Alice"}'`)

  console.log(`\n  # 3. Invalid email format (error)`)
  console.log(`  curl -X POST http://localhost:${PORT}/api/users \\`)
  console.log(`    -H "Content-Type: application/json" \\`)
  console.log(`    -d '{"name":"Charlie","email":"invalid-email"}'`)

  console.log(`\n  # 4. Invalid age (error)`)
  console.log(`  curl -X POST http://localhost:${PORT}/api/users \\`)
  console.log(`    -H "Content-Type: application/json" \\`)
  console.log(`    -d '{"name":"Dave","email":"dave@example.com","age":999}'`)

  console.log(`\n💡 Watch the console logs to see steps executing in order!`)
})
