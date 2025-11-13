/**
 * Numflow REST API Example with JSDoc
 *
 * Complete CRUD REST API implementation example using JavaScript + JSDoc.
 */

const numflow = require('numflow')
const { ValidationError, NotFoundError } = require('numflow')

/**
 * Type definitions
 * @typedef {import('numflow').Application} Application
 * @typedef {import('numflow').Request} Request
 * @typedef {import('numflow').Response} Response
 * @typedef {import('numflow').NextFunction} NextFunction
 */

/**
 * User type definition
 * @typedef {Object} User
 * @property {number} id - User ID
 * @property {string} name - Name
 * @property {string} email - Email
 * @property {Date} createdAt - Creation time
 */

/**
 * CreateUserInput type
 * @typedef {Object} CreateUserInput
 * @property {string} name - Name
 * @property {string} email - Email
 */

// Application instance
/** @type {Application} */
const app = numflow()

// In-memory database
/** @type {User[]} */
const users = [
  {
    id: 1,
    name: 'Alice',
    email: 'alice@example.com',
    createdAt: new Date('2025-01-01')
  },
  {
    id: 2,
    name: 'Bob',
    email: 'bob@example.com',
    createdAt: new Date('2025-01-02')
  }
]

/** @type {number} */
let nextId = 3

// Logging middleware
/**
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 */
app.use((req, res, next) => {
  console.log(`[${req.method}] ${req.url}`)
  next()
})

// API information
/**
 * @param {Request} req
 * @param {Response} res
 */
app.get('/', (req, res) => {
  res.json({
    name: 'Numflow REST API with JSDoc',
    version: '1.0.0',
    endpoints: {
      'GET /users': 'Get all users',
      'GET /users/:id': 'Get specific user',
      'POST /users': 'Create new user',
      'PUT /users/:id': 'Update user information',
      'DELETE /users/:id': 'Delete user'
    }
  })
})

// GET /users - Get all users
/**
 * @param {Request} req
 * @param {Response} res
 */
app.get('/users', (req, res) => {
  res.json({
    users,
    total: users.length
  })
})

// GET /users/:id - Get specific user
/**
 * @param {Request} req
 * @param {Response} res
 */
app.get('/users/:id', (req, res) => {
  const userId = parseInt(req.params.id)

  const user = users.find(u => u.id === userId)

  if (!user) {
    throw new NotFoundError(`User with ID ${userId} not found`)
  }

  res.json(user)
})

// POST /users - Create new user
/**
 * @param {Request} req
 * @param {Response} res
 */
app.post('/users', (req, res) => {
  /** @type {CreateUserInput} */
  const input = req.body

  // Validate input
  validateCreateUserInput(input)

  // Check duplicate email
  const existingUser = users.find(u => u.email === input.email)
  if (existingUser) {
    throw new ValidationError('Email already exists', {
      email: ['This email is already registered']
    })
  }

  // Create new user
  /** @type {User} */
  const newUser = {
    id: nextId++,
    name: input.name,
    email: input.email,
    createdAt: new Date()
  }

  users.push(newUser)

  res.status(201).json({
    message: 'User created successfully',
    user: newUser
  })
})

// PUT /users/:id - Update user information
/**
 * @param {Request} req
 * @param {Response} res
 */
app.put('/users/:id', (req, res) => {
  const userId = parseInt(req.params.id)

  /** @type {CreateUserInput} */
  const input = req.body

  // Find user
  const user = users.find(u => u.id === userId)
  if (!user) {
    throw new NotFoundError(`User with ID ${userId} not found`)
  }

  // Validate input
  validateCreateUserInput(input)

  // Check duplicate email (excluding self)
  const duplicateEmail = users.find(u => u.email === input.email && u.id !== userId)
  if (duplicateEmail) {
    throw new ValidationError('Email already exists', {
      email: ['This email is already registered']
    })
  }

  // Update
  user.name = input.name
  user.email = input.email

  res.json({
    message: 'User updated successfully',
    user
  })
})

// DELETE /users/:id - Delete user
/**
 * @param {Request} req
 * @param {Response} res
 */
app.delete('/users/:id', (req, res) => {
  const userId = parseInt(req.params.id)

  const userIndex = users.findIndex(u => u.id === userId)

  if (userIndex === -1) {
    throw new NotFoundError(`User with ID ${userId} not found`)
  }

  const deletedUser = users.splice(userIndex, 1)[0]

  res.json({
    message: 'User deleted successfully',
    user: deletedUser
  })
})

/**
 * Validate user input
 * @param {CreateUserInput} input
 * @throws {ValidationError} When validation fails
 */
function validateCreateUserInput(input) {
  /** @type {Record<string, string[]>} */
  const errors = {}

  // Validate name
  if (!input.name || input.name.trim() === '') {
    errors.name = ['Name is required']
  } else if (input.name.length < 2) {
    errors.name = ['Name must be at least 2 characters']
  } else if (input.name.length > 50) {
    errors.name = ['Name must be less than 50 characters']
  }

  // Validate email
  if (!input.email || input.email.trim() === '') {
    errors.email = ['Email is required']
  } else if (!input.email.includes('@')) {
    errors.email = ['Email must be valid']
  } else if (input.email.length > 100) {
    errors.email = ['Email must be less than 100 characters']
  }

  // Throw exception if errors exist
  if (Object.keys(errors).length > 0) {
    throw new ValidationError('Validation failed', errors)
  }
}

// Error handler
/**
 * @param {Error} err
 * @param {Request} req
 * @param {Response} res
 */
app.onError((err, req, res) => {
  console.error(`[Error] ${err.message}`)

  if (err instanceof ValidationError) {
    return res.status(400).json({
      error: 'Validation failed',
      details: err.validationErrors,
      suggestion: err.suggestion,
      docUrl: err.docUrl
    })
  }

  if (err instanceof NotFoundError) {
    return res.status(404).json({
      error: err.message,
      suggestion: err.suggestion,
      docUrl: err.docUrl
    })
  }

  // General error
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  })
})

// Start server
const PORT = 3000
app.listen(PORT, () => {
  console.log(`
  ✨ Numflow REST API is running on port ${PORT}

  Try these endpoints:

  GET    http://localhost:${PORT}/
  GET    http://localhost:${PORT}/users
  GET    http://localhost:${PORT}/users/1
  POST   http://localhost:${PORT}/users
         Body: {"name": "Charlie", "email": "charlie@example.com"}
  PUT    http://localhost:${PORT}/users/1
         Body: {"name": "Alice Updated", "email": "alice.new@example.com"}
  DELETE http://localhost:${PORT}/users/1

  💡 Tip: This example demonstrates:
     - Complete CRUD operations
     - Input validation with helpful error messages
     - JSDoc type annotations for type safety
     - VSCode auto-completion support
  `)
})
