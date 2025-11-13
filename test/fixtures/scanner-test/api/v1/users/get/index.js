const numflow = require('../../../../../../../dist/cjs/index.js')

module.exports = numflow.feature({
  method: 'GET',
  path: '/api/v1/users',
  // steps: './steps' auto-detected
})
