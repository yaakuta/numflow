/**
 * Error Handler
 *
 * Unified error handling
 * Handles errors from both regular routes and Features
 */

import { IncomingMessage, ServerResponse } from 'http'
import { isHttpError, isOperationalError, FeatureExecutionError } from './index.js'
import { hasCode, hasValidationErrors } from '../utils/type-guards.js'

/**
 * Error handler function type
 */
export type ErrorHandler = (
  err: Error,
  req: IncomingMessage,
  res: ServerResponse
) => void | Promise<void>

/**
 * Error response interface
 */
export interface ErrorResponse {
  error: {
    message: string
    statusCode: number
    code?: string
    stack?: string
    validationErrors?: Record<string, string[]>
    step?: {
      number: number
      name: string
    }
    suggestion?: string
    docUrl?: string
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

  // Extract status code if HttpError
  const statusCode = isHttpError(err) ? err.statusCode : 500
  const message = err.message || 'Internal server error'

  // Create error response object
  const errorResponse: ErrorResponse = {
    error: {
      message,
      statusCode,
    },
  }

  // HttpError additional information
  if (isHttpError(err)) {
    // BusinessError code property
    if (hasCode(err)) {
      errorResponse.error.code = err.code
    }
    // ValidationError validationErrors property
    if (hasValidationErrors(err)) {
      errorResponse.error.validationErrors = err.validationErrors
    }
    // Add suggestion and docUrl
    if (err.suggestion) {
      errorResponse.error.suggestion = err.suggestion
    }
    if (err.docUrl) {
      errorResponse.error.docUrl = err.docUrl
    }
  }

  // FeatureExecutionError additional information
  if (err instanceof FeatureExecutionError) {
    if (err.step) {
      errorResponse.error.step = err.step
    }
  }

  // Include stack trace in development mode
  if (includeStack && err.stack) {
    errorResponse.error.stack = err.stack
  }

  // Error logging (Operational errors as info, others as error)
  if (isOperationalError(err)) {
    console.info(`[${statusCode}] ${message}`)
  } else {
    console.error(`[${statusCode}] ${message}`)
    if (err.stack) {
      console.error(err.stack)
    }
  }

  // Send JSON response
  res.statusCode = statusCode
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(errorResponse))
}

/**
 * Default error handler
 *
 * Used when app.onError() is not registered
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

/**
 * Error handler wrapper
 *
 * Wraps custom error handler with exception handling
 */
export function wrapErrorHandler(handler: ErrorHandler): ErrorHandler {
  return async (err: Error, req: IncomingMessage, res: ServerResponse) => {
    try {
      await handler(err, req, res)

      // Send default response if handler didn't send response
      if (!res.headersSent) {
        sendErrorResponse(err, req, res, process.env.NODE_ENV !== 'production')
      }
    } catch (handlerError) {
      // Send default error response if error occurs in error handler
      console.error('Error in error handler:', handlerError)

      if (!res.headersSent) {
        res.statusCode = 500
        res.setHeader('Content-Type', 'application/json')
        res.end(
          JSON.stringify({
            error: {
              message: 'Internal server error',
              statusCode: 500,
            },
          })
        )
      }
    }
  }
}
