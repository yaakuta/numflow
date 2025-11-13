/**
 * Step 200: Create user
 *
 * Create user with validated data.
 */

/**
 * @typedef {import('numflow').Context} Context
 * @typedef {import('numflow').StepFunction} StepFunction
 */

/**
 * User type definition
 * @typedef {Object} User
 * @property {number} id
 * @property {string} name
 * @property {string} email
 * @property {Date} createdAt
 */

// In-memory user storage
/** @type {User[]} */
const users = []
let nextId = 1

/**
 * User creation Step
 *
 * @type {StepFunction}
 * @param {Context} ctx - Feature context
 * @returns {Promise<boolean>}
 */
module.exports = async (ctx) => {
  const { name, email } = ctx.req.body

  // Check duplicate email
  const existingUser = users.find(u => u.email === email)
  if (existingUser) {
    const { ValidationError } = require('numflow')
    throw new ValidationError('Email already exists', {
      email: ['This email is already registered']
    })
  }

  // Create new user
  /** @type {User} */
  const newUser = {
    id: nextId++,
    name,
    email,
    createdAt: new Date()
  }

  users.push(newUser)

  // Send response
  ctx.res.status(201).json({
    success: true,
    message: 'User created successfully',
    user: newUser
  })

  // Response complete - don't execute next step
  return false
}
