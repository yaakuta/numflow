/**
 * Numflow Framework - Basic Example (JavaScript ESM)
 *
 * This is a basic server startup example using JavaScript (ESM).
 * Works perfectly without TypeScript.
 */

// Import Numflow framework (ESM import)
import numflow from "numflow"

// Create application instance
const app = numflow()

// Set port
const PORT = 3001

// Start server
app.listen(PORT, () => {
  console.log(`✨ Numflow server is running on http://localhost:${PORT}`)
  console.log('📝 This is Phase 0 - Basic server startup (ESM)')
  console.log('🔥 Press Ctrl+C to stop the server')
})
