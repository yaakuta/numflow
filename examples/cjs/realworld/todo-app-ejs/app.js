/**
 * TODO App with EJS Template - Numflow Framework
 *
 * Features:
 * - Bulk Registration (Convention over Configuration)
 * - EJS Template Engine
 * - Feature-First Auto-Orchestration
 * - In-memory data storage
 */

const numflow = require('numflow')
const path = require('path')

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
module.exports = app

// ===== Start server if run directly =====
if (require.main === module) {
  const PORT = process.env.PORT || 3000
  app.listen(PORT, () => {
    console.log(`
┌─────────────────────────────────────────┐
│  TODO App with EJS - Numflow Framework  │
├─────────────────────────────────────────┤
│  Server: http://localhost:${PORT}         │
│  Template: EJS                          │
│  Pattern: Feature-First                 │
└─────────────────────────────────────────┘
    `)
  })
}
