/**
 * 01-convention-basics
 *
 * Learn the basics of Convention over Configuration.
 *
 * Learning Objectives:
 * - Auto-infer HTTP method from folder structure
 * - Auto-infer API path from folder structure
 * - Write concise code with numflow.feature()
 * - Understand Convention rules
 *
 * How to Run:
 * cd examples/07-feature-first/01-convention-basics
 * node app.js
 *
 * Testing:
 * curl -X POST http://localhost:3000/greet \
 *   -H "Content-Type: application/json" \
 *   -d '{"name":"World"}'
 *
 * curl -X POST http://localhost:3000/greet \
 *   -H "Content-Type: application/json" \
 *   -d '{"name":"Alice","language":"ko"}'
 */

const numflow = require("numflow")

const app = numflow()

// ===========================================
// Convention over Configuration
// ===========================================
//
// Folder structure:
//   features/greet/@post/index.js
//
// Convention rules:
//   - '@post' folder name → method: 'POST' auto-inferred
//   - 'greet' path → path: '/greet' auto-inferred
//
// No need to manually specify method and path anymore!
// ===========================================

const greetFeature = require('./features/greet/@post/index.js')

app.use(greetFeature)

// ===========================================
// Start Server
// ===========================================

const PORT = 3000
app.listen(PORT, () => {
  console.log(
    `✅ Convention Basics server is running at http://localhost:${PORT}\n`
  )

  console.log('📖 What is Convention over Configuration?')
  console.log('  - Automatically infer configuration from folder structure')
  console.log('  - No need for repetitive configuration code')
  console.log('  - Code is concise and consistent\n')

  console.log('📁 Folder Structure:')
  console.log('  features/')
  console.log('    greet/')
  console.log('      @post/')
  console.log('        index.js')
  console.log('')
  console.log('  → method: POST (inferred from folder name "@post")')
  console.log('  → path: /greet (inferred from folder structure)\n')

  console.log('Test Commands:')
  console.log(`\n  # 1. English greeting`)
  console.log(`  curl -X POST http://localhost:${PORT}/greet \\`)
  console.log(`    -H "Content-Type: application/json" \\`)
  console.log(`    -d '{"name":"World"}'`)

  console.log(`\n  # 2. Korean greeting`)
  console.log(`  curl -X POST http://localhost:${PORT}/greet \\`)
  console.log(`    -H "Content-Type: application/json" \\`)
  console.log(`    -d '{"name":"Chulsoo","language":"ko"}'`)

  console.log(`\n  # 3. Japanese greeting`)
  console.log(`  curl -X POST http://localhost:${PORT}/greet \\`)
  console.log(`    -H "Content-Type: application/json" \\`)
  console.log(`    -d '{"name":"太郎","language":"ja"}'`)

  console.log(`\n💡 Watch console logs to see Steps execute in order!`)
})
