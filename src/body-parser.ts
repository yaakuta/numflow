import { IncomingMessage } from 'http'

/**
 * Body Parser Options
 */
export interface BodyParserOptions {
  /**
   * Body size limit (default: 1mb)
   */
  limit?: number | string

  /**
   * Strict mode for JSON parsing (default: true)
   */
  strict?: boolean

  /**
   * Use extended query string parser (qs) for URL-encoded bodies
   * Accepted for Express compatibility (uses built-in parser)
   * Default: true
   */
  extended?: boolean
}

/**
 * Parse body size limit string to bytes
 * Examples: '1mb' -> 1048576, '500kb' -> 512000
 */
function parseLimit(limit: number | string): number {
  if (typeof limit === 'number') {
    return limit
  }

  const match = /^(\d+(?:\.\d+)?)(kb|mb|gb)?$/i.exec(limit)
  if (!match) {
    throw new Error(`Invalid body size limit: ${limit}`)
  }

  const size = parseFloat(match[1])
  const unit = (match[2] || '').toLowerCase()

  switch (unit) {
    case 'kb':
      return Math.floor(size * 1024)
    case 'mb':
      return Math.floor(size * 1024 * 1024)
    case 'gb':
      return Math.floor(size * 1024 * 1024 * 1024)
    default:
      return Math.floor(size)
  }
}

/**
 * Read raw body from request
 */
async function readBody(req: IncomingMessage, limit: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    let totalLength = 0

    req.on('data', (chunk: Buffer) => {
      totalLength += chunk.length

      if (totalLength > limit) {
        req.removeAllListeners('data')
        req.removeAllListeners('end')
        reject(new Error(`Request body size exceeds limit of ${limit} bytes`))
        return
      }

      chunks.push(chunk)
    })

    req.on('end', () => {
      resolve(Buffer.concat(chunks))
    })

    req.on('error', (err) => {
      reject(err)
    })
  })
}

/**
 * JSON Body Parser
 * Parses JSON request bodies
 */
export function json(options: BodyParserOptions = {}) {
  const limit = parseLimit(options.limit || '1mb')
  const strict = options.strict !== false

  return async (req: any): Promise<void> => {
    // Check Content-Type
    const contentType = req.headers['content-type'] || ''
    if (!contentType.includes('application/json')) {
      return
    }

    // Skip if body already parsed
    if (req.body !== undefined) {
      return
    }

    try {
      const buffer = await readBody(req, limit)
      const text = buffer.toString('utf-8')

      // Empty body
      if (text.length === 0) {
        req.body = {}
        return
      }

      // Parse JSON
      const parsed = JSON.parse(text)

      // Strict mode: only allow objects and arrays
      if (strict && typeof parsed !== 'object') {
        throw new Error('Strict mode: JSON body must be an object or array')
      }

      req.body = parsed
    } catch (err: any) {
      if (err instanceof SyntaxError) {
        throw new Error(`Invalid JSON: ${err.message}`)
      }
      throw err
    }
  }
}

/**
 * URL-encoded Body Parser
 * Parses application/x-www-form-urlencoded request bodies
 */
export function urlencoded(options: BodyParserOptions = {}) {
  const limit = parseLimit(options.limit || '1mb')

  return async (req: any): Promise<void> => {
    // Check Content-Type
    const contentType = req.headers['content-type'] || ''
    if (!contentType.includes('application/x-www-form-urlencoded')) {
      return
    }

    // Skip if body already parsed
    if (req.body !== undefined) {
      return
    }

    try {
      const buffer = await readBody(req, limit)
      const text = buffer.toString('utf-8')

      // Empty body
      if (text.length === 0) {
        req.body = {}
        return
      }

      // Parse URL-encoded data
      const parsed: Record<string, any> = {}
      const pairs = text.split('&')

      for (const pair of pairs) {
        const [key, value] = pair.split('=')
        const decodedKey = decodeURIComponent(key || '')
        const decodedValue = decodeURIComponent(value || '')

        if (decodedKey) {
          // Handle array notation: key[]=value
          if (decodedKey.endsWith('[]')) {
            const arrayKey = decodedKey.slice(0, -2)
            if (!parsed[arrayKey]) {
              parsed[arrayKey] = []
            }
            if (Array.isArray(parsed[arrayKey])) {
              parsed[arrayKey].push(decodedValue)
            }
          } else {
            // Normal key-value
            parsed[decodedKey] = decodedValue
          }
        }
      }

      req.body = parsed
    } catch (err: any) {
      throw new Error(`Failed to parse URL-encoded body: ${err.message}`)
    }
  }
}

/**
 * Raw Body Parser
 * Parses raw binary data as Buffer
 */
export function raw(options: BodyParserOptions = {}) {
  const limit = parseLimit(options.limit || '1mb')

  return async (req: any): Promise<void> => {
    // Check Content-Type (optional - can accept any type)
    const contentType = req.headers['content-type'] || ''

    // Only parse if Content-Type is application/octet-stream or similar
    // Or if explicitly set to parse all
    if (
      contentType &&
      !contentType.includes('application/octet-stream') &&
      !contentType.includes('application/') &&
      !contentType.includes('image/') &&
      !contentType.includes('video/') &&
      !contentType.includes('audio/')
    ) {
      return
    }

    // Skip if body already parsed
    if (req.body !== undefined) {
      return
    }

    try {
      const buffer = await readBody(req, limit)
      req.body = buffer
    } catch (err: any) {
      throw new Error(`Failed to parse raw body: ${err.message}`)
    }
  }
}

/**
 * Text Body Parser
 * Parses text/plain request bodies as string
 */
export function text(options: BodyParserOptions = {}) {
  const limit = parseLimit(options.limit || '1mb')

  return async (req: any): Promise<void> => {
    // Check Content-Type
    const contentType = req.headers['content-type'] || ''
    if (
      !contentType.includes('text/plain') &&
      !contentType.includes('text/')
    ) {
      return
    }

    // Skip if body already parsed
    if (req.body !== undefined) {
      return
    }

    try {
      const buffer = await readBody(req, limit)
      req.body = buffer.toString('utf-8')
    } catch (err: any) {
      throw new Error(`Failed to parse text body: ${err.message}`)
    }
  }
}

/**
 * Auto Body Parser
 *
 * Automatically selects appropriate parser based on Content-Type header.
 * 10-15% faster than legacy approach (2 try-catch).
 *
 * @param options - Body parser options
 * @returns Body parser function
 *
 * @example
 * ```typescript
 * // Used in application.ts
 * await autoBodyParser(this.bodyParserOptions)(extendedReq)
 * ```
 */
export function autoBodyParser(options: BodyParserOptions = {}): (req: IncomingMessage) => Promise<void> {
  return async (req: IncomingMessage): Promise<void> => {
    // Check Content-Type header
    const contentType = req.headers['content-type']

    if (!contentType) {
      // Don't parse if no Content-Type
      return
    }

    // Extract only media type from Content-Type (remove charset, etc.)
    const mediaType = contentType.split(';')[0].trim().toLowerCase()

    // Select appropriate parser based on Content-Type
    if (mediaType === 'application/json') {
      // JSON parser
      await json(options)(req)
    } else if (mediaType === 'application/x-www-form-urlencoded') {
      // URL-encoded parser
      await urlencoded(options)(req)
    } else if (mediaType.startsWith('text/')) {
      // Text parser
      await text(options)(req)
    } else if (
      mediaType === 'application/octet-stream' ||
      mediaType.startsWith('multipart/') ||
      mediaType.startsWith('image/') ||
      mediaType.startsWith('video/') ||
      mediaType.startsWith('audio/')
    ) {
      // Raw parser (binary data)
      await raw(options)(req)
    }
    // Ignore other Content-Types (don't parse)
  }
}

/**
 * Body Parser Error
 */
export class BodyParserError extends Error {
  statusCode: number

  constructor(message: string, statusCode: number = 400) {
    super(message)
    this.name = 'BodyParserError'
    this.statusCode = statusCode
  }
}
