/**
 * TODO App with Numflow Framework
 *
 * Features:
 * - Bulk Registration (Convention over Configuration)
 * - EJS Template Engine
 * - Feature-First Auto-Orchestration
 * - In-memory data storage (simple example)
 */

const numflow = require('../../dist/cjs/index.js')
const path = require('path')
const serveStatic = require('serve-static')

const app = numflow()

// ===== Global data store =====
// In production, use a database!
global.todos = [
  { id: 1, text: 'Learn Numflow Framework', completed: false },
  { id: 2, text: 'Master Feature-First Pattern', completed: true },
  { id: 3, text: 'Build TODO App', completed: false },
]
global.nextId = 4

// ===== View engine setup =====
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))

// ===== Serve static files =====
app.use(serveStatic(path.join(__dirname, 'public')))

// ===== Body Parser =====
// Numflow has built-in automatic body parser!

// ===== GET /todos - HTML rendering (normal route) =====
app.get('/todos', (req, res) => {
  const todos = global.todos || []
  res.render('index', { todos })
})

// ===== Error handler =====
app.onError((err, req, res) => {
  console.error('Error:', err)
  res.status(500).json({
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  })
})

// ===== Start server (app.listen() method) =====
// Bulk Registration! Register all Features with one line!
// Register only POST, PUT, DELETE as Features
app.registerFeatures('./features')

// app.listen() automatically waits for Feature registration completion before starting server
const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`
┌─────────────────────────────────────────┐
│  TODO App with Numflow Framework       │
├─────────────────────────────────────────┤
│  Server: http://localhost:${PORT}        │
│  Features: Bulk Registration ✅         │
│  Template: EJS ✅                       │
│  Pattern: Feature-First ✅              │
└─────────────────────────────────────────┘
  `)
})
