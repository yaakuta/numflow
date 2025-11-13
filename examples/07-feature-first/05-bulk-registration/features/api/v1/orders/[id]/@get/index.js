const numflow = require('../../../../../../../../../dist/cjs/index.js')

/**
 * GET /api/v1/orders/:id - Get Order by ID
 *
 * Convention over Configuration:
 * - method: 'GET' (auto-inferred from folder name 'get')
 * - path: '/api/v1/orders/:id' (auto-inferred from folder structure, [id] → :id conversion)
 * - steps: './steps' (auto-detected)
 */
module.exports = numflow.feature({
  // method and path are auto-inferred by Convention!
  // [id] folder → automatically converted to :id parameter
  // steps also auto-loaded from ./steps directory!
})
