/**
 * DELETE /todos/:id - Delete TODO
 *
 * Convention over Configuration:
 * - HTTP Method: folder name 'delete' → DELETE
 * - Path: folder structure → /todos/:id
 * - Steps: ./steps directory auto-detected
 */

const numflow = require('../../../../../../dist/cjs/index.js')

module.exports = numflow.feature({
  contextInitializer: (ctx, req, res) => {
    ctx.todoId = parseInt(req.params.id, 10)
  },
})
