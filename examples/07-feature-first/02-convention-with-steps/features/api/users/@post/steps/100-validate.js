/**
 * Step 100: Input Validation
 *
 * Validate user input data.
 */

module.exports = async (ctx, req, res) => {
  console.log('🔹 Step 100: Input validation')

  const { name, email, age } = ctx.userData

  // Validate required fields
  if (!name || !email) {
    throw new Error('name and email are required.')
  }

  // Email format validation (simple version)
  if (!email.includes('@')) {
    throw new Error('Not a valid email format.')
  }

  // Age validation
  if (age !== undefined && (age < 0 || age > 150)) {
    throw new Error('Please enter a valid age.')
  }

  console.log('  ✅ Input validation passed')

  ctx.validated = true
  ctx.validatedAt = Date.now()
}
