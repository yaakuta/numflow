/**
 * Step 300: Call LLM API
 *
 * Call LLM API based on current Provider.
 *
 * Supported Providers:
 * - OpenAI (gpt-3.5-turbo)
 * - OpenRouter (mixtral-8x7b-32768)
 * - Gemini (gemini-pro)
 *
 * On error:
 * - Rate Limit (429) → Provider Fallback in onError
 * - Timeout → Exponential Backoff Retry in onError
 */

const OpenAI = require('openai').default
const { GoogleGenerativeAI } = require('@google/generative-ai')

/**
 * Provider configuration
 */
const PROVIDERS = {
  openai: {
    name: 'OpenAI',
    model: 'gpt-3.5-turbo',
    timeout: 30000,  // 30 seconds
    getClient: () => new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      timeout: 30000
    })
  },

  openrouter: {
    name: 'OpenRouter',
    model: 'mistralai/mixtral-8x7b-instruct',
    timeout: 30000,
    getClient: () => new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: process.env.OPENROUTER_API_KEY,
      timeout: 30000,
      defaultHeaders: {
        'HTTP-Referer': 'https://github.com/gazerkr/numflow',
        'X-Title': 'Numflow LLM Chat Example'
      }
    })
  },

  gemini: {
    name: 'Google Gemini',
    model: 'gemini-pro',
    timeout: 30000,
    getClient: () => new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  }
}

/**
 * Call OpenAI/OpenRouter API (common)
 */
async function callOpenAICompatible(provider, messages) {
  const client = provider.getClient()

  const response = await client.chat.completions.create({
    model: provider.model,
    messages,
    temperature: 0.7,
    max_tokens: 500
  })

  return response.choices[0].message.content
}

/**
 * Call Gemini API
 */
async function callGemini(provider, messages) {
  const client = provider.getClient()
  const model = client.getGenerativeModel({ model: provider.model })

  // Gemini doesn't support system messages, merge into user message
  const systemMsg = messages.find(m => m.role === 'system')?.content || ''
  const userMsg = messages.find(m => m.role === 'user')?.content || ''

  const prompt = systemMsg
    ? `${systemMsg}\n\nUser: ${userMsg}`
    : userMsg

  const result = await model.generateContent(prompt)
  const response = await result.response
  return response.text()
}

/**
 * Main function
 */
module.exports = async (ctx, req, res) => {
  const providerName = ctx.currentProvider
  const provider = PROVIDERS[providerName]

  if (!provider) {
    throw new Error(`Unknown provider: ${providerName}`)
  }

  // Check API key
  const envVarName = `${providerName.toUpperCase()}_API_KEY`
  if (!process.env[envVarName]) {
    throw new Error(`Missing ${envVarName} environment variable`)
  }

  console.log(`[LLM] Calling ${provider.name} (${provider.model})...`)

  try {
    let responseText

    // Call API by Provider
    if (providerName === 'gemini') {
      responseText = await callGemini(provider, ctx.messages)
    } else {
      // OpenAI, OpenRouter (OpenAI-compatible)
      responseText = await callOpenAICompatible(provider, ctx.messages)
    }

    // Save response
    ctx.response = responseText
    ctx.usedProvider = providerName

    const duration = Date.now() - ctx.startTime
    console.log(`[LLM] Success! (${duration}ms)`)
    console.log(`[LLM] Response: "${responseText.substring(0, 100)}${responseText.length > 100 ? '...' : ''}"`)

    // Final response
    res.json({
      response: responseText,
      provider: providerName,
      model: provider.model,
      retryCount: ctx.retryCount,
      duration
    })
  } catch (error) {
    console.error(`[LLM] Error from ${provider.name}:`, error.message)

    // Normalize error message
    let errorMessage = error.message

    // Detect rate limit
    if (error.status === 429 || errorMessage.includes('rate limit')) {
      throw new Error('rate_limit')
    }

    // Detect timeout
    if (errorMessage.includes('timeout') || errorMessage.includes('ETIMEDOUT')) {
      throw new Error('timeout')
    }

    // Authentication error
    if (error.status === 401 || errorMessage.includes('api_key')) {
      throw new Error('api_key invalid')
    }

    // Pass original error
    throw error
  }
}
