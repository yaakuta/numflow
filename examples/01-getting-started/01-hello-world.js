/**
 * 01-hello-world.js
 *
 * The simplest Numflow server example.
 * Creates a basic HTTP server that outputs Hello World.
 *
 * Learning Objectives:
 * - Using numflow() factory function
 * - Starting server with app.listen()
 * - Registering basic routes
 *
 * How to Run:
 * node examples/01-getting-started/01-hello-world.js
 *
 * Testing:
 * Access http://localhost:3000 in browser
 * Or curl http://localhost:3000
 */

const numflow = require('../../dist/cjs/index.js')

// 1. Create Numflow application
const app = numflow()

// 2. Register GET route at root path
app.get('/', (req, res) => {
  res.send('Hello World! 🚀')
})

// 3. Start server
const PORT = 3000
app.listen(PORT, () => {
  console.log(`✅ Hello World server is running at http://localhost:${PORT}`)
  console.log(`   Access in browser or test with curl http://localhost:${PORT}`)
})
