/**
 * Greet Feature
 *
 * Convention over Configuration demo:
 * - method: 'POST' ← Auto-inferred from folder name 'post'!
 * - path: '/greet' ← Auto-inferred from folder structure 'greet/post'!
 * - steps: './steps' ← Automatic detection of steps folder!
 *
 * No manual configuration needed!
 */

const numflow = require('../../../../../../dist/cjs/index.js')

module.exports = numflow.feature({
  // method and path are auto-inferred from Convention!
  // method: 'POST' (from folder name 'post')
  // path: '/greet' (from folder structure)
  // steps: './steps' (automatic detection of steps folder)

  // Context initialization
  contextInitializer: (ctx, req, res) => {
    ctx.name = req.body.name || 'Guest'
    ctx.language = req.body.language || 'en'
  },
})
