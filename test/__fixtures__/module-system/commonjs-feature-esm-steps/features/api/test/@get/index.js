/**
 * CommonJS Feature with ESM Steps
 * Tests that ESM-style steps (.mjs with export default) work correctly
 */
const path = require('path')
const numflow = require(path.join(__dirname, '../../../../../../../../dist/cjs/index.js'))

module.exports = numflow.feature({
  // Method and path are inferred from folder structure
  // method: 'GET', path: '/api/test'
})
