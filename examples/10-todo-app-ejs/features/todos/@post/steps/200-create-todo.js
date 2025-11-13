/**
 * Step 200: Create new TODO
 */

async function createTodo(ctx, req, res) {
  // v0.2.0: Read directly from ctx
  const { validatedText } = ctx

  // Create new TODO object
  const newTodo = {
    id: global.nextId++,
    text: validatedText,
    completed: false,
  }

  // Add to global array
  global.todos.push(newTodo)

  // v0.2.0: Store directly in ctx
  ctx.todo = newTodo

  // Done! Automatically proceeds to next Step
}

module.exports = createTodo
