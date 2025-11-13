/**
 * Step 100: Toggle TODO completion status
 */

async function toggleTodo(ctx, req, res) {
  const { todoId } = ctx

  // Find TODO
  const todo = global.todos.find((t) => t.id === todoId)

  if (!todo) {
    throw new Error(`TODO not found (ID: ${todoId})`)
  }

  // Toggle completion status
  todo.completed = !todo.completed

  // Save result
  ctx.todo = todo

  // Done! Automatically proceeds to next Step
}

module.exports = toggleTodo
