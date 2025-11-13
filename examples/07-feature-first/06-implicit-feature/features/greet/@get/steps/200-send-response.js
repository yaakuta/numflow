/**
 * Step 200: Send Response
 *
 * Read data from Context and send JSON response.
 *
 * @param {Object} ctx - Feature context
 * @param {string} ctx.greeting - Greeting
 * @param {string} ctx.message - Message
 * @param {string} ctx.name - Name
 * @param {string} ctx.language - Language
 * @param {Object} req - Request object (not used)
 * @param {Object} res - Response object
 * @returns {void}
 */
module.exports = function sendResponse(ctx, req, res) {
  console.log(`[Step 200] Send JSON response`)

  // Read data from Context
  const { greeting, message, name, language } = ctx

  // Send JSON response
  res.json({
    success: true,
    data: {
      greeting,
      message,
      name,
      language,
    },
    timestamp: new Date().toISOString(),
  })

  console.log(`[Step 200] Response complete`)
}
