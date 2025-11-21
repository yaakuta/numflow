/**
 * GET / - TODO List Page
 *
 * Convention over Configuration:
 * - method: 'GET' ← Auto-inferred from folder name '@get'
 * - path: '/' ← Auto-inferred from folder structure
 * - steps: './steps' ← Automatic detection!
 *
 * This Feature renders the main TODO list page with EJS template.
 */

const numflow = require("numflow");

module.exports = numflow.feature({
  // method: 'GET' (auto-inferred from '@get' folder)
  // path: '/' (auto-inferred from folder structure)
  // steps: './steps' (automatic detection)

  // Context initialization
  contextInitializer: (ctx, req, res) => {
    // Load all TODOs from global store
    ctx.todos = global.todos || [];
  },

  // Error handling with EJS template
  onError: async (error, ctx, req, res) => {
    console.error("❌ Error loading TODO list:", error.message);

    // Render error page using EJS template
    res.statusCode = 500;
    res.render("error", {
      errorMessage: error.message,
    });
  },
});
