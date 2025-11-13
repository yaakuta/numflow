/**
 * Create User Feature
 *
 * Convention over Configuration demo:
 * - method: 'POST' ← Auto-inferred from folder name 'post'
 * - path: '/api/users' ← Auto-inferred from folder structure 'api/users/post'
 * - steps: './steps' ← Automatic detection of 'steps' folder!
 *
 * Steps files auto-loaded:
 *   - 100-validate.js
 *   - 200-normalize.js
 *   - 300-create-user.js
 *
 * All configuration is automatically inferred!
 */

const numflow = require("../../../../../../../dist/cjs/index.js")

module.exports = numflow.feature({
  // method: 'POST' (auto-inferred from folder name 'post')
  // path: '/api/users' (auto-inferred from folder structure)
  // steps: './steps' (automatic detection of steps folder)

  // Context initialization
  contextInitializer: (ctx, req, res) => {
    ctx.userData = req.body
  },

  // Error handling
  onError: async (error, ctx, req, res) => {
    console.error('❌ Error occurred:', error.message)

    res.statusCode = error.message.includes('required') || error.message.includes('valid') ? 400 : 500
    res.setHeader('Content-Type', 'application/json')
    res.end(
      JSON.stringify({
        success: false,
        error: error.message,
      })
    )
  },
})
