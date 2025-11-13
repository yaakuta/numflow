/**
 * Step 100: Validate input
 *
 * Validate user input data.
 */

const { ValidationError } = require('numflow')

/**
 * @typedef {import('numflow').Context} Context
 * @typedef {import('numflow').StepFunction} StepFunction
 */

/**
 * Input validation Step
 *
 * @type {StepFunction}
 * @param {Context} ctx - Feature context
 * @returns {Promise<boolean>} If true, proceed to next step
 *
 * @example
 * const ctx = { req: { body: { name: 'Alice', email: 'alice@example.com' } } }
 * await validate(ctx) // -> true
 */
module.exports = async (ctx) => {
  const { name, email } = ctx.req.body

  /** @type {Record<string, string[]>} */
  const errors = {}

  // Validate name
  if (!name || name.trim() === '') {
    errors.name = ['Name is required']
  } else if (name.length < 2) {
    errors.name = ['Name must be at least 2 characters']
  }

  // Validate email
  if (!email || email.trim() === '') {
    errors.email = ['Email is required']
  } else if (!email.includes('@')) {
    errors.email = ['Email must be valid']
  }

  // Throw error if validation fails
  if (Object.keys(errors).length > 0) {
    throw new ValidationError('Validation failed', errors)
  }

  // Validation success - proceed to next step
  return true
}
