import { createServer, IncomingMessage, ServerResponse } from 'http'
import { EventEmitter } from 'events'
import { Server, ListenCallback, ApplicationSettings, RouteHandler, RequestHandler, ErrorHandler, Request, Response, NextFunction, ParamCallback } from './types/index.js'
import { Feature, FeatureConfig } from './feature/index.js'
import { Router } from './router.js'
import { extendRequest } from './request-extensions.js'
import { extendResponse } from './response-extensions.js'
import { autoBodyParser, BodyParserOptions } from './body-parser.js'
import { Layer } from './layer.js'
import { defaultErrorHandler, wrapErrorHandler, ErrorHandler as GlobalErrorHandler } from './errors/error-handler.js'
import { asInternalRouter, asInternalResponse } from './utils/type-casting.js'

/**
 * Numflow Application class
 * Core class of high-performance web framework with Express compatibility
 * Extends EventEmitter for mount event support
 */
export class Application extends EventEmitter {
  private server: Server | null = null
  private settings: ApplicationSettings = {}
  private features: Map<string, Feature> = new Map()
  private _router: Router
  private bodyParserEnabled = true
  private bodyParserOptions: BodyParserOptions = { limit: '1mb' }
  private middlewares: Layer[] = []
  private errorHandler: GlobalErrorHandler = defaultErrorHandler
  private featureRegistrationPromises: Promise<this>[] = []

  /**
   * Template engines storage
   * Stores custom template engine render functions
   */
  private engines: Map<string, Function> = new Map()

  /**
   * Mount path
   * The path where this app is mounted (when used as a sub-app)
   */
  private mountPath: string = ''

  /**
   * Parameter middleware callbacks
   * Stores callbacks to be invoked when route parameters are matched
   */
  public paramCallbacks: Map<string, ParamCallback[]> = new Map()

  /**
   * Mount path pattern(s)
   * The path pattern(s) where this app was mounted (string or array)
   * Differs from mountPath which is the accumulated path string
   */
  public mountpath: string | string[] = ''

  /**
   * Global variables for all templates (Express compatibility)
   * These variables are accessible in all rendered templates
   */
  public locals: Record<string, any> = {}

  /**
   * Get internal router reference (Express compatibility)
   * Provides access to the underlying router instance
   */
  public get router(): Router {
    return this._router
  }

  constructor() {
    super() // Initialize EventEmitter
    this._router = new Router()
  }

  /**
   * Disable automatic body parsing
   * By default, body parsing is enabled
   */
  disableBodyParser(): this {
    this.bodyParserEnabled = false
    return this
  }

  /**
   * Configure body parser options
   */
  configureBodyParser(options: BodyParserOptions): this {
    this.bodyParserOptions = options
    return this
  }

  /**
   * Create HTTP server and start listening on the specified port
   *
   * If registerFeatures() was called, automatically waits for feature registration to complete before starting the server.
   *
   * @param port - Port number to listen on
   * @param callback - Callback function to execute after server starts
   * @returns HTTP Server instance
   *
   * @example
   * // JavaScript (CommonJS)
   * const numflow = require('numflow')
   * const app = numflow()
   * app.listen(3000, () => {
   *   console.log('Server running on port 3000')
   * })
   *
   * @example
   * // Use with feature registration (auto-wait!)
   * const numflow = require('numflow')
   * const app = numflow()
   * app.registerFeatures('./features')
   * app.listen(3000, () => {
   *   console.log('Server running on port 3000')
   * })
   *
   * @example
   * // JavaScript (ESM)
   * import numflow from 'numflow'
   * const app = numflow()
   * app.listen(3000, () => {
   *   console.log('Server running on port 3000')
   * })
   *
   * @example
   * // TypeScript
   * import numflow from 'numflow'
   * const app = numflow()
   * app.listen(3000, (): void => {
   *   console.log('Server running on port 3000')
   * })
   */
  listen(port: number, callback?: ListenCallback): Server {
    // Create HTTP server first
    if (!this.server) {
      this.server = createServer(this.handleRequest.bind(this))
    }

    // Wait for feature registration before starting server
    if (this.featureRegistrationPromises.length > 0) {
      Promise.all(this.featureRegistrationPromises)
        .then(() => {
          // Start listening after all features are registered
          this.server!.listen(port, () => {
            if (callback) {
              callback()
            }
          })
        })
        .catch((error) => {
          console.error('Failed to register features:', error)

          // Test environment: emit error event (allows error handling in tests)
          if (process.env.NODE_ENV === 'test') {
            if (this.server) {
              this.server.emit('error', error)
            }
          } else {
            // Production/development: fail fast (exit immediately)
            process.exit(1)
          }
        })
    } else {
      // Start listening immediately if no features registered
      this.server.listen(port, () => {
        if (callback) {
          callback()
        }
      })
    }

    return this.server
  }

  /**
   * Set application setting
   *
   * @param key - Setting key
   * @param value - Setting value
   * @returns Application instance (for chaining)
   */
  set(key: string, value: any): this {
    this.settings[key] = value
    return this
  }

  /**
   * Disable a setting (set to false)
   *
   * @param key - Setting key
   * @returns Application instance (for chaining)
   *
   * @example
   * // JavaScript
   * app.disable('trust proxy')
   * app.disable('x-powered-by')
   */
  disable(key: string): this {
    this.settings[key] = false
    return this
  }

  /**
   * Enable a setting (set to true)
   *
   * @param key - Setting key
   * @returns Application instance (for chaining)
   *
   * @example
   * // JavaScript
   * app.enable('trust proxy')
   * app.enable('case sensitive routing')
   */
  enable(key: string): this {
    this.settings[key] = true
    return this
  }

  /**
   * Check if a setting is disabled
   *
   * @param key - Setting key
   * @returns true if setting is false, otherwise false
   *
   * @example
   * // JavaScript
   * if (app.disabled('trust proxy')) {
   *   console.log('Trust proxy is disabled')
   * }
   */
  disabled(key: string): boolean {
    return this.settings[key] === false
  }

  /**
   * Check if a setting is enabled
   *
   * @param key - Setting key
   * @returns true if setting is true, otherwise false
   *
   * @example
   * // JavaScript
   * if (app.enabled('trust proxy')) {
   *   console.log('Trust proxy is enabled')
   * }
   */
  enabled(key: string): boolean {
    return this.settings[key] === true
  }

  /**
   * Get application setting or register GET route
   *
   * @param keyOrPath - Setting key or route path
   * @param handlers - Route handlers (middleware + handler)
   * @returns Setting value or Application instance
   *
   * @example
   * // Get setting
   * const port = app.get('port')
   *
   * @example
   * // Register GET route
   * app.get('/users', (req, res) => {
   *   res.end('Users list')
   * })
   *
   * @example
   * // GET route + middleware
   * app.get('/users', auth, (req, res) => {
   *   res.end('Users list')
   * })
   */
  get(keyOrPath: string, ...handlers: RouteHandler[]): any {
    // Register route if handlers provided
    if (handlers.length > 0) {
      this._router.get(keyOrPath, ...handlers)
      return this
    }

    // Get setting if no handlers
    return this.settings[keyOrPath]
  }

  /**
   * Register POST route
   *
   * @param path - Route path
   * @param handlers - Route handlers (middleware + handler)
   * @returns Application instance (for chaining)
   *
   * @example
   * app.post('/users', (req, res) => {
   *   res.end('User created')
   * })
   *
   * @example
   * app.post('/users', auth, validate, (req, res) => {
   *   res.end('User created')
   * })
   */
  post(path: string, ...handlers: RouteHandler[]): this {
    this._router.post(path, ...handlers)
    return this
  }

  /**
   * Register PUT route
   *
   * @param path - Route path
   * @param handlers - Route handlers (middleware + handler)
   * @returns Application instance (for chaining)
   *
   * @example
   * app.put('/users/:id', (req, res) => {
   *   res.end('User updated')
   * })
   */
  put(path: string, ...handlers: RouteHandler[]): this {
    this._router.put(path, ...handlers)
    return this
  }

  /**
   * Register DELETE route
   *
   * @param path - Route path
   * @param handlers - Route handlers (middleware + handler)
   * @returns Application instance (for chaining)
   *
   * @example
   * app.delete('/users/:id', (req, res) => {
   *   res.end('User deleted')
   * })
   */
  delete(path: string, ...handlers: RouteHandler[]): this {
    this._router.delete(path, ...handlers)
    return this
  }

  /**
   * Register PATCH route
   *
   * @param path - Route path
   * @param handlers - Route handlers (middleware + handler)
   * @returns Application instance (for chaining)
   *
   * @example
   * app.patch('/users/:id', (req, res) => {
   *   res.end('User patched')
   * })
   */
  patch(path: string, ...handlers: RouteHandler[]): this {
    this._router.patch(path, ...handlers)
    return this
  }

  /**
   * Register OPTIONS route
   *
   * @param path - Route path
   * @param handlers - Route handlers (middleware + handler)
   * @returns Application instance (for chaining)
   *
   * @example
   * app.options('/users', (req, res) => {
   *   res.end('Options')
   * })
   */
  options(path: string, ...handlers: RouteHandler[]): this {
    this._router.options(path, ...handlers)
    return this
  }

  /**
   * Register HEAD route
   *
   * @param path - Route path
   * @param handlers - Route handlers (middleware + handler)
   * @returns Application instance (for chaining)
   *
   * @example
   * app.head('/users', (req, res) => {
   *   res.end()
   * })
   */
  head(path: string, ...handlers: RouteHandler[]): this {
    this._router.head(path, ...handlers)
    return this
  }

  /**
   * Register route for all HTTP methods
   *
   * @param path - Route path
   * @param handlers - Route handlers (middleware + handler)
   * @returns Application instance (for chaining)
   *
   * @example
   * app.all('/users', (req, res) => {
   *   res.end('All methods')
   * })
   */
  all(path: string, ...handlers: RouteHandler[]): this {
    this._router.all(path, ...handlers)
    return this
  }

  /**
   * Create route chain for path
   *
   * @param path - Route path
   * @returns RouteChain instance
   *
   * @example
   * app.route('/users')
   *   .get((req, res) => res.end('Get users'))
   *   .post((req, res) => res.end('Create user'))
   */
  route(path: string) {
    return this._router.route(path)
  }

  /**
   * Register parameter middleware
   * Callback is invoked when a route parameter is matched
   *
   * @param name - Parameter name
   * @param callback - Callback function (req, res, next, value, name)
   * @returns Application instance (for chaining)
   *
   * @example
   * app.param('userId', (req, res, next, value) => {
   *   // Load user and attach to request
   *   User.findById(value, (err, user) => {
   *     if (err) return next(err)
   *     if (!user) return next(new Error('User not found'))
   *     req.user = user
   *     next()
   *   })
   * })
   */
  param(name: string, callback: ParamCallback): this {
    // Get existing callbacks or create new array
    const callbacks = this.paramCallbacks.get(name) || []
    callbacks.push(callback)
    this.paramCallbacks.set(name, callbacks)

    // Also register on router for nested routers
    this._router.param(name, callback)

    return this
  }

  /**
   * Register middleware or mount Router
   *
   * Express-compatible middleware system + Router mounting
   *
   * @param args - Path (optional) + middleware functions or Router instance
   * @returns Application instance (for chaining)
   *
   * @example
   * // Global middleware
   * app.use((req, res, next) => {
   *   console.log('Request:', req.method, req.url)
   *   next()
   * })
   *
   * @example
   * // Path-specific middleware
   * app.use('/api', (req, res, next) => {
   *   console.log('API request')
   *   next()
   * })
   *
   * @example
   * // Multiple middleware
   * app.use(middleware1, middleware2, middleware3)
   *
   * @example
   * // Path + multiple middleware
   * app.use('/api', auth, rateLimit, logger)
   *
   * @example
   * // Mount Router
   * const apiRouter = numflow.Router()
   * apiRouter.get('/users', handler)
   * app.use('/api', apiRouter)
   */
  use(...args: any[]): this {
    let paths: string | string[] | undefined
    let handlers: (RequestHandler | ErrorHandler | Router | Feature)[]

    // Treat first argument as path if it's a string or array
    if (typeof args[0] === 'string' || Array.isArray(args[0])) {
      paths = args[0]
      handlers = args.slice(1) as (RequestHandler | ErrorHandler | Router | Feature)[]
    } else {
      paths = undefined
      handlers = args as (RequestHandler | ErrorHandler | Router | Feature)[]
    }

    // Normalize paths to array for consistent processing
    const pathArray = paths === undefined ? ['/'] : Array.isArray(paths) ? paths : [paths]

    // Process each handler
    for (const handler of handlers) {
      // If Feature instance, call registerFeature()
      if (handler instanceof Feature) {
        this.registerFeature(handler)
      }
      // If Application instance (sub-app), mount it
      else if (handler instanceof Application) {
        // Mount on each path
        for (const path of pathArray) {
          this.mountApplication(path, handler, paths) // Pass original paths for mountpath
        }
      }
      // If Router instance, mount it
      else if (handler instanceof Router) {
        for (const path of pathArray) {
          this.mountRouter(path, handler)
        }
      } else {
        // Regular middleware: wrap in Layer and add to stack
        for (const path of pathArray) {
          const layer = new Layer(handler, paths === undefined ? undefined : path)
          this.middlewares.push(layer)
        }
      }
    }

    return this
  }

  /**
   * Mount Router
   *
   * @private
   * @param basePath - Base path to mount on
   * @param router - Router instance
   */
  private mountRouter(basePath: string, router: Router): void {
    // Normalize path (remove trailing slash)
    const normalizedBase = basePath.replace(/\/$/, '') || ''

    // Get all routes from Router and mount them
    const routes = router.getRoutes()
    for (const route of routes) {
      const fullPath = normalizedBase + route.path
      const method = route.method.toLowerCase() as 'get' | 'post' | 'put' | 'delete' | 'patch' | 'options' | 'head'

      // Register on Application's router
      if (method in this._router) {
        const internalRouter = asInternalRouter(this._router)
        internalRouter[method](fullPath, ...route.handlers)
      }
    }

    // Register Router's middleware by path
    const routerMiddlewares = router.getMiddlewares()
    for (const middleware of routerMiddlewares) {
      const layer = new Layer(middleware, normalizedBase || undefined)
      this.middlewares.push(layer)
    }

    // Copy param callbacks from router
    // When a router is mounted, its param callbacks should be available to the app
    for (const [paramName, callbacks] of router.paramCallbacks.entries()) {
      for (const callback of callbacks) {
        // Register on both app and app's router
        this.param(paramName, callback)
      }
    }

    // Handle nested routers
    const nestedRouters = router.getNestedRouters()
    for (const nested of nestedRouters) {
      const nestedPath = normalizedBase + (nested.path === '/' ? '' : nested.path)
      this.mountRouter(nestedPath, nested.router)
    }
  }

  /**
   * Store nested applications
   * Track sub-apps for recursive mount path updates
   */
  private nestedApps: Array<{ basePath: string; app: Application }> = []

  /**
   * Mount Application as sub-app
   *
   * @private
   * @param basePath - Base path to mount on
   * @param subApp - Application instance (sub-app)
   * @param originalPaths - Original path(s) for mountpath property
   */
  private mountApplication(basePath: string, subApp: Application, originalPaths?: string | string[]): void {
    // Normalize path (remove trailing slash)
    const normalizedBase = basePath.replace(/\/$/, '') || ''

    // Set mountpath property
    // Only set on first mount (ignore duplicate mounts from multiple paths)
    if (subApp.mountpath === '') {
      subApp.mountpath = originalPaths !== undefined ? originalPaths : basePath
    }

    // Set mount path on sub-app
    // For nested apps: accumulate mount paths from parent
    // If this app has a mountPath, we are already mounted, so propagate it
    const parentPath = this.mountPath || ''
    const fullPath = parentPath + normalizedBase

    // Store reference to nested app for recursive updates
    this.nestedApps.push({ basePath: normalizedBase, app: subApp })

    // Update mount path for subApp and all its nested apps recursively
    this.updateMountPath(subApp, fullPath)

    // Mount the sub-app's router
    this.mountRouter(normalizedBase, subApp.router)

    // Copy param callbacks from sub-app
    for (const [paramName, callbacks] of subApp.paramCallbacks.entries()) {
      for (const callback of callbacks) {
        this.param(paramName, callback)
      }
    }

    // Add sub-app's middleware layers
    const subAppMiddlewares = subApp.middlewares
    for (const layer of subAppMiddlewares) {
      // Prefix the layer's path with the mount path
      const prefixedLayer = new Layer(
        layer.getHandler(),
        normalizedBase + (layer.getPath() || '')
      )
      this.middlewares.push(prefixedLayer)
    }

    // Emit 'mount' event on sub-app (Express compatibility)
    // The sub-app receives the parent app as the event argument
    subApp.emit('mount', this)
  }

  /**
   * Update mount path recursively for app and all nested apps
   * @private
   */
  private updateMountPath(app: Application, newPath: string): void {
    app.mountPath = newPath

    // Update all nested applications recursively
    for (const nested of app.nestedApps) {
      const nestedFullPath = newPath + nested.basePath
      this.updateMountPath(nested.app, nestedFullPath)
    }
  }

  /**
   * Register global error handler
   *
   * Unified error handling
   * Handles all errors from regular routes and Features
   *
   * @param handler - Error handler function
   * @returns Application instance (for chaining)
   *
   * @example
   * // Basic error handling
   * app.onError((err, req, res) => {
   *   console.error(err)
   *   res.status(500).json({ error: err.message })
   * })
   *
   * @example
   * // Handle errors by type
   * app.onError((err, req, res) => {
   *   if (err instanceof ValidationError) {
   *     return res.status(400).json({ error: err.message })
   *   }
   *   if (err instanceof NotFoundError) {
   *     return res.status(404).json({ error: err.message })
   *   }
   *   res.status(500).json({ error: 'Internal Server Error' })
   * })
   */
  onError(handler: GlobalErrorHandler): this {
    this.errorHandler = wrapErrorHandler(handler)
    return this
  }

  /**
   * Call error handler
   *
   * @private
   * @param err - Error object
   * @param req - Request object
   * @param res - Response object
   */
  private handleError(err: Error, req: IncomingMessage, res: ServerResponse): void {
    this.errorHandler(err, req, res)
  }

  /**
   * Execute middleware chain
   *
   * @private
   * @param req - Request object
   * @param res - Response object
   * @param err - Error (for error middleware)
   * @returns Promise<void>
   */
  private async runMiddlewares(req: Request, res: Response, err?: any): Promise<void> {
    let index = 0
    const middlewares = this.middlewares.filter(layer => layer.match(req.url || ''))

    return new Promise<void>((resolve, reject) => {
      const next: NextFunction = (error?: any) => {
        // Stop if response already sent
        if (res.headersSent) {
          resolve()
          return
        }

        // Find error middleware if error occurred
        if (error) {
          // Execute only error middleware
          const errorMiddlewares = middlewares.slice(index).filter(layer => layer.isError)

          if (errorMiddlewares.length === 0) {
            // Reject if no error middleware
            reject(error)
            return
          }

          // Execute first error middleware
          const errorLayer = errorMiddlewares[0]
          const errorIndex = middlewares.indexOf(errorLayer)
          index = errorIndex + 1

          errorLayer.handle(req, res, next, error).catch(reject)
          return
        }

        // All middleware executed
        if (index >= middlewares.length) {
          resolve()
          return
        }

        // Execute next middleware
        const layer = middlewares[index++]

        // Skip error middleware when no error
        if (layer.isError && !err) {
          next()
          return
        }

        // Execute regular middleware
        layer.handle(req, res, next, err).catch((error) => {
          next(error)
        })
      }

      // Execute first middleware
      next(err)
    })
  }

  /**
   * HTTP request handler
   *
   * @private
   * @param req - HTTP request object
   * @param res - HTTP response object
   */
  /**
   * Initialize Request/Response
   * handleRequest refactoring
   */
  private async setupRequest(
    req: IncomingMessage,
    res: ServerResponse
  ): Promise<{ req: Request; res: Response }> {
    // Extend Request and Response
    const extendedReq = extendRequest(req)
    const extendedRes = extendResponse(res)

    // Add Application reference to Request (Express compatibility)
    extendedReq.app = this

    // Add req and app references to InternalResponse (needed for res.jsonp() and res.render())
    const internalRes = asInternalResponse(extendedRes)
    internalRes.req = extendedReq
    internalRes.app = this

    // Add req reference to Response for res.format()
    // Note: ServerResponse.req is readonly, so we need to use type assertion
    ;(extendedRes as any).req = extendedReq

    // Add res reference to Request
    extendedReq.res = extendedRes

    // Parse body if enabled
    if (this.bodyParserEnabled) {
      try {
        // Auto parser selection based on Content-Type (removed 2 try-catch blocks)
        await autoBodyParser(this.bodyParserOptions)(extendedReq)
      } catch (bodyParseError) {
        // Ignore body parsing failure (Express-compatible behavior)
        // If user wants direct error handling, disable bodyParser and
        // use custom body parser middleware
      }
    }

    return { req: extendedReq, res: extendedRes }
  }

  /**
   * Handle pipeline error (middleware or routing error)
   * Removes duplicate code
   */
  private async handlePipelineError(
    error: Error,
    req: Request,
    res: Response,
    originalReq: IncomingMessage,
    originalRes: ServerResponse
  ): Promise<boolean> {
    // Try to run error middlewares
    try {
      await this.runMiddlewares(req, res, error)
    } catch (errorMiddlewareError) {
      // No error middleware handled it, pass to global error handler
      this.handleError(errorMiddlewareError as Error, originalReq, originalRes)
      return true // Error handled, stop pipeline
    }

    // Check if error middleware sent response
    if (res.headersSent) {
      return true // Response sent, stop pipeline
    }

    return false // Continue pipeline
  }

  /**
   * Main request handler
   * Refactored for improved readability
   */
  private async handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
    try {
      // 1. Initialize Request/Response and parse body
      const { req: extendedReq, res: extendedRes } = await this.setupRequest(req, res)

      // 2. Execute middleware
      try {
        await this.runMiddlewares(extendedReq, extendedRes)
      } catch (middlewareError) {
        const handled = await this.handlePipelineError(
          middlewareError as Error,
          extendedReq,
          extendedRes,
          req,
          res
        )
        if (handled) return
      }

      // Stop if middleware sent response
      if (extendedRes.headersSent) {
        return
      }

      // 3. Execute routing
      try {
        await this._router.lookup(extendedReq, extendedRes)
      } catch (routeError) {
        const handled = await this.handlePipelineError(
          routeError as Error,
          extendedReq,
          extendedRes,
          req,
          res
        )
        if (handled) return
      }
    } catch (error) {
      // Unexpected error - Global error handler
      this.handleError(error as Error, req, res)
    }
  }

  /**
   * Close server (for testing)
   *
   * @param callback - Callback to execute after close
   */
  close(callback?: (err?: Error) => void): void {
    if (this.server) {
      this.server.close(callback)
    } else if (callback) {
      callback()
    }
  }

  /**
   * Inject a fake HTTP request/response for testing without starting the server
   *
   * This method uses light-my-request to inject requests directly into the handler,
   * bypassing the need for an actual TCP connection. This makes tests much faster
   * and eliminates port conflicts.
   *
   * @param options - Request options (method, url, payload, headers, etc.)
   * @param callback - Optional callback (if not provided, returns a Promise)
   * @returns Promise<Response> or void (if callback provided)
   *
   * @example
   * // Promise style
   * const res = await app.inject({
   *   method: 'GET',
   *   url: '/'
   * })
   * console.log(res.statusCode) // 200
   * console.log(res.payload)    // response body
   *
   * @example
   * // POST with JSON payload
   * const res = await app.inject({
   *   method: 'POST',
   *   url: '/users',
   *   payload: { name: 'John', age: 30 },
   *   headers: { 'content-type': 'application/json' }
   * })
   *
   * @example
   * // Callback style
   * app.inject({ method: 'GET', url: '/' }, (err, res) => {
   *   console.log(res.statusCode)
   * })
   *
   * @example
   * // With Feature-First (automatically waits for registration)
   * app.registerFeatures('./features')
   * const res = await app.inject({
   *   method: 'POST',
   *   url: '/api/feature'
   * })
   */
  inject(options: string | import('light-my-request').InjectOptions): Promise<import('light-my-request').Response>
  inject(options: string | import('light-my-request').InjectOptions, callback: import('light-my-request').CallbackFunc): void
  inject(
    options: string | import('light-my-request').InjectOptions,
    callback?: import('light-my-request').CallbackFunc
  ): Promise<import('light-my-request').Response> | void {
    // Wait for Feature registration and lazy load light-my-request
    // Using dynamic import() for ESM/CJS compatibility
    const ready = async (): Promise<any> => {
      if (this.featureRegistrationPromises.length > 0) {
        await Promise.all(this.featureRegistrationPromises)
      }

      // Dynamic import for ESM/CJS compatibility
      const lightMyRequestModule = await import('light-my-request')
      // Handle both ESM default export and CJS module.exports
      return lightMyRequestModule.default || lightMyRequestModule
    }

    if (callback) {
      // Callback style
      ready()
        .then((lightMyRequest) => {
          lightMyRequest(this.handleRequest.bind(this), options, callback)
        })
        .catch(err => callback(err, undefined))
    } else {
      // Promise style
      return new Promise((resolve, reject) => {
        ready()
          .then((lightMyRequest) => {
            lightMyRequest(this.handleRequest.bind(this), options, (err: Error | null, res: import('light-my-request').Response) => {
              if (err) reject(err)
              else resolve(res)
            })
          })
          .catch(reject)
      })
    }
  }

  /**
   * Register Feature (INTERNAL USE ONLY)
   *
   * Registers and initializes a Feature.
   * This is an internal method called by:
   * - app.use() when a Feature instance is passed
   * - app.registerFeatures() for bulk registration
   *
   * Users should use `app.registerFeatures()` instead of calling this directly.
   *
   * @private
   * @param featureOrConfig - Feature instance or FeatureConfig object
   * @returns Application instance (for chaining)
   */
  private registerFeature(featureOrConfig: Feature | FeatureConfig): this {
    // Start async registration and add Promise to array
    const promise = this._registerFeatureAsync(featureOrConfig)
    this.featureRegistrationPromises.push(promise)
    return this
  }

  /**
   * Async implementation of Feature registration
   *
   * @private
   * @param featureOrConfig - Feature instance or FeatureConfig object
   * @returns Promise<Application>
   */
  private async _registerFeatureAsync(featureOrConfig: Feature | FeatureConfig): Promise<this> {
    // Error if not Feature instance (Feature must be created with feature() function)
    const feature = featureOrConfig instanceof Feature
      ? featureOrConfig
      : (() => { throw new Error('Use numflow.feature() to create a Feature instance') })()

    const info = feature.getInfo()

    // Error if method and path are missing
    if (!info.method || !info.path) {
      throw new Error('Feature must have method and path (auto-resolved or manually specified)')
    }

    const key = `${info.method}:${info.path}`

    if (this.features.has(key)) {
      throw new Error(`Feature already registered: ${key}`)
    }

    this.features.set(key, feature)

    // Register Feature handler to router
    const handler = feature.getHandler()

    // Call appropriate router method based on HTTP method
    const method = info.method.toUpperCase()
    switch (method) {
      case 'GET':
        this._router.get(info.path, handler)
        break
      case 'POST':
        this._router.post(info.path, handler)
        break
      case 'PUT':
        this._router.put(info.path, handler)
        break
      case 'DELETE':
        this._router.delete(info.path, handler)
        break
      case 'PATCH':
        this._router.patch(info.path, handler)
        break
      case 'OPTIONS':
        this._router.options(info.path, handler)
        break
      case 'HEAD':
        this._router.head(info.path, handler)
        break
      default:
        throw new Error(`Unsupported HTTP method: ${method}`)
    }

    // Initialize (await for completion)
    await feature.initialize()

    return this
  }

  /**
   * Auto-scan and register Features
   *
   * Supports Convention over Configuration by automatically discovering
   * and registering all Features in nested folder structures.
   * When used with app.listen(), automatically waits for registration to complete.
   *
   * @param directory - Features directory path
   * @param options - Scan options
   * @returns Application instance (for chaining)
   *
   * @example
   * ```javascript
   * const numflow = require('numflow')
   * const app = numflow()
   *
   * // Auto-scan Features
   * app.registerFeatures('./features')
   *
   * // app.listen() automatically waits for registration to complete
   * app.listen(3000, () => {
   *   console.log('Server running on port 3000')
   * })
   *
   * // Automatically scans structures like:
   * // features/
   * //   api/
   * //     v1/
   * //       orders/
   * //         post/
   * //           index.js  ← POST /api/v1/orders
   * //         [id]/
   * //           get/
   * //             index.js  ← GET /api/v1/orders/:id
   * //       users/
   * //         get/
   * //           index.js  ← GET /api/v1/users
   * ```
   *
   * @example
   * ```javascript
   * // Scan with options
   * app.registerFeatures('./features', {
   *   indexPatterns: ['index.js', 'feature.js'],
   *   excludeDirs: ['__tests__', 'utils'],
   *   debug: true,
   * })
   * app.listen(3000)
   * ```
   */
  registerFeatures(directory: string, options?: any): this {
    // Start async registration and add Promise to array
    const promise = this._registerFeaturesAsync(directory, options)
    this.featureRegistrationPromises.push(promise)
    return this
  }

  /**
   * Async implementation of Features auto-scan and registration
   *
   * @private
   * @param directory - Features directory path
   * @param options - Scan options
   * @returns Promise<Application>
   */
  private async _registerFeaturesAsync(directory: string, options?: any): Promise<this> {
    const { scanFeatures } = await import('./feature/feature-scanner.js')

    // Scan Features (await for completion)
    const scannedFeatures = await scanFeatures(directory, options)
    console.log(`Found ${scannedFeatures.length} features in ${directory}`)

    // Sort features by route priority to prevent conflicts:
    // 1. Static routes (/blog/search) - Highest priority
    // 2. Parametric routes (/blog/:slug) - Medium priority
    // 3. Wildcard routes (/blog/*) - Lowest priority
    //
    // This ensures that specific routes are registered before dynamic routes,
    // preventing conflicts where /blog/search would be captured by /blog/:slug
    const sortedFeatures = scannedFeatures.sort((a, b) => {
      const aInfo = a.feature.getInfo()
      const bInfo = b.feature.getInfo()
      const aPath = aInfo.path || '/'
      const bPath = bInfo.path || '/'

      // Calculate priority score (lower = higher priority)
      const getPriority = (path: string): number => {
        if (path.includes('*')) return 3  // Wildcard - lowest priority
        if (path.includes(':')) return 2  // Parametric - medium priority
        return 1                           // Static - highest priority
      }

      const aPriority = getPriority(aPath)
      const bPriority = getPriority(bPath)

      // Sort by priority (ascending - lower number = higher priority)
      if (aPriority !== bPriority) {
        return aPriority - bPriority
      }

      // Same priority: sort by path length (longer = more specific = higher priority)
      // This handles cases like /api/users/profile vs /api/users
      const aLength = aPath.split('/').length
      const bLength = bPath.split('/').length
      if (aLength !== bLength) {
        return bLength - aLength  // Descending - longer paths first
      }

      // Same priority and length: sort alphabetically for consistency
      return aPath.localeCompare(bPath)
    })

    // Register each Feature (sequentially with await)
    for (const { feature, relativePath } of sortedFeatures) {
      try {
        await this._registerFeatureAsync(feature)
        const info = feature.getInfo()
        console.log(`Registered: ${info.method} ${info.path} (${relativePath})`)
      } catch (error) {
        console.error(`Failed to register feature from ${relativePath}:`, error)
        throw error // Re-throw error so caller can handle it
      }
    }

    return this
  }

  /**
   * Register custom template engine
   *
   * @param ext - File extension (without dot)
   * @param fn - Engine render function (filePath, options, callback)
   * @returns Application instance for chaining
   *
   * @example
   * app.engine('tmpl', (filePath, options, callback) => {
   *   // Custom rendering logic
   *   callback(null, '<html>...</html>')
   * })
   */
  engine(ext: string, fn: Function): this {
    this.engines.set(ext, fn)
    return this
  }

  /**
   * Render template (server-side)
   * Similar to res.render() but doesn't send response
   * Useful for rendering emails, PDFs, etc.
   *
   * @param view - View name (without extension)
   * @param locals - Local variables to pass to template
   * @param callback - Callback function (err, html)
   *
   * @example
   * app.render('email-template', { user: 'John' }, (err, html) => {
   *   if (err) return console.error(err)
   *   sendEmail(html)
   * })
   */
  render(
    view: string,
    locals: Record<string, any>,
    callback: (err: Error | null, html?: string) => void
  ): void {
    try {
      // Get settings
      const viewEngine = this.get('view engine')
      const viewsPath = this.get('views') || './views'

      if (!viewEngine) {
        callback(new Error('No view engine configured. Use app.set(\'view engine\', \'ejs\')'))
        return
      }

      // Check if custom engine is registered
      const customEngine = this.engines.get(viewEngine)

      // Build view file path
      let viewPath: string
      if (customEngine) {
        // Custom engine might use different extension
        viewPath = `${viewsPath}/${view}.${viewEngine}`
      } else {
        // Standard engines
        const ext = viewEngine === 'handlebars' ? 'hbs' : viewEngine
        viewPath = `${viewsPath}/${view}.${ext}`
      }

      // Merge app.locals with render locals
      const mergedLocals = { ...this.locals, ...locals }

      // Use custom engine if registered
      if (customEngine) {
        customEngine(viewPath, mergedLocals, callback)
        return
      }

      // Use built-in engines (ejs, pug, handlebars)
      this.renderBuiltinEngine(viewEngine, viewPath, mergedLocals, callback)
    } catch (err) {
      callback(err as Error)
    }
  }

  /**
   * Helper to render with built-in engines
   * @private
   */
  private async renderBuiltinEngine(
    engine: string,
    viewPath: string,
    locals: Record<string, any>,
    callback: (err: Error | null, html?: string) => void
  ): Promise<void> {
    try {
      let html: string

      switch (engine) {
        case 'ejs': {
          const ejs = await import('ejs').catch(() => null)
          if (!ejs) {
            throw new Error('EJS template engine not found. Install it with: npm install ejs')
          }
          html = await ejs.renderFile(viewPath, locals)
          break
        }

        case 'pug': {
          const pug = await import('pug').catch(() => null)
          if (!pug) {
            throw new Error('Pug template engine not found. Install it with: npm install pug')
          }
          html = pug.renderFile(viewPath, locals)
          break
        }

        case 'handlebars':
        case 'hbs': {
          const handlebars = await import('handlebars').catch(() => null)
          if (!handlebars) {
            throw new Error('Handlebars template engine not found. Install it with: npm install handlebars')
          }
          const fs = await import('fs')
          const templateSource = await fs.promises.readFile(viewPath, 'utf8')
          const template = handlebars.compile(templateSource)
          html = template(locals)
          break
        }

        default:
          throw new Error(`Unsupported template engine: ${engine}. Use app.engine() to register custom engines.`)
      }

      callback(null, html)
    } catch (err) {
      callback(err as Error)
    }
  }

  /**
   * Return canonical path of the app
   * When app is mounted as a sub-app, returns the mount path
   *
   * @returns Mount path or empty string
   *
   * @example
   * const app = numflow()
   * const adminApp = numflow()
   *
   * app.use('/admin', adminApp)
   * console.log(adminApp.path()) // '/admin'
   */
  path(): string {
    return this.mountPath
  }
}
