/**
 * Error Handler
 *
 * Simplified Express-style error handling.
 */

import { IncomingMessage, ServerResponse } from 'http'
import { FeatureError } from '../feature/types.js'

/**
 * Error response interface
 */
export interface ErrorResponse {
  error: {
    message: string
    statusCode: number
    step?: {
      number: number
      name: string
    }
    stack?: string
  }
}

/**
 * Convert error to HTTP response
 *
 * @param err - Error object
 * @param req - Request object
 * @param res - Response object
 * @param includeStack - Whether to include stack trace (development mode)
 */
export function sendErrorResponse(
  err: Error,
  _req: IncomingMessage,
  res: ServerResponse,
  includeStack: boolean = false
): void {
  // Ignore if response already sent
  if (res.headersSent) {
    return
  }

  // Extract status code: FeatureError > err.statusCode > 500
  let statusCode = 500
  if (err instanceof FeatureError) {
    statusCode = err.statusCode
  } else if (typeof (err as any).statusCode === 'number') {
    statusCode = (err as any).statusCode
  }

  const message = err.message || 'Internal server error'

  // Create error response object
  const errorResponse: ErrorResponse = {
    error: {
      message,
      statusCode,
    },
  }

  // Add step information if FeatureError
  if (err instanceof FeatureError && err.step) {
    errorResponse.error.step = {
      number: err.step.number,
      name: err.step.name,
    }
  }

  // Include stack trace in development mode
  if (includeStack) {
    // Prefer original error stack for accurate location
    if (err instanceof FeatureError && err.originalError?.stack) {
      errorResponse.error.stack = err.originalError.stack
    } else if (err.stack) {
      errorResponse.error.stack = err.stack
    }
  }

  // Error logging
  console.error(`[${statusCode}] ${message}`)
  if (includeStack && err.stack) {
    console.error(err.stack)
  }

  // Send JSON response
  res.statusCode = statusCode
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(errorResponse))
}

/**
 * Default error handler
 *
 * Used when no Express-style error middleware is registered.
 * Use Express-style error middleware for custom error handling:
 *
 * @example
 * ```javascript
 * app.use((err, req, res, next) => {
 *   const statusCode = err.statusCode || 500
 *   res.status(statusCode).json({ error: err.message })
 * })
 * ```
 */
export function defaultErrorHandler(
  err: Error,
  req: IncomingMessage,
  res: ServerResponse
): void {
  // Check development mode (NODE_ENV)
  const isDevelopment = process.env.NODE_ENV !== 'production'

  // Send error response
  sendErrorResponse(err, req, res, isDevelopment)
}
