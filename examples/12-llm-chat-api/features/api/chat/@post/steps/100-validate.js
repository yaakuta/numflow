/**
 * Step 100: Input validation
 *
 * Validate user input:
 * - Check message field
 * - Check message length (max 4000 characters)
 * - Validate provider
 */

const VALID_PROVIDERS = ['openai', 'openrouter', 'gemini']
const MAX_MESSAGE_LENGTH = 4000

module.exports = async (ctx, req, res) => {
  const { message, provider } = req.body

  // 1. Check message required
  if (!message) {
    res.status(400).json({
      error: 'Validation failed',
      field: 'message',
      message: 'Message is required'
    })
    return
  }

  // 2. Check message type
  if (typeof message !== 'string') {
    res.status(400).json({
      error: 'Validation failed',
      field: 'message',
      message: 'Message must be a string'
    })
    return
  }

  // 3. Check message length
  if (message.length > MAX_MESSAGE_LENGTH) {
    res.status(400).json({
      error: 'Validation failed',
      field: 'message',
      message: `Message too long (max ${MAX_MESSAGE_LENGTH} characters)`
    })
    return
  }

  // 4. Validate provider (optional field)
  if (provider && !VALID_PROVIDERS.includes(provider)) {
    res.status(400).json({
      error: 'Validation failed',
      field: 'provider',
      message: `Invalid provider. Must be one of: ${VALID_PROVIDERS.join(', ')}`
    })
    return
  }

  // 5. Validation passed - Save to Context
  ctx.message = message.trim()
  ctx.validated = true

  console.log(`[Validate] Message: "${ctx.message.substring(0, 50)}${ctx.message.length > 50 ? '...' : ''}"`)
  console.log(`[Validate] Provider: ${ctx.currentProvider}`)
}
