/**
 * Numflow Framework - Basic Example (JavaScript CommonJS)
 *
 * This example shows basic server startup using JavaScript (CommonJS).
 * Works perfectly without TypeScript.
 */

// Load Numflow framework
const numflow = require("numflow")

// Create Application instance
const app = numflow()

// Port configuration
const PORT = 3000

// Start server
app.listen(PORT, () => {
  console.log(`✨ Numflow server is running on http://localhost:${PORT}`)
  console.log('📝 This is Phase 0 - Basic server startup')
  console.log('🔥 Press Ctrl+C to stop the server')
})
