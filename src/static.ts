import { RequestHandler } from './types/index.js'
import * as fs from 'fs'
import * as path from 'path'
import { createHash } from 'crypto'

/**
 * Static file serving options
 */
export interface StaticOptions {
  /**
   * Cache max-age in milliseconds or string format (e.g., '1d', '2h')
   * Default: 0 (no cache)
   */
  maxAge?: number | string

  /**
   * Enable or disable ETag generation
   * Default: true
   */
  etag?: boolean

  /**
   * Serve index.html for directory requests
   * Default: true
   */
  index?: boolean | string

  /**
   * Enable or disable dotfiles serving
   * Default: 'ignore' (ignore dotfiles)
   */
  dotfiles?: 'allow' | 'deny' | 'ignore'
}

/**
 * MIME type mapping for common file extensions
 */
const MIME_TYPES: Record<string, string> = {
  // Text
  '.html': 'text/html',
  '.htm': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.mjs': 'application/javascript',
  '.json': 'application/json',
  '.xml': 'application/xml',
  '.txt': 'text/plain',

  // Images
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',

  // Fonts
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',

  // Video/Audio
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',

  // Documents
  '.pdf': 'application/pdf',
  '.zip': 'application/zip',

  // Default
  '': 'application/octet-stream',
}

/**
 * Parse maxAge string to milliseconds
 * Examples: '1d' -> 86400000, '2h' -> 7200000
 */
function parseMaxAge(maxAge: number | string): number {
  if (typeof maxAge === 'number') {
    return maxAge
  }

  const match = /^(\d+(?:\.\d+)?)(s|m|h|d)?$/i.exec(maxAge)
  if (!match) {
    throw new Error(`Invalid maxAge format: ${maxAge}`)
  }

  const value = parseFloat(match[1])
  const unit = (match[2] || 's').toLowerCase()

  switch (unit) {
    case 's': // seconds
      return value * 1000
    case 'm': // minutes
      return value * 60 * 1000
    case 'h': // hours
      return value * 60 * 60 * 1000
    case 'd': // days
      return value * 24 * 60 * 60 * 1000
    default:
      return value * 1000
  }
}

/**
 * Get MIME type from file extension
 */
function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase()
  return MIME_TYPES[ext] || MIME_TYPES['']
}

/**
 * Generate ETag from file stats
 * Format: "<size>-<mtime>"
 */
function generateETag(stats: fs.Stats): string {
  const hash = createHash('md5')
    .update(`${stats.size}-${stats.mtime.getTime()}`)
    .digest('hex')
  return `"${hash}"`
}

/**
 * Check if path is safe (prevent path traversal attacks)
 */
function isSafePath(root: string, requestedPath: string): boolean {
  const resolvedRoot = path.resolve(root)
  const resolvedPath = path.resolve(requestedPath)
  return resolvedPath.startsWith(resolvedRoot)
}

/**
 * Static file serving middleware
 * Serves static files from the specified directory
 *
 * @param root - Root directory path
 * @param options - Static serving options
 * @returns Middleware function
 *
 * @example
 * // JavaScript
 * const numflow = require('numflow')
 * const app = numflow()
 *
 * // Serve files from 'public' directory
 * app.use(numflow.static('public'))
 *
 * // With options
 * app.use('/static', numflow.static('public', {
 *   maxAge: '1d',
 *   etag: true
 * }))
 *
 * @example
 * // TypeScript
 * import numflow from 'numflow'
 * const app = numflow()
 *
 * app.use(numflow.static('public', {
 *   maxAge: '1d',
 *   etag: true,
 *   index: 'index.html'
 * }))
 */
export function staticFiles(
  root: string,
  options: StaticOptions = {}
): RequestHandler {
  const {
    maxAge = 0,
    etag = true,
    index = true,
    dotfiles = 'ignore',
  } = options

  const maxAgeMs = typeof maxAge === 'number' ? maxAge : parseMaxAge(maxAge)
  const indexFile = typeof index === 'string' ? index : 'index.html'

  // Resolve root directory
  const rootPath = path.resolve(root)

  return async (req, res, next) => {
    try {
      // Only handle GET and HEAD requests
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        return next()
      }

      // Get requested path (remove query string)
      const requestPath = req.path || req.url || '/'

      // Build file path
      let filePath = path.join(rootPath, requestPath)

      // Security check: prevent path traversal
      if (!isSafePath(rootPath, filePath)) {
        return next()
      }

      // Check if file exists
      let stats: fs.Stats
      try {
        stats = await fs.promises.stat(filePath)
      } catch {
        return next() // File not found, pass to next middleware
      }

      // If it's a directory, try to serve index file
      if (stats.isDirectory()) {
        if (index) {
          const indexPath = path.join(filePath, indexFile)
          try {
            const indexStats = await fs.promises.stat(indexPath)
            if (indexStats.isFile()) {
              filePath = indexPath
              stats = indexStats
            } else {
              return next()
            }
          } catch {
            return next()
          }
        } else {
          return next()
        }
      }

      // Check dotfiles
      const basename = path.basename(filePath)
      if (basename.startsWith('.')) {
        if (dotfiles === 'deny') {
          res.status(403).send('Forbidden')
          return
        } else if (dotfiles === 'ignore') {
          return next()
        }
      }

      // Generate ETag
      if (etag) {
        const etagValue = generateETag(stats)
        res.set('ETag', etagValue)

        // Check If-None-Match header
        const ifNoneMatch = req.headers['if-none-match']
        if (ifNoneMatch === etagValue) {
          res.status(304).end()
          return
        }
      }

      // Set Cache-Control header
      if (maxAgeMs > 0) {
        const maxAgeSeconds = Math.floor(maxAgeMs / 1000)
        res.set('Cache-Control', `public, max-age=${maxAgeSeconds}`)
      } else {
        res.set('Cache-Control', 'public, max-age=0')
      }

      // Set Content-Type
      const mimeType = getMimeType(filePath)
      res.set('Content-Type', mimeType)

      // Set Content-Length
      res.set('Content-Length', stats.size.toString())

      // Set Last-Modified
      res.set('Last-Modified', stats.mtime.toUTCString())

      // For HEAD requests, just send headers
      if (req.method === 'HEAD') {
        res.status(200).end()
        return
      }

      // Stream file to response
      const stream = fs.createReadStream(filePath)
      stream.on('error', (err) => {
        console.error('Error reading file:', err)
        if (!res.headersSent) {
          res.status(500).send('Internal Server Error')
        }
      })

      res.status(200)
      stream.pipe(res)
    } catch (err) {
      console.error('Static file serving error:', err)
      next(err)
    }
  }
}

// Alias for Express compatibility
export const serveStatic = staticFiles
