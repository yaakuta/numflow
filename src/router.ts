/**
 * Router class
 * High-performance router based on Radix Tree
 * 100% compatible with Express Router
 */

import FindMyWay, { HTTPMethod } from 'find-my-way'
import { RouteHandler, RouteOptions, Request, Response, RequestHandler, ParamCallback } from './types/index.js'
import { asyncWrapper } from './utils/async-wrapper.js'
import { asInternalRequest } from './utils/type-casting.js'
import { parseQuery } from './utils/url-parser.js'

/**
 * Route information interface
 */
export interface RouteInfo {
  method: string
  path: string
  handlers: RouteHandler[]
}

/**
 * Router class
 * Registers and manages routes
 *
 * Express Router compatible features:
 * - router.use() middleware support
 * - Nested router support
 * - Router mounting support
 */
export class Router {
  private router: FindMyWay.Instance<FindMyWay.HTTPVersion.V1>
  private routes: RouteInfo[] = []
  private middlewares: RequestHandler[] = []
  private nestedRouters: Array<{ path: string; router: Router }> = []

  /**
   * Parameter middleware callbacks
   * Stores callbacks to be invoked when route parameters are matched
   */
  public paramCallbacks: Map<string, ParamCallback[]> = new Map()

  constructor(options: RouteOptions = {}) {
    this.router = FindMyWay({
      defaultRoute: this.notFoundHandler.bind(this),
      ignoreTrailingSlash: options.ignoreTrailingSlash ?? true,
      caseSensitive: options.caseSensitive ?? false,
    })
  }

  /**
   * Register router-level middleware or nested router
   *
   * @param pathOrHandler - Path (optional) or handler/router
   * @param handlers - Handlers or router
   * @returns Router instance
   *
   * @example
   * // Router-level middleware
   * router.use(authMiddleware)
   * router.use(logger, auth)
   *
   * @example
   * // Path-specific middleware
   * router.use('/admin', adminAuth)
   *
   * @example
   * // Nested router
   * const nestedRouter = numflow.Router()
   * router.use('/nested', nestedRouter)
   */
  use(pathOrHandler: string | RequestHandler | Router, ...handlers: (RequestHandler | Router)[]): this {
    // If first argument is string, it's a path
    if (typeof pathOrHandler === 'string') {
      const path = pathOrHandler

      // If second argument is Router instance, it's a nested router
      if (handlers.length === 1 && handlers[0] instanceof Router) {
        this.nestedRouters.push({ path, router: handlers[0] as Router })
      } else {
        // Path-specific middleware (currently handled as global middleware)
        this.middlewares.push(...(handlers as RequestHandler[]))
      }
    } else if (pathOrHandler instanceof Router) {
      // When Router instance is passed directly
      this.nestedRouters.push({ path: '/', router: pathOrHandler })
    } else {
      // Global middleware
      this.middlewares.push(pathOrHandler as RequestHandler, ...(handlers as RequestHandler[]))
    }

    return this
  }

  /**
   * Return registered route information
   */
  getRoutes(): RouteInfo[] {
    return [...this.routes]
  }

  /**
   * Return registered middlewares
   */
  getMiddlewares(): RequestHandler[] {
    return [...this.middlewares]
  }

  /**
   * Return nested routers
   */
  getNestedRouters(): Array<{ path: string; router: Router }> {
    return [...this.nestedRouters]
  }

  /**
   * Register parameter middleware
   * Callback is invoked when a route parameter is matched
   *
   * @param name - Parameter name
   * @param callback - Callback function (req, res, next, value)
   * @returns Router instance (for chaining)
   *
   * @example
   * router.param('id', (req, res, next, value) => {
   *   // Validate or process parameter value
   *   req.id = value
   *   next()
   * })
   */
  param(name: string, callback: ParamCallback): this {
    // Get existing callbacks or create new array
    const callbacks = this.paramCallbacks.get(name) || []
    callbacks.push(callback)
    this.paramCallbacks.set(name, callbacks)

    return this
  }

  /**
   * Check for duplicate routes
   *
   * @private
   * @param method - HTTP method
   * @param path - Route path
   * @throws {Error} If duplicate route exists
   */
  private checkDuplicateRoute(method: string, path: string): void {
    const existing = this.routes.find(r => r.method === method && r.path === path)
    if (existing) {
      throw new Error(`Duplicate route registration: ${method} ${path}`)
    }
  }

  /**
   * Register GET route
   *
   * @param path - Route path
   * @param handlers - Middleware + handler (last one is the handler)
   *
   * @example
   * app.get('/users', handler)
   * app.get('/users', auth, handler)
   * app.get('/users', auth, validate, handler)
   */
  get(path: string, ...handlers: RouteHandler[]): this {
    this.checkDuplicateRoute('GET', path)
    this.routes.push({ method: 'GET', path, handlers })
    this.router.on('GET', path, this.wrapHandlers(handlers))
    return this
  }

  /**
   * Register POST route
   */
  post(path: string, ...handlers: RouteHandler[]): this {
    this.checkDuplicateRoute('POST', path)
    this.routes.push({ method: 'POST', path, handlers })
    this.router.on('POST', path, this.wrapHandlers(handlers))
    return this
  }

  /**
   * Register PUT route
   */
  put(path: string, ...handlers: RouteHandler[]): this {
    this.checkDuplicateRoute('PUT', path)
    this.routes.push({ method: 'PUT', path, handlers })
    this.router.on('PUT', path, this.wrapHandlers(handlers))
    return this
  }

  /**
   * Register DELETE route
   */
  delete(path: string, ...handlers: RouteHandler[]): this {
    this.checkDuplicateRoute('DELETE', path)
    this.routes.push({ method: 'DELETE', path, handlers })
    this.router.on('DELETE', path, this.wrapHandlers(handlers))
    return this
  }

  /**
   * Register PATCH route
   */
  patch(path: string, ...handlers: RouteHandler[]): this {
    this.checkDuplicateRoute('PATCH', path)
    this.routes.push({ method: 'PATCH', path, handlers })
    this.router.on('PATCH', path, this.wrapHandlers(handlers))
    return this
  }

  /**
   * Register OPTIONS route
   */
  options(path: string, ...handlers: RouteHandler[]): this {
    this.checkDuplicateRoute('OPTIONS', path)
    this.routes.push({ method: 'OPTIONS', path, handlers })
    this.router.on('OPTIONS', path, this.wrapHandlers(handlers))
    return this
  }

  /**
   * Register HEAD route
   */
  head(path: string, ...handlers: RouteHandler[]): this {
    this.checkDuplicateRoute('HEAD', path)
    this.routes.push({ method: 'HEAD', path, handlers })
    this.router.on('HEAD', path, this.wrapHandlers(handlers))
    return this
  }

  /**
   * Register route for all HTTP methods
   */
  all(path: string, ...handlers: RouteHandler[]): this {
    const methods: HTTPMethod[] = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD']
    const wrappedHandler = this.wrapHandlers(handlers)

    // Check for duplicates and add to routes for each method
    methods.forEach(method => {
      this.checkDuplicateRoute(method, path)
      this.routes.push({ method, path, handlers })
      this.router.on(method, path, wrappedHandler)
    })

    return this
  }

  /**
   * Return Route object for route chaining
   */
  route(path: string): RouteChain {
    return new RouteChain(this, path)
  }

  /**
   * Route request
   */
  async lookup(req: Request, res: Response): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      // Call find-my-way's lookup
      // Handler executes and stores Promise in InternalRequest.__handlerPromise if it returns one
      this.router.lookup(req, res, undefined)

      // Check if handler returned a Promise
      const internalReq = asInternalRequest(req)
      const handlerPromise = internalReq.__handlerPromise
      if (handlerPromise && typeof handlerPromise.then === 'function') {
        // Handle Promise
        handlerPromise.then(resolve).catch(reject)
      } else {
        // Synchronous handler
        resolve()
      }
    })
  }

  /**
   * Wrap multiple handlers (middleware + handler)
   *
   * Automatically catches errors with AsyncWrapper
   *
   * @param handlers - Array of middlewares and final handler
   * @returns find-my-way handler
   */
  private wrapHandlers(handlers: RouteHandler[]): FindMyWay.Handler<FindMyWay.HTTPVersion.V1> {
    if (handlers.length === 0) {
      throw new Error('At least one handler is required')
    }

    // Wrap each handler with asyncWrapper
    const wrappedHandlers = handlers.map(handler => asyncWrapper(handler))

    return (req, res, params) => {
      // Add params and query to InternalRequest
      const internalReq = asInternalRequest(req)
      internalReq.params = (params as Record<string, string>) || {}

      // Parse query parameters (using cached parser, 20-30% performance improvement)
      internalReq.query = parseQuery(req.url || '/')

      // Collect param callbacks to execute
      const paramHandlers: RouteHandler[] = []
      if (params) {
        for (const [paramName, paramValue] of Object.entries(params as Record<string, string>)) {
          const callbacks = this.paramCallbacks.get(paramName)
          if (callbacks) {
            // Wrap each param callback to pass the value and name
            for (const callback of callbacks) {
              paramHandlers.push((req: Request, res: Response, next: any) => {
                return callback(req, res, next, paramValue, paramName)
              })
            }
          }
        }
      }

      // Combine param handlers with route handlers
      const allHandlers = [
        ...paramHandlers.map(h => asyncWrapper(h)),
        ...wrappedHandlers,
      ]

      let index = 0

      const executeHandlers = new Promise<void>((resolve, reject) => {
        const next = (error?: any) => {
          // Reject on error
          if (error) {
            reject(error)
            return
          }

          // All handlers executed
          if (index >= allHandlers.length) {
            resolve()
            return
          }

          // Execute next handler (asyncWrapper automatically catches errors)
          const handler = allHandlers[index++]
          handler(req as any, res as Response, next)
        }

        // Execute first handler
        next()
      })

      // Store Promise in InternalRequest (handled in Router.lookup)
      internalReq.__handlerPromise = executeHandlers
    }
  }

  /**
   * 404 Not Found handler
   */
  private notFoundHandler(req: Request, res: Response): void {
    res.statusCode = 404
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({
      success: false,
      error: 'Not Found',
      message: `Cannot ${req.method} ${req.url}`,
    }))
  }
}

/**
 * Route chaining class
 */
export class RouteChain {
  constructor(private readonly router: Router, private readonly path: string) {}

  get(...handlers: RouteHandler[]): this {
    this.router.get(this.path, ...handlers)
    return this
  }

  post(...handlers: RouteHandler[]): this {
    this.router.post(this.path, ...handlers)
    return this
  }

  put(...handlers: RouteHandler[]): this {
    this.router.put(this.path, ...handlers)
    return this
  }

  delete(...handlers: RouteHandler[]): this {
    this.router.delete(this.path, ...handlers)
    return this
  }

  patch(...handlers: RouteHandler[]): this {
    this.router.patch(this.path, ...handlers)
    return this
  }

  all(...handlers: RouteHandler[]): this {
    this.router.all(this.path, ...handlers)
    return this
  }
}
