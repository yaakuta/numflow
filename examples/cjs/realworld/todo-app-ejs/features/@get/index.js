/**
 * GET / - TODO List Page
 *
 * Convention over Configuration:
 * - method: 'GET' <- Auto-inferred from folder name '@get'
 * - path: '/' <- Auto-inferred from folder structure
 * - steps: './steps' <- Automatic detection!
 */

const numflow = require('numflow')
const db = require('#db')

module.exports = numflow.feature({
  // Context initialization
  contextInitializer: (ctx, req, res) => {
    ctx.todos = db.findAll()
  },

  // Error handling with EJS template
  onError: async (error, ctx, req, res) => {
    console.error('Error loading TODO list:', error.message)
    const statusCode = error.statusCode || 500
    res.status(statusCode).render('error', {
      errorMessage: error.message
    })
  }
})
