import * as zlib from 'zlib'
import { RequestHandler } from './types/index.js'

/**
 * Compression Options
 * Response compression
 */
export interface CompressionOptions {
  /**
   * Compression level (0-9)
   * 0 = no compression, 9 = maximum compression
   * Default: 6
   */
  level?: number

  /**
   * Minimum response size to compress (bytes)
   * Default: 1024 (1kb)
   */
  threshold?: number

  /**
   * Filter function to determine if response should be compressed
   */
  filter?: (req: any, res: any) => boolean
}

/**
 * Compression middleware
 * Compresses response bodies using gzip or deflate
 *
 * Express-compatible compression
 *
 * @param options - Compression options
 * @returns Middleware function
 *
 * @example
 * // JavaScript
 * const compression = require('numflow').compression
 * app.use(compression())
 *
 * @example
 * // With custom options
 * app.use(compression({
 *   level: 9,
 *   threshold: 2048
 * }))
 */
export function compression(options: CompressionOptions = {}): RequestHandler {
  const {
    level = 6,
    threshold = 1024,
    filter = defaultFilter,
  } = options

  return (req: any, res: any, next) => {
    // Skip if request doesn't accept encoding
    const acceptEncoding = req.headers['accept-encoding']
    if (!acceptEncoding) {
      return next()
    }

    // Determine compression method
    const encoding = selectEncoding(acceptEncoding)
    if (!encoding) {
      return next()
    }

    // Store original methods
    const originalWrite = res.write.bind(res)
    const originalEnd = res.end.bind(res)
    const originalSetHeader = res.setHeader.bind(res)

    let compressor: zlib.Gzip | zlib.Deflate | null = null
    let chunks: Buffer[] = []
    let totalLength = 0

    // Override setHeader to capture Content-Length
    res.setHeader = function (name: string, value: any) {
      const lowerName = name.toLowerCase()

      // Don't compress if already has Content-Encoding
      if (lowerName === 'content-encoding') {
        // Disable compression
        res.write = originalWrite
        res.end = originalEnd
        res.setHeader = originalSetHeader
        return originalSetHeader(name, value)
      }

      // Remove Content-Length (we'll calculate it after compression)
      if (lowerName === 'content-length') {
        return res
      }

      return originalSetHeader(name, value)
    }

    // Override write
    res.write = function (chunk: any, ..._args: any[]) {
      if (!chunk) {
        return originalWrite(chunk)
      }

      const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
      chunks.push(buffer)
      totalLength += buffer.length

      return true
    }

    // Override end
    res.end = function (chunk: any) {
      if (chunk) {
        const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
        chunks.push(buffer)
        totalLength += buffer.length
      }

      // Check filter (now that headers are set)
      if (!filter(req, res)) {
        // Don't compress, send as-is
        res.write = originalWrite
        res.end = originalEnd
        res.setHeader = originalSetHeader

        for (const c of chunks) {
          originalWrite(c)
        }
        return originalEnd()
      }

      // Check threshold
      if (totalLength < threshold) {
        // Don't compress, send as-is
        res.write = originalWrite
        res.end = originalEnd
        res.setHeader = originalSetHeader

        for (const c of chunks) {
          originalWrite(c)
        }
        return originalEnd()
      }

      // Compress
      const data = Buffer.concat(chunks)

      // Create compressor
      if (encoding === 'gzip') {
        compressor = zlib.createGzip({ level })
      } else {
        compressor = zlib.createDeflate({ level })
      }

      // Set headers
      originalSetHeader('Content-Encoding', encoding)
      originalSetHeader('Vary', 'Accept-Encoding')

      // Compress and send
      compressor!.on('data', (compressed: Buffer) => {
        originalWrite(compressed)
      })

      compressor!.on('end', () => {
        originalEnd()
      })

      compressor!.end(data)
    }

    next()
  }
}

/**
 * Default filter: compress text-based content types
 */
function defaultFilter(_req: any, res: any): boolean {
  const contentType = res.getHeader('Content-Type')

  if (!contentType) {
    return false
  }

  const type = typeof contentType === 'string' ? contentType : contentType.toString()

  // Compress text-based types
  return (
    type.startsWith('text/') ||
    type.includes('json') ||
    type.includes('javascript') ||
    type.includes('xml')
  )
}

/**
 * Select encoding based on Accept-Encoding header
 */
function selectEncoding(acceptEncoding: string): 'gzip' | 'deflate' | null {
  const encodings = acceptEncoding.toLowerCase()

  if (encodings.includes('gzip')) {
    return 'gzip'
  }

  if (encodings.includes('deflate')) {
    return 'deflate'
  }

  return null
}
