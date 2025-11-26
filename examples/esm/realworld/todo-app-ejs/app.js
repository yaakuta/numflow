/**
 * TODO App with EJS Template - Numflow Framework (ESM)
 *
 * Features:
 * - Bulk Registration (Convention over Configuration)
 * - EJS Template Engine
 * - Feature-First Auto-Orchestration
 * - In-memory data storage
 */

import numflow from 'numflow'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = numflow()

// ===== View engine setup =====
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))

// ===== Serve static files =====
app.use(numflow.static(path.join(__dirname, 'public')))

// ===== Express-style Error Middleware =====
app.use((err, req, res, next) => {
  console.error('Error:', err)
  const statusCode = err.statusCode || 500
  res.status(statusCode).json({
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  })
})

// ===== Bulk Registration =====
// Register all Features with one line!
app.registerFeatures('./features')

// ===== Export for testing =====
export default app

// ===== Start server if run directly =====
const isMainModule = import.meta.url === `file://${process.argv[1]}`
if (isMainModule) {
  const PORT = process.env.PORT || 3000
  app.listen(PORT, () => {
    console.log(`
┌─────────────────────────────────────────┐
│  TODO App with EJS - Numflow Framework  │
├─────────────────────────────────────────┤
│  Server: http://localhost:${PORT}         │
│  Template: EJS                          │
│  Pattern: Feature-First (ESM)           │
└─────────────────────────────────────────┘
    `)
  })
}
