/**
 * Numflow Framework - Basic Example (TypeScript)
 *
 * This example demonstrates basic server startup using TypeScript.
 * It provides type safety and IDE autocompletion.
 */

// Import Numflow framework
import numflow from 'numflow'

// Create application instance
const app = numflow()

// Port configuration
const PORT: number = 3002

// Start server
app.listen(PORT, (): void => {
  console.log(`✨ Numflow server is running on http://localhost:${PORT}`)
  console.log('📝 This is Phase 0 - Basic server startup (TypeScript)')
  console.log('🔥 Press Ctrl+C to stop the server')
})
