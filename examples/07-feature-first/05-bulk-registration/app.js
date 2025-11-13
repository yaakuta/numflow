/**
 * 05. Bulk Feature Registration (Auto Scan)
 *
 * Use app.registerFeatures() to automatically scan and register
 * all Features in the features directory.
 *
 * Convention over Configuration is applied to automatically infer
 * HTTP method and path from folder structure.
 */

const numflow = require('../../../dist/cjs/index.js')

const app = numflow()

console.log('🔍 Scanning features directory...\n')

// Recursively scan and register all Features in features directory
// Convention over Configuration applied to automatically infer method/path from folder structure
app.registerFeatures('./features')

// app.listen() automatically waits for Feature registration completion before starting server
app.listen(3000, () => {
  console.log('\n✅ Server running on port 3000')
  console.log('\n📝 Try these commands:\n')
  console.log('# Create order')
  console.log('curl -X POST http://localhost:3000/api/v1/orders \\')
  console.log('  -H "Content-Type: application/json" \\')
  console.log('  -d \'{"product":"MacBook Pro","quantity":1}\'\n')
  console.log('# Get order by ID')
  console.log('curl http://localhost:3000/api/v1/orders/ORD-123\n')
  console.log('# Get all users')
  console.log('curl http://localhost:3000/api/v1/users\n')
})
