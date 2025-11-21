const numflow = require("numflow")

/**
 * GET /api/v1/users - Get All Users
 *
 * Convention over Configuration:
 * - method: 'GET' (auto-inferred from folder name 'get')
 * - path: '/api/v1/users' (auto-inferred from folder structure)
 * - steps: './steps' (auto-detected)
 */
module.exports = numflow.feature({
  // method and path are auto-inferred by Convention!
  // steps also auto-loaded from ./steps directory!
})
