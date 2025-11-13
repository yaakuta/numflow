import { Application } from './application.js'
import { feature, Feature, retry } from './feature/index.js'
import { Router } from './router.js'
import { staticFiles } from './static.js'
import { json, urlencoded, raw, text } from './body-parser.js'
import { cookieParser } from './cookie-parser.js'
import { cors } from './cors.js'
import { compression } from './compression.js'
import type { RouteOptions } from './types/index.js'

/**
 * Numflow framework factory function
 * High-performance web framework compatible with Express
 *
 * @returns Application instance
 *
 * @example
 * // JavaScript (CommonJS)
 * const numflow = require('numflow')
 * const app = numflow()
 * app.listen(3000)
 *
 * @example
 * // JavaScript (ESM)
 * import numflow from 'numflow'
 * const app = numflow()
 * app.listen(3000)
 *
 * @example
 * // TypeScript
 * import numflow from 'numflow'
 * const app = numflow()
 * app.listen(3000)
 */
function numflow(): Application {
  return new Application()
}

// Feature API
numflow.feature = feature
numflow.retry = retry

// Router factory
numflow.Router = (options?: RouteOptions) => new Router(options)

// Static file serving
numflow.static = staticFiles

// Body parsers
numflow.json = json
numflow.urlencoded = urlencoded
numflow.raw = raw
numflow.text = text

// Cookie parser
numflow.cookieParser = cookieParser

// CORS
numflow.cors = cors

// Compression
numflow.compression = compression

// Named export
export { Application, Feature, feature, Router, retry }

// Export Feature types (ValidationError excluded - exported from errors/index.ts)
export {
  FeatureConfig,
  FeatureHandler,
  Context,
  StepInfo,
  StepFunction,
  AsyncTaskInfo,
  AsyncTaskFunction,
  FeatureError,
} from './feature/types.js'

// Export Retry types
export { RETRY, isRetrySignal, RetrySignal } from './feature/retry.js'

// Export Router types
export * from './types/index.js'

// Export Error classes
// ValidationError exported here (to prevent conflict with Feature's ValidationError)
export * from './errors/index.js'

// Export Body Parsers
export { json, urlencoded, raw, text } from './body-parser.js'
export type { BodyParserOptions } from './body-parser.js'

// Export Static file serving
export { staticFiles, serveStatic } from './static.js'
export type { StaticOptions } from './static.js'

// Export Cookie parser
export { cookieParser } from './cookie-parser.js'
export type { CookieParserOptions } from './cookie-parser.js'

// Export CORS
export { cors } from './cors.js'
export type { CorsOptions } from './cors.js'

// Export Compression
export { compression } from './compression.js'
export type { CompressionOptions } from './compression.js'

// Default export
export default numflow

// CommonJS compatibility
// Ignored in TypeScript, only works in built JS
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  // @ts-ignore - CommonJS compatibility
  const exports = require('./errors/index.js')

  // @ts-ignore - CommonJS compatibility
  module.exports = numflow
  // @ts-ignore - CommonJS compatibility
  module.exports.default = numflow
  // @ts-ignore - CommonJS compatibility
  module.exports.Application = Application
  // @ts-ignore - CommonJS compatibility
  module.exports.Feature = Feature
  // @ts-ignore - CommonJS compatibility
  module.exports.feature = feature
  // @ts-ignore - CommonJS compatibility
  module.exports.retry = retry
  // @ts-ignore - CommonJS compatibility
  module.exports.Router = (options) => new Router(options)

  // Export all error classes for CommonJS
  // @ts-ignore - CommonJS compatibility
  Object.keys(exports).forEach(key => {
    module.exports[key] = exports[key]
  })
}
