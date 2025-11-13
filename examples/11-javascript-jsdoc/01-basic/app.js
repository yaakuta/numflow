/**
 * Numflow Basic Example with JSDoc
 *
 * Example of securing type safety and auto-completion using
 * JavaScript + JSDoc without TypeScript.
 */

const numflow = require('numflow')

/**
 * It's convenient to collect type definitions at the top of the file
 * @typedef {import('numflow').Application} Application
 * @typedef {import('numflow').Request} Request
 * @typedef {import('numflow').Response} Response
 * @typedef {import('numflow').NextFunction} NextFunction
 */

// Create Application instance
/** @type {Application} */
const app = numflow()

// Logging middleware
/**
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 */
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`)
  next()
})

// Hello World
/**
 * @param {Request} req
 * @param {Response} res
 */
app.get('/', (req, res) => {
  res.json({
    message: 'Hello, Numflow with JSDoc!',
    tip: 'Try hovering over req and res in VSCode'
  })
})

// Path parameters
/**
 * @param {Request} req
 * @param {Response} res
 */
app.get('/users/:id', (req, res) => {
  const userId = req.params.id

  res.json({
    userId,
    message: `User ${userId} details`
  })
})

// Query parameters
/**
 * @param {Request} req
 * @param {Response} res
 */
app.get('/search', (req, res) => {
  const query = req.query.q
  const page = req.query.page || '1'

  res.json({
    query,
    page: parseInt(page),
    results: []
  })
})

// POST with body
/**
 * @param {Request} req
 * @param {Response} res
 */
app.post('/data', (req, res) => {
  const data = req.body

  res.status(201).json({
    success: true,
    received: data
  })
})

// Error handling
const { NotFoundError } = require('numflow')

/**
 * @param {Request} req
 * @param {Response} res
 */
app.get('/error', (req, res) => {
  throw new NotFoundError('This is a test error')
})

/**
 * Error handler
 * @param {Error} err
 * @param {Request} req
 * @param {Response} res
 */
app.onError((err, req, res) => {
  console.error('Error:', err.message)

  res.status(err.statusCode || 500).json({
    error: err.message,
    suggestion: err.suggestion,
    docUrl: err.docUrl
  })
})

// Start server
const PORT = 3000
app.listen(PORT, () => {
  console.log(`
  ✨ Numflow server with JSDoc is running!

  Try these endpoints:
  - GET  http://localhost:${PORT}/
  - GET  http://localhost:${PORT}/users/123
  - GET  http://localhost:${PORT}/search?q=test&page=2
  - POST http://localhost:${PORT}/data (with JSON body)
  - GET  http://localhost:${PORT}/error (test error handling)

  💡 Tip: Open this file in VSCode and hover over 'req' or 'res'
      to see the full type information and auto-completion!
  `)
})
