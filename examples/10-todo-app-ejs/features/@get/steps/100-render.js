/**
 * Step 100: Render TODO list with EJS template
 *
 * Renders the main page with all TODOs using EJS template engine.
 */

module.exports = async (ctx, req, res) => {
  // Render EJS template with TODOs
  res.render("index", {
    todos: ctx.todos,
  });
};
