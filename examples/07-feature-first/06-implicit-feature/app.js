/**
 * 06-implicit-feature
 *
 * Learn about Implicit Features.
 * Define Features using only folder structure without index.js.
 *
 * Learning Objectives:
 * - Define Feature without index.js
 * - Work with only @method folder and steps/ folder
 * - Auto-infer all configuration from folder structure
 * - Use implicit definition for simple Features
 *
 * How to Run:
 * cd examples/07-feature-first/06-implicit-feature
 * node app.js
 *
 * Testing:
 * curl http://localhost:3000/greet?name=Alice
 * curl http://localhost:3000/greet?name=Bob&language=ko
 */

const numflow = require("numflow")

const app = numflow()

// ===========================================
// Implicit Feature
// ===========================================
//
// Folder structure:
//   features/greet/@get/
//     steps/
//       100-generate-greeting.js
//       200-send-response.js
//
// ⭐ No index.js! ⭐
//
// Convention rules:
//   - '@get' folder name → method: 'GET' auto-inferred
//   - 'greet' path → path: '/greet' auto-inferred
//   - 'steps' folder → steps auto-detected
//   - No index.js → Implicit Feature!
//
// When to use?
//   - When contextInitializer is not needed
//   - When onError is not needed
//   - When custom middleware is not needed
//   - When you just need to execute Steps
// ===========================================

app.registerFeatures('./features')

// ===========================================
// Start Server
// ===========================================

const PORT = 3000
app.listen(PORT, () => {
  console.log(
    `✅ Implicit Feature server is running at http://localhost:${PORT}\n`
  )

  console.log('📖 Implicit vs Explicit Feature:')
  console.log('  ')
  console.log('  Implicit Feature:')
  console.log('    - No index.js ⭐')
  console.log('    - Only @method + steps/ folders')
  console.log('    - Suitable for simple Features')
  console.log('    - No need for contextInitializer, onError')
  console.log('  ')
  console.log('  Explicit Feature:')
  console.log('    - Has index.js')
  console.log('    - Can use contextInitializer')
  console.log('    - Can use onError')
  console.log('    - Suitable for complex Features\n')

  console.log('📁 Folder Structure:')
  console.log('  features/')
  console.log('    greet/')
  console.log('      @get/               # ← No index.js!')
  console.log('        steps/')
  console.log('          100-generate-greeting.js')
  console.log('          200-send-response.js')
  console.log('')
  console.log('  → method: GET (folder name "@get")')
  console.log('  → path: /greet (folder structure "greet")')
  console.log('  → steps: ./steps (auto-detected)')
  console.log('  → index.js: None! (Implicit Feature)\n')

  console.log('🔄 Execution Flow:')
  console.log('  1. 100-generate-greeting.js: Read query params + generate greeting')
  console.log('  2. 200-send-response.js: Send JSON response\n')

  console.log('Test Commands:')

  console.log(`\n  # 1. Default greeting (English)`)
  console.log(`  curl http://localhost:${PORT}/greet?name=Alice`)

  console.log(`\n  # 2. Korean greeting`)
  console.log(`  curl http://localhost:${PORT}/greet?name=Chulsoo&language=ko`)

  console.log(`\n  # 3. Japanese greeting`)
  console.log(`  curl http://localhost:${PORT}/greet?name=太郎&language=ja`)

  console.log(`\n  # 4. No name (use default)`)
  console.log(`  curl http://localhost:${PORT}/greet`)

  console.log(`\n💡 Implicit Features have no index.js, making code more concise!`)
  console.log(
    `💡 For complex logic, use Explicit Features (with index.js)!`
  )
})
