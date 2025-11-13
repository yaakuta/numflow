/**
 * Step 100: Generate Greeting
 *
 * Read query parameters and generate greeting for the language.
 *
 * @param {Object} ctx - Feature context
 * @param {Object} req - Request object
 * @param {Object} req.query - Query parameters
 * @param {string} [req.query.name='World'] - Name
 * @param {string} [req.query.language='en'] - Language (en, ko, ja)
 * @param {Object} res - Response object (not used)
 * @returns {void}
 */
module.exports = function generateGreeting(ctx, req, res) {
  // Read query parameters (set default values)
  const name = req.query.name || 'World'
  const language = req.query.language || 'en'

  console.log(`[Step 100] Generate greeting: name=${name}, language=${language}`)

  // Generate greeting by language
  let greeting
  let message

  switch (language) {
    case 'ko':
      greeting = `Annyeonghaseyo, ${name}!`
      message = 'Have a great day!'
      break
    case 'ja':
      greeting = `Konnichiwa, ${name}!`
      message = 'Have a great day!'
      break
    case 'en':
    default:
      greeting = `Hello, ${name}!`
      message = 'Have a great day!'
      break
  }

  // Store in Context (for use in next Step)
  ctx.greeting = greeting
  ctx.message = message
  ctx.name = name
  ctx.language = language

  console.log(`[Step 100] Generated greeting: ${greeting}`)
}
