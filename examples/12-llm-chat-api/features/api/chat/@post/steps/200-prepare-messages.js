/**
 * Step 200: Prepare messages
 *
 * Prepare message array to send to LLM API.
 *
 * In this simple example, we only use System prompt + User message,
 * but in production, you can load and add conversation history.
 */

module.exports = async (ctx, req, res) => {
  // Message array to send to LLM API
  ctx.messages = [
    {
      role: 'system',
      content: 'You are a helpful AI assistant. Be concise and friendly.'
    },
    {
      role: 'user',
      content: ctx.message
    }
  ]

  console.log(`[Prepare] Messages prepared (${ctx.messages.length} messages)`)

  // Real-world example: Add conversation history
  // const conversationId = req.body.conversationId
  // if (conversationId) {
  //   const history = await db.conversations.getHistory(conversationId)
  //   ctx.messages = [
  //     { role: 'system', content: '...' },
  //     ...history,
  //     { role: 'user', content: ctx.message }
  //   ]
  // }
}
