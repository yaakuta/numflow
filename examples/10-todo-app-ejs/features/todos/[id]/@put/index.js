/**
 * PUT /todos/:id - Toggle TODO complete/incomplete
 *
 * Convention over Configuration:
 * - HTTP Method: folder name 'put' → PUT
 * - Path: folder structure → /todos/:id ([id] → :id auto-conversion)
 * - Steps: ./steps directory auto-detected
 */

const numflow = require('../../../../../../dist/cjs/index.js')

module.exports = numflow.feature({
  contextInitializer: (ctx, req, res) => {
    ctx.todoId = parseInt(req.params.id, 10)
  },
})
