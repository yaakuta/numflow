/**
 * 02-basic-routing.js
 *
 * Example showing basic routing patterns.
 * Learn how to register routes for multiple paths.
 *
 * Learning Objectives:
 * - Registering multiple routes
 * - HTTP methods (GET, POST, PUT, DELETE)
 * - Difference between res.send() and res.json()
 *
 * How to Run:
 * node examples/01-getting-started/02-basic-routing.js
 *
 * Testing:
 * curl http://localhost:3000/
 * curl http://localhost:3000/about
 * curl http://localhost:3000/contact
 */

const numflow = require('../../dist/cjs/index.js')

const app = numflow()

// ===========================================
// 1. Basic Routes (GET)
// ===========================================

// Homepage
app.get('/', (req, res) => {
  res.send('🏠 Welcome to the homepage!')
})

// About page
app.get('/about', (req, res) => {
  res.send('📖 Numflow is an Express-compatible high-performance Node.js framework.')
})

// Contact page
app.get('/contact', (req, res) => {
  res.send('✉️ Contact: https://github.com/gazerkr/numflow')
})

// ===========================================
// 2. JSON Response
// ===========================================

// Server info (JSON)
app.get('/info', (req, res) => {
  res.json({
    framework: 'Numflow',
    version: '1.0.0',
    performance: '3x faster than Express',
    compatibility: '100% Express compatible',
  })
})

// ===========================================
// 3. Various HTTP Methods
// ===========================================

// POST example (req.body parsing is needed in practice, but only basics here)
app.post('/api/data', (req, res) => {
  res.json({
    message: 'Data created successfully.',
    method: 'POST',
  })
})

// PUT example
app.put('/api/data', (req, res) => {
  res.json({
    message: 'Data updated successfully.',
    method: 'PUT',
  })
})

// DELETE example
app.delete('/api/data', (req, res) => {
  res.json({
    message: 'Data deleted successfully.',
    method: 'DELETE',
  })
})

// ===========================================
// Start Server
// ===========================================

const PORT = 3000
app.listen(PORT, () => {
  console.log(`✅ Server is running at http://localhost:${PORT}\n`)
  console.log('Test commands:')
  console.log(`  curl http://localhost:${PORT}/`)
  console.log(`  curl http://localhost:${PORT}/about`)
  console.log(`  curl http://localhost:${PORT}/contact`)
  console.log(`  curl http://localhost:${PORT}/info`)
  console.log(`  curl -X POST http://localhost:${PORT}/api/data`)
  console.log(`  curl -X PUT http://localhost:${PORT}/api/data`)
  console.log(`  curl -X DELETE http://localhost:${PORT}/api/data`)
})
