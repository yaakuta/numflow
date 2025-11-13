/**
 * User creation Feature (with JSDoc)
 *
 * Convention over Configuration:
 * - method: 'POST' (auto-inferred from folder name 'post')
 * - path: '/users' (auto-inferred from folder structure)
 * - steps: './steps' (auto-detect steps folder)
 */

const numflow = require('numflow')

/**
 * @typedef {import('numflow').FeatureConfig} FeatureConfig
 * @typedef {import('numflow').Context} Context
 */

/**
 * User creation Feature
 * @type {FeatureConfig}
 */
module.exports = numflow.feature({
  // method and path are auto-inferred from folder structure!
  // method: 'POST'  <- from folder name 'post'
  // path: '/users'  <- from folder name 'users'

  // Auto-detect steps folder
  steps: './steps'

  // When handler is omitted, only steps execute
})
