/**
 * Chat Feature with Retry & Provider Fallback
 *
 * POST /api/chat
 *
 * This Feature demonstrates:
 * 1. Retry logic using numflow.retry()
 * 2. Provider Fallback on Rate Limit
 * 3. Exponential Backoff on Timeout
 * 4. State management through Context
 */

const numflow = require('numflow')

// Provider priority (Fallback order)
const PROVIDER_PRIORITY = ['openai', 'openrouter', 'gemini']

/**
 * Find next available Provider
 */
function getNextProvider(currentProvider) {
  const currentIndex = PROVIDER_PRIORITY.indexOf(currentProvider)
  const nextProvider = PROVIDER_PRIORITY[currentIndex + 1]

  // Return only Providers with API key
  if (nextProvider === 'openai' && process.env.OPENAI_API_KEY) return 'openai'
  if (nextProvider === 'openrouter' && process.env.OPENROUTER_API_KEY) return 'openrouter'
  if (nextProvider === 'gemini' && process.env.GEMINI_API_KEY) return 'gemini'

  return null
}

module.exports = numflow.feature({
  /**
   * Context initialization
   * - User-specified Provider or default
   * - Initialize retry count
   */
  contextInitializer: (ctx, req, res) => {
    // User-specified Provider or first available Provider
    const requestedProvider = req.body.provider || 'openai'
    const currentProvider = PROVIDER_PRIORITY.includes(requestedProvider)
      ? requestedProvider
      : 'openai'

    ctx.currentProvider = currentProvider
    ctx.retryCount = 0
    ctx.startTime = Date.now()
  },

  /**
   * onError: Retry and Fallback logic 🎯
   *
   * This is the core function!
   */
  onError: async (error, ctx, req, res) => {
    console.log(`[onError] ${error.message}`)
    console.log(`  Current Provider: ${ctx.currentProvider}`)
    console.log(`  Retry Count: ${ctx.retryCount}`)

    // 1️⃣ Rate Limit → Provider Fallback
    if (error.message.includes('rate_limit') || error.message.includes('429')) {
      const nextProvider = getNextProvider(ctx.currentProvider)

      if (nextProvider) {
        console.log(`[Fallback] ${ctx.currentProvider} → ${nextProvider}`)
        ctx.currentProvider = nextProvider
        ctx.retryCount = 0  // Reset retry count when Provider changes

        // Retry after 500ms
        return numflow.retry({ delay: 500 })
      }

      // Rate limit on all Providers
      return res.status(429).json({
        error: 'Rate limit exceeded on all providers',
        providers: PROVIDER_PRIORITY,
        retryAfter: 60
      })
    }

    // 2️⃣ Timeout → Exponential Backoff Retry
    if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
      ctx.retryCount++

      // Retry up to 3 times
      if (ctx.retryCount <= 3) {
        // Exponential backoff: 1s, 2s, 4s
        const delay = 1000 * Math.pow(2, ctx.retryCount - 1)
        console.log(`[Retry] Attempt ${ctx.retryCount}/3 after ${delay}ms`)

        return numflow.retry({ delay, maxAttempts: 3 })
      }

      // Max retry count exceeded → Fallback
      const nextProvider = getNextProvider(ctx.currentProvider)
      if (nextProvider) {
        console.log(`[Fallback] Timeout on ${ctx.currentProvider} → ${nextProvider}`)
        ctx.currentProvider = nextProvider
        ctx.retryCount = 0
        return numflow.retry({ delay: 1000 })
      }

      // Timeout on all Providers
      return res.status(504).json({
        error: 'Request timeout on all providers',
        retryCount: ctx.retryCount
      })
    }

    // 3️⃣ Invalid API Key → Immediate failure
    if (error.message.includes('api_key') || error.message.includes('401')) {
      return res.status(401).json({
        error: 'Invalid API key',
        provider: ctx.currentProvider,
        hint: `Check ${ctx.currentProvider.toUpperCase()}_API_KEY environment variable`
      })
    }

    // 4️⃣ Content Policy Violation → Notify user
    if (error.message.includes('content_policy') || error.message.includes('safety')) {
      return res.status(400).json({
        error: 'Content policy violation',
        message: 'Your message was flagged by content safety filters',
        provider: ctx.currentProvider
      })
    }

    // 5️⃣ Other errors → General error response
    console.error('[Error]', error)
    return res.status(500).json({
      error: error.message || 'Internal server error',
      provider: ctx.currentProvider,
      retryCount: ctx.retryCount
    })
  }
})
