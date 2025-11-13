/**
 * POST /todos - Add new TODO
 *
 * Convention over Configuration:
 * - HTTP Method: folder name 'post' → POST
 * - Path: folder structure → /todos
 * - Steps: ./steps directory auto-detected
 */

const numflow = require('../../../../../dist/cjs/index.js')

module.exports = numflow.feature({
  // Extract request data with contextInitializer
  contextInitializer: (ctx, req, res) => {
    ctx.todoText = req.body?.text
  },
})
