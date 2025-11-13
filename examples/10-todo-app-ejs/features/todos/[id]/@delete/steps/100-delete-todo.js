/**
 * Step 100: Delete TODO
 */

async function deleteTodo(ctx, req, res) {
  const { todoId } = ctx

  // Find TODO index
  const index = global.todos.findIndex((t) => t.id === todoId)

  if (index === -1) {
    throw new Error(`TODO not found (ID: ${todoId})`)
  }

  // Delete
  const [deletedTodo] = global.todos.splice(index, 1)

  // Save result
  ctx.deletedTodo = deletedTodo

  // Done! Automatically proceeds to next Step
}

module.exports = deleteTodo
