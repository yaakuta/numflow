import { RequestHandler } from './types/index.js'

/**
 * CORS Options
 * Cross-Origin Resource Sharing
 */
export interface CorsOptions {
  /**
   * Allowed origins
   * Can be a string, array of strings, or a function
   */
  origin?: string | string[] | ((origin: string) => boolean)

  /**
   * Allowed HTTP methods
   * Default: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE']
   */
  methods?: string | string[]

  /**
   * Allowed headers
   */
  allowedHeaders?: string | string[]

  /**
   * Exposed headers
   */
  exposedHeaders?: string | string[]

  /**
   * Allow credentials
   * Default: false
   */
  credentials?: boolean

  /**
   * Max age for preflight cache (seconds)
   * Default: undefined
   */
  maxAge?: number

  /**
   * Handle preflight requests
   * Default: true
   */
  preflightContinue?: boolean

  /**
   * Success status code for preflight
   * Default: 204
   */
  optionsSuccessStatus?: number
}

/**
 * CORS middleware
 * Enables Cross-Origin Resource Sharing
 *
 * Express-compatible CORS middleware
 *
 * @param options - CORS options
 * @returns Middleware function
 *
 * @example
 * // JavaScript - Allow all origins
 * const cors = require('numflow').cors
 * app.use(cors())
 *
 * @example
 * // Allow specific origin
 * app.use(cors({ origin: 'https://example.com' }))
 *
 * @example
 * // Allow multiple origins
 * app.use(cors({
 *   origin: ['https://example.com', 'https://api.example.com'],
 *   credentials: true
 * }))
 */
export function cors(options: CorsOptions = {}): RequestHandler {
  const {
    origin = '*',
    methods = ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
    allowedHeaders,
    exposedHeaders,
    credentials = false,
    maxAge,
    preflightContinue = false,
    optionsSuccessStatus = 204,
  } = options

  return (req: any, res, next) => {
    const requestOrigin = req.headers.origin || req.headers.referer

    // Set Access-Control-Allow-Origin
    if (typeof origin === 'function') {
      if (requestOrigin && origin(requestOrigin)) {
        res.setHeader('Access-Control-Allow-Origin', requestOrigin)
        res.setHeader('Vary', 'Origin')
      }
    } else if (Array.isArray(origin)) {
      if (requestOrigin && origin.includes(requestOrigin)) {
        res.setHeader('Access-Control-Allow-Origin', requestOrigin)
        res.setHeader('Vary', 'Origin')
      }
    } else if (origin === '*') {
      res.setHeader('Access-Control-Allow-Origin', '*')
    } else {
      res.setHeader('Access-Control-Allow-Origin', origin)
      if (origin !== '*') {
        res.setHeader('Vary', 'Origin')
      }
    }

    // Set Access-Control-Allow-Credentials
    if (credentials) {
      res.setHeader('Access-Control-Allow-Credentials', 'true')
    }

    // Set Access-Control-Expose-Headers
    if (exposedHeaders) {
      const headers = Array.isArray(exposedHeaders) ? exposedHeaders.join(', ') : exposedHeaders
      res.setHeader('Access-Control-Expose-Headers', headers)
    }

    // Handle preflight requests (OPTIONS)
    if (req.method === 'OPTIONS') {
      // Set Access-Control-Allow-Methods
      const methodsStr = Array.isArray(methods) ? methods.join(', ') : methods
      res.setHeader('Access-Control-Allow-Methods', methodsStr)

      // Set Access-Control-Allow-Headers
      if (allowedHeaders) {
        const headers = Array.isArray(allowedHeaders) ? allowedHeaders.join(', ') : allowedHeaders
        res.setHeader('Access-Control-Allow-Headers', headers)
      } else {
        // Echo back the request headers
        const requestHeaders = req.headers['access-control-request-headers']
        if (requestHeaders) {
          res.setHeader('Access-Control-Allow-Headers', requestHeaders)
        }
      }

      // Set Access-Control-Max-Age
      if (maxAge !== undefined) {
        res.setHeader('Access-Control-Max-Age', String(maxAge))
      }

      if (!preflightContinue) {
        // End preflight request
        res.statusCode = optionsSuccessStatus
        res.setHeader('Content-Length', '0')
        res.end()
        return
      }
    }

    next()
  }
}
