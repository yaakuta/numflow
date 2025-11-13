const numflow = require('../../../../../../../../dist/cjs/index.js')

module.exports = numflow.feature({
  method: 'GET',
  path: '/api/v1/orders/:id',
  // steps: './steps' auto-detected
})
