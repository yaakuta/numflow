const numflow = require('../../../../../../../dist/cjs/index.js')

module.exports = numflow.feature({
  method: 'POST',
  path: '/api/v1/orders',
  // steps: './steps' auto-detected
})
