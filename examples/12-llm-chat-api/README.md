# LLM Chat API with Retry & Provider Fallback

Example LLM chatbot API utilizing Numflow's `retry()` feature.

## Key Features

✅ **Multiple Provider Support** (OpenAI, OpenRouter, Gemini)
✅ **Automatic Provider Fallback** (on Rate limit)
✅ **Exponential Backoff Retry** (on Timeout)
✅ **Context-based State Management** (Retry count, Provider switching)
✅ **Graceful Error Handling** (Different handling per error type)

## Installation

```bash
npm install
```

## Environment Variables

Copy `.env.example` to `.env` and enter API keys:

```bash
cp .env.example .env
```

```env
# At least 1 Provider API key is required
OPENAI_API_KEY=sk-...
OPENROUTER_API_KEY=sk-...
GEMINI_API_KEY=...
```

## Run

```bash
node app.js
```

Server runs at http://localhost:3000.

## API Usage

### POST /api/chat

**Request:**
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello, how are you?",
    "provider": "openai"
  }'
```

**Parameters:**
- `message` (required): User message
- `provider` (optional): LLM Provider (`openai`, `openrouter`, `gemini`). Default: `openai`

**Response:**
```json
{
  "response": "I'm doing well, thank you! How can I help you today?",
  "provider": "openai",
  "retryCount": 0
}
```

## Retry Behavior

### 1. Rate Limit → Provider Fallback

Automatically switch to OpenRouter when OpenAI rate limit occurs:

```
OpenAI (rate_limit) → OpenRouter → Gemini
```

### 2. Timeout → Exponential Backoff

Retry on timeout (max 3 times):

```
1st retry: after 1s
2nd retry: after 2s
3rd retry: after 4s
```

### 3. All Providers Failed

When all Providers fail:

```json
{
  "error": "All LLM providers unavailable",
  "retryCount": 3,
  "lastError": "timeout"
}
```

## Code Structure

```
features/api/chat/@post/
├── index.js                    # Feature definition (retry logic)
└── steps/
    ├── 100-validate.js         # Input validation
    ├── 200-prepare-messages.js # Prepare messages
    └── 300-call-llm.js         # Call LLM API
```

### Retry Logic (index.js)

```javascript
onError: async (error, ctx, req, res) => {
  // Rate Limit → Provider Fallback
  if (error.message.includes('rate_limit')) {
    const nextProvider = getNextProvider(ctx.currentProvider)
    if (nextProvider) {
      ctx.currentProvider = nextProvider
      return numflow.retry({ delay: 500 })  // Retry after 500ms
    }
  }

  // Timeout → Exponential Backoff
  if (error.message.includes('timeout')) {
    ctx.retryCount = (ctx.retryCount || 0) + 1
    if (ctx.retryCount <= 3) {
      const delay = 1000 * Math.pow(2, ctx.retryCount - 1)
      return numflow.retry({ delay, maxAttempts: 3 })
    }
  }

  // Final error response
  res.status(503).json({
    error: 'Service unavailable',
    retryCount: ctx.retryCount
  })
}
```

## Testing

### Normal Case
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello!"}'
```

### Specify Provider
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello!","provider":"gemini"}'
```

### Error Case (Invalid Provider)
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello!","provider":"invalid"}'
```

## Key Learning Points

1. **Using `numflow.retry()`**
   - No options: Immediate retry
   - `{ delay: 1000 }`: Retry after 1s
   - `{ maxAttempts: 3 }`: Max 3 retries

2. **State Management through Context**
   - `ctx.currentProvider`: Current Provider in use
   - `ctx.retryCount`: Retry count
   - Context preserved between retries

3. **Provider Fallback Pattern**
   - Priority: OpenAI → OpenRouter → Gemini
   - Different settings per Provider (timeout, model, etc.)

4. **Exponential Backoff**
   - Retry intervals: 1s, 2s, 4s, 8s...
   - Effective in network congestion

## Production Considerations

1. **Rate Limiting**: Add per-user request limits
2. **Caching**: Cache identical requests
3. **Monitoring**: Track success/failure rate per Provider
4. **Cost Tracking**: Track token usage and costs
5. **Timeout Settings**: Set appropriate timeout per Provider

## References

- [Feature API - Error Retry](../../docs/api/feature.md#error-retry-retry-)
- [LLM Integration Guide](../../docs/LLM_INTEGRATION.md)
- [Getting Started - Error Handling](../../docs/getting-started/error-handling.md)
