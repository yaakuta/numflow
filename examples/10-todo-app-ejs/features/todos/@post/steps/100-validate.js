/**
 * Step 100: Validate TODO input
 */

async function validate(ctx, req, res) {
  const { todoText } = ctx

  // Validation: Check empty string
  if (!todoText || todoText.trim() === '') {
    throw new Error('Please enter TODO content')
  }

  // Validation: Check maximum length
  if (todoText.length > 200) {
    throw new Error('Please enter TODO within 200 characters')
  }

  // v0.2.0: Store directly in ctx
  ctx.validatedText = todoText.trim()

  // Done! Automatically proceeds to next Step
}

module.exports = validate
