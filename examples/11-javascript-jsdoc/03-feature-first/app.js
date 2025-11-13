/**
 * Numflow Feature-First Example with JSDoc
 *
 * Feature-First pattern implementation example using JavaScript + JSDoc.
 */

const numflow = require('numflow')
const path = require('path')

/**
 * @typedef {import('numflow').Application} Application
 */

/** @type {Application} */
const app = numflow()

// Auto-register Features
app.registerFeatures(path.join(__dirname, 'features'))

// Start server
const PORT = 3000
app.listen(PORT, () => {
  console.log(`
  ✨ Numflow Feature-First server is running on port ${PORT}

  Try these endpoints:
  - POST http://localhost:${PORT}/users
    Body: {"name": "Alice", "email": "alice@example.com"}

  💡 Tip: Check the features/ directory to see how features are organized!

  Features are automatically registered from folder structure:
    features/
      users/
        post/            <- POST /users
          index.js       <- Feature definition
          steps/         <- Step functions
            100-validate.js
            200-create.js
  `)
})
