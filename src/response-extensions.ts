import { ServerResponse } from 'http'
import { STATUS_CODES } from 'http'
import * as cookie from 'cookie'
import * as fs from 'fs'
import * as path from 'path'
import { Response, CookieOptions } from './types/index.js'
import { asInternalResponse } from './utils/type-casting.js'

/**
 * Valid HTTP status codes as defined in RFC 7231, RFC 6585, and other RFCs
 * Express.js 5.x compatible
 */
const VALID_STATUS_CODES = new Set([
  // 1xx Informational
  100, 101, 102, 103,
  // 2xx Success
  200, 201, 202, 203, 204, 205, 206, 207, 208, 226,
  // 3xx Redirection
  300, 301, 302, 303, 304, 305, 307, 308,
  // 4xx Client Error
  400, 401, 402, 403, 404, 405, 406, 407, 408, 409,
  410, 411, 412, 413, 414, 415, 416, 417, 418, 421,
  422, 423, 424, 425, 426, 428, 429, 431, 451,
  // 5xx Server Error
  500, 501, 502, 503, 504, 505, 506, 507, 508, 510, 511,
])

/**
 * Extend ServerResponse with Response methods
 * This function adds Express-compatible methods to the response object
 */
export function extendResponse(res: ServerResponse): Response {
  const extendedRes = res as Response

  /**
   * Initialize locals as empty object (Express compatibility)
   * Used to pass variables to templates and share data between middleware
   */
  extendedRes.locals = {}

  /**
   * Internal flag to track async response methods in progress
   * Used to prevent race conditions when res.render(), res.sendFile(), etc.
   * are called without await in Feature steps
   *
   * @internal
   */
  ;(extendedRes as any)._responsePending = false

  /**
   * Set status code (chainable)
   * Validates status code according to RFC 7231 (Express.js 5.x compatible)
   *
   * @throws {Error} If status code is invalid
   */
  extendedRes.status = function (code: number): Response {
    // Type validation
    if (typeof code !== 'number' || code === null || code === undefined || isNaN(code)) {
      throw new Error(`Invalid status code: ${code}`)
    }

    // Range and RFC 7231 validation
    if (!VALID_STATUS_CODES.has(code)) {
      throw new Error(`Invalid status code: ${code}`)
    }

    this.statusCode = code
    return this
  }

  /**
   * Send response with automatic Content-Type detection
   */
  extendedRes.send = function (body?: any): void {
    // Check if another response is already in progress
    if ((this as any)._responsePending) {
      throw new Error(
        'Cannot send response: Another response method (res.render(), res.sendFile(), etc.) is already in progress. ' +
        'Make sure to await async response methods in your code.'
      )
    }

    // Mark response as pending (synchronous methods complete immediately)
    ;(this as any)._responsePending = true

    // Set default status code if not set
    if (!this.statusCode || this.statusCode === 200) {
      this.statusCode = 200
    }

    // Handle undefined/null
    if (body === undefined || body === null) {
      this.setHeader('Content-Length', '0')
      this.end()
      return
    }

    // Handle Buffer
    if (Buffer.isBuffer(body)) {
      if (!this.getHeader('Content-Type')) {
        this.setHeader('Content-Type', 'application/octet-stream')
      }
      this.setHeader('Content-Length', body.length.toString())
      this.end(body)
      return
    }

    // Handle string
    if (typeof body === 'string') {
      if (!this.getHeader('Content-Type')) {
        // Auto-detect HTML
        if (body.trim().startsWith('<')) {
          this.setHeader('Content-Type', 'text/html; charset=utf-8')
        } else {
          this.setHeader('Content-Type', 'text/plain; charset=utf-8')
        }
      }
      this.setHeader('Content-Length', Buffer.byteLength(body).toString())
      this.end(body)
      return
    }

    // Handle boolean/number
    if (typeof body === 'boolean' || typeof body === 'number') {
      const str = String(body)
      if (!this.getHeader('Content-Type')) {
        this.setHeader('Content-Type', 'text/plain; charset=utf-8')
      }
      this.setHeader('Content-Length', Buffer.byteLength(str).toString())
      this.end(str)
      return
    }

    // Handle object/array (JSON)
    if (typeof body === 'object') {
      // Reset pending flag before calling json() to avoid self-blocking
      ;(this as any)._responsePending = false
      this.json(body)
      return
    }

    // Fallback
    this.end()
  }

  /**
   * Send JSON response
   */
  extendedRes.json = function (obj: any): void {
    // Check if another response is already in progress
    if ((this as any)._responsePending) {
      throw new Error(
        'Cannot send response: Another response method (res.render(), res.sendFile(), etc.) is already in progress. ' +
        'Make sure to await async response methods in your code.'
      )
    }

    // Mark response as pending (synchronous methods complete immediately)
    ;(this as any)._responsePending = true

    // Set default status code if not set
    if (!this.statusCode || this.statusCode === 200) {
      this.statusCode = 200
    }

    const json = JSON.stringify(obj)
    this.setHeader('Content-Type', 'application/json; charset=utf-8')
    this.setHeader('Content-Length', Buffer.byteLength(json).toString())
    this.end(json)
  }

  /**
   * Send JSONP response
   * JSONP support for cross-domain requests
   *
   * @param obj - Object to send as JSONP
   *
   * @example
   * // Request: GET /api/data?callback=myCallback
   * res.jsonp({ name: 'John' })
   * // Response: myCallback({"name":"John"})
   */
  extendedRes.jsonp = function (obj: any): void {
    // Set default status code if not set
    if (!this.statusCode || this.statusCode === 200) {
      this.statusCode = 200
    }

    const json = JSON.stringify(obj)

    // Get callback name from query parameter (default: 'callback')
    const internalRes = asInternalResponse(this)
    const req = internalRes.req
    const callbackName = req?.query?.callback as string | undefined

    // If no callback, fall back to regular JSON
    if (!callbackName) {
      this.setHeader('Content-Type', 'application/json; charset=utf-8')
      this.setHeader('Content-Length', Buffer.byteLength(json).toString())
      this.end(json)
      return
    }

    // Validate callback name (prevent XSS)
    // Express 5.x compatible pattern: identifiers separated by dots only
    // Rejects brackets: evil[arbitrary], foo[bar]
    // Allows: myCallback, obj.method, obj.nested.deep.method
    const callbackRegex = /^[a-zA-Z_$][a-zA-Z0-9_$]*(?:\.[a-zA-Z_$][a-zA-Z0-9_$]*)*$/
    if (!callbackRegex.test(callbackName)) {
      this.statusCode = 400
      this.setHeader('Content-Type', 'text/plain; charset=utf-8')
      this.end('Invalid callback parameter')
      return
    }

    // Create JSONP response: callback(json)
    const jsonp = `/**/ typeof ${callbackName} === 'function' && ${callbackName}(${json});`

    // Set headers
    this.setHeader('Content-Type', 'application/javascript; charset=utf-8')
    this.setHeader('X-Content-Type-Options', 'nosniff')
    this.setHeader('Content-Length', Buffer.byteLength(jsonp).toString())
    this.end(jsonp)
  }

  /**
   * Redirect to URL
   * Overloaded: redirect(url) or redirect(status, url)
   */
  extendedRes.redirect = function (
    statusOrUrl: number | string,
    url?: string
  ): void {
    // Check if another response is already in progress
    if ((this as any)._responsePending) {
      throw new Error(
        'Cannot send response: Another response method (res.render(), res.sendFile(), etc.) is already in progress. ' +
        'Make sure to await async response methods in your code.'
      )
    }

    // Mark response as pending (synchronous methods complete immediately)
    ;(this as any)._responsePending = true

    let status = 302 // Default redirect status
    let location: string

    if (typeof statusOrUrl === 'number') {
      status = statusOrUrl
      location = url || '/'
    } else {
      location = statusOrUrl
    }

    // Validate status code (301, 302, 303, 307, 308)
    if (![301, 302, 303, 307, 308].includes(status)) {
      status = 302
    }

    this.statusCode = status
    this.setHeader('Location', location)
    this.setHeader('Content-Length', '0')
    this.end()
  }

  /**
   * Send status code with default message
   */
  extendedRes.sendStatus = function (code: number): void {
    const message = STATUS_CODES[code] || String(code)
    this.statusCode = code
    this.setHeader('Content-Type', 'text/plain; charset=utf-8')
    this.setHeader('Content-Length', Buffer.byteLength(message).toString())
    this.end(message)
  }

  /**
   * Set response header(s)
   * Overloaded: set(field, value) or set(fields)
   */
  extendedRes.set = function (
    fieldOrFields: string | Record<string, string | string[]>,
    value?: string | string[]
  ): Response {
    if (typeof fieldOrFields === 'string') {
      // Single field
      this.setHeader(fieldOrFields, value as string | string[])
    } else {
      // Multiple fields
      for (const [key, val] of Object.entries(fieldOrFields)) {
        this.setHeader(key, val)
      }
    }
    return this
  }

  /**
   * Alias for set()
   */
  extendedRes.header = extendedRes.set

  /**
   * Get response header value
   */
  extendedRes.get = function (
    field: string
  ): string | string[] | number | undefined {
    return this.getHeader(field)
  }

  /**
   * Append value to header
   */
  extendedRes.append = function (
    field: string,
    value: string | string[]
  ): Response {
    const prev = this.getHeader(field)
    let newValue: string | string[]

    if (prev) {
      // Combine previous and new values
      if (Array.isArray(prev)) {
        newValue = prev.concat(value)
      } else if (Array.isArray(value)) {
        newValue = [prev.toString()].concat(value)
      } else {
        newValue = [prev.toString(), value]
      }
    } else {
      newValue = value
    }

    this.setHeader(field, newValue)
    return this
  }

  /**
   * Set Content-Type header
   * Supports MIME types and extensions
   */
  extendedRes.type = function (type: string): Response {
    // Basic MIME type mapping for common extensions
    const mimeTypes: Record<string, string> = {
      html: 'text/html',
      json: 'application/json',
      xml: 'application/xml',
      txt: 'text/plain',
      css: 'text/css',
      js: 'application/javascript',
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      gif: 'image/gif',
      svg: 'image/svg+xml',
      pdf: 'application/pdf',
    }

    // If it's an extension, convert to MIME type
    const contentType = mimeTypes[type] || type

    // Add charset for text types
    if (
      contentType.startsWith('text/') ||
      contentType === 'application/json' ||
      contentType === 'application/javascript'
    ) {
      this.setHeader('Content-Type', `${contentType}; charset=utf-8`)
    } else {
      this.setHeader('Content-Type', contentType)
    }

    return this
  }

  /**
   * Set Location header
   */
  extendedRes.location = function (url: string): Response {
    this.setHeader('Location', url)
    return this
  }

  /**
   * Set cookie
   */
  extendedRes.cookie = function (
    name: string,
    value: string,
    options?: CookieOptions
  ): Response {
    const opts = options || {}
    const cookieString = cookie.serialize(name, value, {
      domain: opts.domain,
      encode: opts.encode || encodeURIComponent,
      expires: opts.expires,
      httpOnly: opts.httpOnly,
      maxAge: opts.maxAge,
      path: opts.path || '/',
      secure: opts.secure,
      sameSite: opts.sameSite,
    })

    // Append to Set-Cookie header (multiple cookies support)
    const existing = this.getHeader('Set-Cookie')
    if (existing) {
      if (Array.isArray(existing)) {
        this.setHeader('Set-Cookie', [...existing, cookieString])
      } else {
        this.setHeader('Set-Cookie', [existing.toString(), cookieString])
      }
    } else {
      this.setHeader('Set-Cookie', cookieString)
    }

    return this
  }

  /**
   * Clear cookie
   */
  extendedRes.clearCookie = function (
    name: string,
    options?: CookieOptions
  ): Response {
    const opts = {
      ...options,
      expires: new Date(1), // Set to past date
      maxAge: undefined, // Remove maxAge
    }

    return this.cookie(name, '', opts)
  }

  /**
   * Set Content-Disposition header to "attachment"
   * Optionally sets filename and Content-Type based on file extension
   * Complies with RFC 6266 (Content-Disposition header encoding)
   *
   * @example
   * res.attachment() // Content-Disposition: attachment
   * res.attachment('report.pdf') // Content-Disposition: attachment; filename="report.pdf"
   * res.attachment('unicode.txt') // Content-Disposition: attachment; filename="unicode.txt"; filename*=UTF-8''unicode.txt
   */
  extendedRes.attachment = function (filename?: string): Response {
    if (filename) {
      // Set Content-Type based on file extension
      const contentType = getMimeType(filename)
      if (contentType) {
        this.type(contentType)
      }

      // RFC 6266: Check if filename contains non-ASCII characters
      const isAsciiOnly = /^[\x20-\x7E]*$/.test(filename)

      if (isAsciiOnly) {
        // Simple ASCII filename: use basic format
        this.set('Content-Disposition', `attachment; filename="${filename}"`)
      } else {
        // Non-ASCII filename: use RFC 5987 encoding with fallback
        // RFC 5987: filename*=charset'lang'encoded-value
        const encodedFilename = encodeURIComponent(filename)
          .replace(/['()]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase())
          .replace(/\*/g, '%2A')

        // ASCII fallback: replace non-ASCII with '?'
        const fallbackFilename = filename.replace(/[^\x20-\x7E]/g, '?')

        // Set both filename (ASCII fallback for old browsers) and filename* (UTF-8)
        this.set(
          'Content-Disposition',
          `attachment; filename="${fallbackFilename}"; filename*=UTF-8''${encodedFilename}`
        )
      }
    } else {
      // No filename, just set to attachment
      this.set('Content-Disposition', 'attachment')
    }

    return this
  }

  /**
   * Send file
   * File transfer
   *
   * @example
   * res.sendFile('/path/to/file.pdf')
   */
  extendedRes.sendFile = async function (filePath: string): Promise<void> {
    // Mark response as pending to prevent race conditions
    ;(this as any)._responsePending = true

    try {
      // Resolve absolute path
      const absolutePath = path.isAbsolute(filePath) ? filePath : path.resolve(filePath)

      // Check if file exists
      const stats = await fs.promises.stat(absolutePath)

      if (!stats.isFile()) {
        ;(this as any)._responsePending = false
        this.statusCode = 404
        this.setHeader('Content-Type', 'text/plain')
        this.end('Not Found')
        return
      }

      // Get MIME type based on file extension
      const mimeType = getMimeType(absolutePath)

      // Set headers
      this.setHeader('Content-Type', mimeType)
      this.setHeader('Content-Length', stats.size.toString())
      this.setHeader('Last-Modified', stats.mtime.toUTCString())

      // Create read stream and pipe to response
      const stream = fs.createReadStream(absolutePath)

      stream.on('error', (err) => {
        console.error('Error reading file:', err)
        if (!this.headersSent) {
          ;(this as any)._responsePending = false
          this.statusCode = 500
          this.end('Internal Server Error')
        }
      })

      // Reset pending flag before starting the stream (pipe will send headers)
      ;(this as any)._responsePending = false
      this.statusCode = 200
      stream.pipe(this)
    } catch (err: any) {
      ;(this as any)._responsePending = false
      if (err.code === 'ENOENT') {
        this.statusCode = 404
        this.setHeader('Content-Type', 'text/plain')
        this.end('Not Found')
      } else {
        console.error('Error in sendFile:', err)
        this.statusCode = 500
        this.setHeader('Content-Type', 'text/plain')
        this.end('Internal Server Error')
      }
    }
  }

  /**
   * Download file (triggers browser download)
   * File download with Content-Disposition header
   *
   * @param filePath - Path to file
   * @param filename - Download filename (optional, defaults to original filename)
   *
   * @example
   * res.download('/path/to/file.pdf')
   * res.download('/path/to/file.pdf', 'report.pdf')
   */
  extendedRes.download = async function (
    filePath: string,
    filename?: string
  ): Promise<void> {
    // Mark response as pending to prevent race conditions
    ;(this as any)._responsePending = true

    try {
      // Resolve absolute path
      const absolutePath = path.isAbsolute(filePath) ? filePath : path.resolve(filePath)

      // Check if file exists
      const stats = await fs.promises.stat(absolutePath)

      if (!stats.isFile()) {
        ;(this as any)._responsePending = false
        this.statusCode = 404
        this.setHeader('Content-Type', 'text/plain')
        this.end('Not Found')
        return
      }

      // Determine download filename
      const downloadFilename = filename || path.basename(absolutePath)

      // Set Content-Disposition header to trigger download
      // Use res.attachment() for RFC 6266 + RFC 5987 compliance
      this.attachment(downloadFilename)

      // Get MIME type based on file extension
      const mimeType = getMimeType(absolutePath)

      // Set headers
      this.setHeader('Content-Type', mimeType)
      this.setHeader('Content-Length', stats.size.toString())
      this.setHeader('Last-Modified', stats.mtime.toUTCString())

      // Create read stream and pipe to response
      const stream = fs.createReadStream(absolutePath)

      stream.on('error', (err) => {
        console.error('Error reading file:', err)
        if (!this.headersSent) {
          ;(this as any)._responsePending = false
          this.statusCode = 500
          this.end('Internal Server Error')
        }
      })

      // Reset pending flag before starting the stream (pipe will send headers)
      ;(this as any)._responsePending = false
      this.statusCode = 200
      stream.pipe(this)
    } catch (err: any) {
      ;(this as any)._responsePending = false
      if (err.code === 'ENOENT') {
        this.statusCode = 404
        this.setHeader('Content-Type', 'text/plain')
        this.end('Not Found')
      } else {
        console.error('Error in download:', err)
        this.statusCode = 500
        this.setHeader('Content-Type', 'text/plain')
        this.end('Internal Server Error')
      }
    }
  }

  /**
   * Render template and send HTML response
   * Template rendering support
   *
   * @param view - View name (without extension)
   * @param locals - Local variables to pass to template
   * @param callback - Optional callback (Express compatibility)
   *
   * @example
   * // Set view engine
   * app.set('view engine', 'ejs')
   * app.set('views', './views')
   *
   * // Render template
   * res.render('index', { title: 'Home', user: currentUser })
   */
  extendedRes.render = async function (
    view: string,
    locals?: Record<string, any>,
    callback?: (err: Error | null, html?: string) => void
  ): Promise<void> {
    // Mark response as pending to prevent race conditions
    ;(this as any)._responsePending = true

    try {
      const internalRes = asInternalResponse(this)
      const app = internalRes.app

      if (!app) {
        throw new Error('res.render(): res.app is not defined')
      }

      // Get settings
      const viewEngine = app.get('view engine')
      const viewsPath = app.get('views') || './views'

      if (!viewEngine) {
        throw new Error(
          'res.render(): No view engine configured. Use app.set(\'view engine\', \'ejs\')'
        )
      }

      // Check for custom engine registered with app.engine()
      const customEngines = (app as any).engines
      const customEngine = customEngines && customEngines.get(viewEngine)

      // Build view file path
      let viewPath: string
      if (customEngine) {
        // Custom engine might use different extension
        const viewFile = view.includes('.') ? view : `${view}.${viewEngine}`
        viewPath = path.resolve(viewsPath, viewFile)
      } else {
        // Special case: 'handlebars' uses .hbs extension
        const extension = viewEngine === 'handlebars' ? 'hbs' : viewEngine
        const viewFile = view.includes('.') ? view : `${view}.${extension}`
        viewPath = path.resolve(viewsPath, viewFile)

        // Check if view file exists for built-in engines
        if (!fs.existsSync(viewPath)) {
          throw new Error(`View file not found: ${viewPath}`)
        }
      }

      // Merge app.locals with res.locals and render locals
      const mergedLocals = { ...app.locals, ...(this.locals || {}), ...(locals || {}) }

      // Use custom engine if registered
      if (customEngine) {
        // Custom engine uses callback pattern
        const renderPromise = new Promise<string>((resolve, reject) => {
          customEngine(viewPath, mergedLocals, (err: Error | null, html?: string) => {
            if (err) reject(err)
            else resolve(html || '')
          })
        })

        const html = await renderPromise

        // Call callback if provided (Express compatibility)
        if (callback) {
          callback(null, html)
          return
        }

        // Send HTML response
        // Reset pending flag before calling send() to avoid self-blocking
        ;(this as any)._responsePending = false
        this.setHeader('Content-Type', 'text/html; charset=utf-8')
        this.send(html)
        return
      }

      // Render template based on built-in engine
      let html: string

      switch (viewEngine) {
        case 'ejs': {
          // Try to import ejs
          let ejs: any
          try {
            ejs = await import('ejs')
          } catch (err) {
            throw new Error(
              'EJS template engine not found. Install it with: npm install ejs'
            )
          }

          // Render with ejs
          html = await ejs.renderFile(viewPath, mergedLocals)
          break
        }

        case 'pug': {
          // Try to import pug
          let pug: any
          try {
            pug = await import('pug')
          } catch (err) {
            throw new Error(
              'Pug template engine not found. Install it with: npm install pug'
            )
          }

          // Render with pug
          html = pug.renderFile(viewPath, mergedLocals)
          break
        }

        case 'handlebars':
        case 'hbs': {
          // Try to import handlebars
          let handlebars: any
          try {
            handlebars = await import('handlebars')
          } catch (err) {
            throw new Error(
              'Handlebars template engine not found. Install it with: npm install handlebars'
            )
          }

          // Read template file
          const templateSource = await fs.promises.readFile(viewPath, 'utf8')

          // Compile and render
          const template = handlebars.compile(templateSource)
          html = template(mergedLocals)
          break
        }

        default:
          throw new Error(
            `Unsupported view engine: ${viewEngine}. Supported engines: ejs, pug, handlebars`
          )
      }

      // Call callback if provided (Express compatibility)
      if (callback) {
        callback(null, html)
        return
      }

      // Send HTML response
      // Reset pending flag before calling send() to avoid self-blocking
      ;(this as any)._responsePending = false

      // Only set Content-Type if not already set (preserve user's Content-Type)
      if (!this.getHeader('Content-Type')) {
        this.setHeader('Content-Type', 'text/html; charset=utf-8')
      }

      this.send(html)
    } catch (err: any) {
      // Call callback with error if provided
      if (callback) {
        callback(err)
        return
      }

      // Otherwise throw error (will be caught by error handler)
      console.error('Error in render:', err)
      this.statusCode = 500
      this.setHeader('Content-Type', 'text/plain')
      this.end(`Template rendering error: ${err.message}`)
    }
  }

  /**
   * res.links() - Set Link header
   * Appends link relations to the Link header
   */
  extendedRes.links = function (links: Record<string, string>): Response {
    const existingLink = this.getHeader('Link') as string
    const linkParts: string[] = existingLink ? [existingLink] : []

    // Format each link relation
    for (const [rel, url] of Object.entries(links)) {
      linkParts.push(`<${url}>; rel="${rel}"`)
    }

    // Set Link header
    this.setHeader('Link', linkParts.join(', '))
    return this
  }

  /**
   * res.vary() - Set Vary header
   * Appends field to the Vary header (no duplicates, case-insensitive)
   */
  extendedRes.vary = function (field: string): Response {
    // Special case: * means vary on everything
    if (field === '*') {
      this.setHeader('Vary', '*')
      return this
    }

    const existingVary = this.getHeader('Vary') as string
    if (existingVary === '*') {
      // Already varying on everything
      return this
    }

    const fields = existingVary
      ? existingVary.split(',').map(f => f.trim().toLowerCase())
      : []

    const lowerField = field.toLowerCase()

    // Add field if not already present (case-insensitive)
    if (!fields.includes(lowerField)) {
      const newVary = existingVary
        ? `${existingVary}, ${field}`
        : field
      this.setHeader('Vary', newVary)
    }

    return this
  }

  /**
   * res.format() - Content-Type negotiation response
   * Calls handler based on Accept header, sends 406 if no match
   */
  extendedRes.format = function (obj: Record<string, () => void>): void {
    const req = (this as any).req

    if (!req || !req.accepts) {
      // No request object, call default or send 406
      if (obj.default) {
        obj.default()
        return
      }
      this.statusCode = 406
      this.end('Not Acceptable')
      return
    }

    // Map short forms to full MIME types
    const typeMap: Record<string, string> = {
      json: 'application/json',
      html: 'text/html',
      text: 'text/plain',
      xml: 'application/xml',
    }

    // Convert keys to full MIME types
    const handlers: Record<string, () => void> = {}
    const types: string[] = []
    for (const [key, handler] of Object.entries(obj)) {
      if (key === 'default') continue

      const fullType = typeMap[key] || key
      handlers[fullType] = handler
      types.push(fullType)
    }

    // Check which type is accepted
    const acceptedType = req.accepts(...types)

    if (acceptedType) {
      // Call matching handler
      handlers[acceptedType as string]()
    } else if (obj.default) {
      // No match, call default
      obj.default()
    } else {
      // No match and no default, send 406 Not Acceptable
      this.statusCode = 406
      this.end('Not Acceptable')
    }
  }

  return extendedRes
}

/**
 * Get MIME type based on file extension
 */
function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase()
  const mimeTypes: Record<string, string> = {
    // Text
    '.html': 'text/html',
    '.htm': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.mjs': 'application/javascript',
    '.json': 'application/json',
    '.xml': 'application/xml',
    '.txt': 'text/plain',
    '.md': 'text/markdown',

    // Images
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.webp': 'image/webp',

    // Documents
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.ppt': 'application/vnd.ms-powerpoint',
    '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',

    // Fonts
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.otf': 'font/otf',
    '.eot': 'application/vnd.ms-fontobject',

    // Archives
    '.zip': 'application/zip',
    '.tar': 'application/x-tar',
    '.gz': 'application/gzip',
    '.7z': 'application/x-7z-compressed',

    // Audio
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.ogg': 'audio/ogg',
    '.m4a': 'audio/mp4',

    // Video
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.avi': 'video/x-msvideo',
    '.mov': 'video/quicktime',
    '.wmv': 'video/x-ms-wmv',
  }

  return mimeTypes[ext] || 'application/octet-stream'
}
