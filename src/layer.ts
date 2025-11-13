/**
 * Layer class
 * Class that wraps middleware and route handlers
 *
 * Implemented based on Express's Layer pattern
 */

import { Request, Response, NextFunction, RequestHandler, ErrorHandler } from './types/index.js'

/**
 * Layer class
 *
 * Wraps middleware or route handlers and manages execution order.
 */
export class Layer {
  /**
   * Middleware/handler function
   */
  private handler: RequestHandler | ErrorHandler

  /**
   * Path (for path-specific middleware)
   */
  private path: string | undefined

  /**
   * Path + '/' (for prefix matching, pre-calculated)
   * Prevents string concatenation on every request
   */
  private pathWithSlash: string | undefined

  /**
   * Whether it is an error middleware
   */
  private isErrorHandler: boolean

  /**
   * Layer constructor
   *
   * @param handler - Middleware or route handler
   * @param path - Path (optional, for path-specific middleware)
   */
  constructor(handler: RequestHandler | ErrorHandler, path?: string) {
    this.handler = handler
    this.path = path
    // Pre-calculate pathWithSlash to improve matching performance
    this.pathWithSlash = path ? path + '/' : undefined
    // Error middleware has 4 parameters
    this.isErrorHandler = handler.length === 4
  }

  /**
   * Check path matching
   * Performance optimization - pre-calculate pathWithSlash, eliminate duplicate checks
   *
   * @param requestPath - Request path
   * @returns Whether it matches
   */
  match(requestPath: string): boolean {
    // Global middleware (no path)
    if (!this.path) {
      return true
    }

    // Exact path matching (fastest case)
    if (this.path === requestPath) {
      return true
    }

    // Path prefix matching (/api matches both /api/ and /api/users)
    // Use pre-calculated pathWithSlash instead of this.path + '/'
    if (this.pathWithSlash && requestPath.startsWith(this.pathWithSlash)) {
      return true
    }

    return false
  }

  /**
   * Execute handler
   *
   * @param req - Request object
   * @param res - Response object
   * @param next - next function
   * @param err - Error (for error middleware)
   */
  async handle(req: Request, res: Response, next: NextFunction, err?: any): Promise<void> {
    try {
      // Remove mount path from req.url if present
      const originalUrl = req.url
      const originalPath = req.path

      if (this.path && req.url) {
        // Remove mount path from req.url
        if (req.url.startsWith(this.path)) {
          req.url = req.url.substring(this.path.length) || '/'
          // Update req.path as well (remove query string)
          const queryIndex = req.url.indexOf('?')
          req.path = queryIndex === -1 ? req.url : req.url.substring(0, queryIndex)
        }
      }

      // Wrapper next function to restore original URL
      const wrappedNext: NextFunction = (error?: any) => {
        // Restore original URL and path
        req.url = originalUrl
        req.path = originalPath
        next(error)
      }

      // Error middleware
      if (this.isErrorHandler) {
        if (err) {
          // Execute error middleware only when error exists
          await (this.handler as ErrorHandler)(err, req, res, wrappedNext)
        } else {
          // Skip if no error
          wrappedNext()
        }
      }
      // Regular middleware/handler
      else {
        if (err) {
          // Skip regular middleware if error exists
          wrappedNext(err)
        } else {
          // Normal execution
          await (this.handler as RequestHandler)(req, res, wrappedNext)
        }
      }
    } catch (error) {
      // Pass error to next(error) if error occurs during middleware execution
      next(error)
    }
  }

  /**
   * Return whether it is an error handler
   */
  get isError(): boolean {
    return this.isErrorHandler
  }

  /**
   * Return path
   */
  getPath(): string | undefined {
    return this.path
  }

  /**
   * Return handler
   * Needed for mounting sub-applications
   */
  getHandler(): RequestHandler | ErrorHandler {
    return this.handler
  }
}
