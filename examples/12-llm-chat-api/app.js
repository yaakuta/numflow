/**
 * LLM Chat API with Retry & Provider Fallback
 *
 * Practical example utilizing Numflow's retry() feature.
 *
 * Key Features:
 * - Support for multiple LLM providers (OpenAI, OpenRouter, Gemini)
 * - Automatic provider fallback on rate limit
 * - Exponential backoff retry on timeout
 * - State management through Context
 */

require('dotenv').config()
const numflow = require('numflow')

const app = numflow()

// Body parser
app.use(numflow.json())

// CORS (development environment)
if (process.env.NODE_ENV === 'development') {
  app.use(numflow.cors())
}

// Health check
app.get('/', (req, res) => {
  res.json({
    service: 'LLM Chat API',
    status: 'healthy',
    providers: {
      openai: !!process.env.OPENAI_API_KEY,
      openrouter: !!process.env.OPENROUTER_API_KEY,
      gemini: !!process.env.GEMINI_API_KEY
    },
    features: [
      'Multi-provider support',
      'Automatic provider fallback',
      'Exponential backoff retry',
      'Graceful error handling'
    ]
  })
})

// Register Features (POST /api/chat)
app.registerFeatures('./features')

// Global error handler
app.onError((err, req, res) => {
  console.error('Global Error:', err.message)

  if (res.headersSent) {
    return
  }

  res.status(err.statusCode || 500).json({
    error: err.message || 'Internal server error',
    statusCode: err.statusCode || 500
  })
})

// Start server
const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
  console.log('='.repeat(60))
  console.log('🚀 LLM Chat API Server')
  console.log('='.repeat(60))
  console.log(`Server running on: http://localhost:${PORT}`)
  console.log('')
  console.log('Available Providers:')
  if (process.env.OPENAI_API_KEY) console.log('  ✅ OpenAI')
  if (process.env.OPENROUTER_API_KEY) console.log('  ✅ OpenRouter')
  if (process.env.GEMINI_API_KEY) console.log('  ✅ Gemini')
  console.log('')
  console.log('API Endpoints:')
  console.log('  GET  / - Health check')
  console.log('  POST /api/chat - Chat completion')
  console.log('')
  console.log('Example:')
  console.log(`  curl -X POST http://localhost:${PORT}/api/chat \\`)
  console.log(`    -H "Content-Type: application/json" \\`)
  console.log(`    -d '{"message":"Hello, how are you?"}'`)
  console.log('='.repeat(60))
})
