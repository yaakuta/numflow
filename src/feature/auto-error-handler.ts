/**
 * Auto-Error Handler
 *
 * Automatically handles errors that occur during Feature execution.
 *
 * Key features:
 * 1. Error catching: Catches all errors that occur during Step execution
 * 2. HTTP response: Converts errors to appropriate HTTP responses
 * 3. Error logging: Logs error information with step details
 */

import { ServerResponse } from 'http'
import { FeatureError } from './types.js'

/**
 * Auto-Error Handler class
 */
export class AutoErrorHandler {
  /**
   * Handle error and send HTTP response
   *
   * @param error - Error that occurred
   * @param res - HTTP Response object
   */
  static handle(error: Error, res: ServerResponse): void {
    // 1. Log error
    this.logError(error)

    // 2. Send HTTP response
    this.sendErrorResponse(error, res)
  }

  /**
   * Send HTTP error response
   *
   * @param error - Error that occurred
   * @param res - HTTP Response object
   */
  private static sendErrorResponse(error: Error, res: ServerResponse): void {
    let statusCode = 500
    let errorMessage = error.message || 'An unexpected error occurred'
    let step: { number: number; name: string } | undefined = undefined

    // Extract statusCode from error: FeatureError > error.statusCode > 500
    if (error instanceof FeatureError) {
      statusCode = error.statusCode
      if (error.step) {
        step = {
          number: error.step.number,
          name: error.step.name,
        }
      }
    } else if (typeof (error as any).statusCode === 'number') {
      statusCode = (error as any).statusCode
    }

    // Build response
    const response: any = {
      error: {
        message: errorMessage,
        statusCode,
      },
    }

    // Add step info if available
    if (step) {
      response.error.step = step
    }

    // Include stack trace only in development environment
    if (process.env.NODE_ENV === 'development') {
      // Prefer original error stack for accurate location
      if (error instanceof FeatureError && error.originalError?.stack) {
        response.error.stack = error.originalError.stack
      } else if (error.stack) {
        response.error.stack = error.stack
      }
    }

    // Send JSON response
    res.statusCode = statusCode
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify(response))
  }

  /**
   * Log error
   *
   * @param error - Error that occurred
   */
  private static logError(error: Error): void {
    if (process.env.DISABLE_FEATURE_LOGS === 'true' || process.env.NODE_ENV === 'test') {
      return
    }
    console.error('[AutoErrorHandler] Error occurred:')
    console.error(`  Name: ${error.name}`)
    console.error(`  Message: ${error.message}`)

    if (error instanceof FeatureError && error.step) {
      console.error(`  Step: ${error.step.number} (${error.step.name})`)
    }

    // Show original error stack for accurate location
    if (error instanceof FeatureError && error.originalError?.stack) {
      console.error(`  Original Stack: ${error.originalError.stack}`)
    } else if (error.stack) {
      console.error(`  Stack: ${error.stack}`)
    }
  }
}
