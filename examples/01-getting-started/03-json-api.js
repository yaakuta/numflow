/**
 * 03-json-api.js
 *
 * Example of creating a simple REST API.
 * Implements a CRUD API for managing user data.
 *
 * Learning Objectives:
 * - Understanding REST API patterns
 * - Automatic req.body parsing (Numflow automatically parses JSON)
 * - Setting HTTP status codes with res.status()
 * - JSON responses with res.json()
 *
 * How to Run:
 * node examples/01-getting-started/03-json-api.js
 *
 * Testing:
 * # Get user list
 * curl http://localhost:3000/api/users
 *
 * # Create user
 * curl -X POST http://localhost:3000/api/users \
 *   -H "Content-Type: application/json" \
 *   -d '{"name":"John Doe","email":"john@example.com"}'
 *
 * # Get user
 * curl http://localhost:3000/api/users/1
 *
 * # Update user
 * curl -X PUT http://localhost:3000/api/users/1 \
 *   -H "Content-Type: application/json" \
 *   -d '{"name":"Jane Doe","email":"jane@example.com"}'
 *
 * # Delete user
 * curl -X DELETE http://localhost:3000/api/users/1
 */

const numflow = require("numflow")

const app = numflow()

// ===========================================
// In-memory database (simple array)
// ===========================================
let users = [
  { id: 1, name: 'Alice', email: 'alice@example.com' },
  { id: 2, name: 'Bob', email: 'bob@example.com' },
  { id: 3, name: 'Charlie', email: 'charlie@example.com' },
]

let nextId = 4

// ===========================================
// REST API Endpoints
// ===========================================

// 1. Get user list (GET /api/users)
app.get('/api/users', (req, res) => {
  res.json({
    success: true,
    count: users.length,
    data: users,
  })
})

// 2. Get user details (GET /api/users/:id)
// Learn more about parameters in the next example (02-routing).
app.get('/api/users/:id', (req, res) => {
  const userId = parseInt(req.params.id)
  const user = users.find((u) => u.id === userId)

  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'User not found.',
    })
  }

  res.json({
    success: true,
    data: user,
  })
})

// 3. Create user (POST /api/users)
// Numflow automatically parses JSON body! (req.body available)
app.post('/api/users', (req, res) => {
  const { name, email } = req.body

  // Simple validation
  if (!name || !email) {
    return res.status(400).json({
      success: false,
      error: 'name and email are required.',
    })
  }

  // Create new user
  const newUser = {
    id: nextId++,
    name,
    email,
  }

  users.push(newUser)

  res.status(201).json({
    success: true,
    message: 'User created successfully.',
    data: newUser,
  })
})

// 4. Update user (PUT /api/users/:id)
app.put('/api/users/:id', (req, res) => {
  const userId = parseInt(req.params.id)
  const userIndex = users.findIndex((u) => u.id === userId)

  if (userIndex === -1) {
    return res.status(404).json({
      success: false,
      error: 'User not found.',
    })
  }

  const { name, email } = req.body

  // Update
  users[userIndex] = {
    ...users[userIndex],
    ...(name && { name }),
    ...(email && { email }),
  }

  res.json({
    success: true,
    message: 'User updated successfully.',
    data: users[userIndex],
  })
})

// 5. Delete user (DELETE /api/users/:id)
app.delete('/api/users/:id', (req, res) => {
  const userId = parseInt(req.params.id)
  const userIndex = users.findIndex((u) => u.id === userId)

  if (userIndex === -1) {
    return res.status(404).json({
      success: false,
      error: 'User not found.',
    })
  }

  const deletedUser = users[userIndex]
  users.splice(userIndex, 1)

  res.json({
    success: true,
    message: 'User deleted successfully.',
    data: deletedUser,
  })
})

// ===========================================
// Start Server
// ===========================================

const PORT = 3000
app.listen(PORT, () => {
  console.log(`✅ JSON API server is running at http://localhost:${PORT}\n`)
  console.log('Test commands:')
  console.log(`  # Get user list`)
  console.log(`  curl http://localhost:${PORT}/api/users\n`)
  console.log(`  # Create user`)
  console.log(`  curl -X POST http://localhost:${PORT}/api/users \\`)
  console.log(`    -H "Content-Type: application/json" \\`)
  console.log(`    -d '{"name":"John Doe","email":"john@example.com"}'\n`)
  console.log(`  # Get user`)
  console.log(`  curl http://localhost:${PORT}/api/users/1\n`)
  console.log(`  # Update user`)
  console.log(`  curl -X PUT http://localhost:${PORT}/api/users/1 \\`)
  console.log(`    -H "Content-Type: application/json" \\`)
  console.log(`    -d '{"name":"Jane Doe"}'\n`)
  console.log(`  # Delete user`)
  console.log(`  curl -X DELETE http://localhost:${PORT}/api/users/1`)
})
