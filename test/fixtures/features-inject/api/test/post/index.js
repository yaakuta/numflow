/**
 * Test Feature for inject() method
 * Automatically resolves method (POST) and path (/api/test) from folder structure
 */

const numflow = require('../../../../../../../dist/cjs/index.js')

module.exports = numflow.feature({
  // method: 'POST' ← Auto-resolved from 'post' folder
  // path: '/api/test' ← Auto-resolved from folder structure
})
