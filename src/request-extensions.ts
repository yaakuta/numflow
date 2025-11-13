import { IncomingMessage } from 'http'
import { Request } from './types/index.js'
import { asInternalSocket } from './utils/type-casting.js'

/**
 * DRY helper: Parse and cache Accept-* headers (Phase C-3)
 * Extracts common parsing logic used by all accepts* methods
 * Reduces code duplication from ~120 lines to ~30 lines
 *
 * @param req - Request object
 * @param headerName - Header name to parse (e.g., 'accept-charset')
 * @param cacheKey - Cache property name (e.g., '_acceptsCharsetsCache')
 * @param resultKey - Result property name in cache (e.g., 'charsets')
 * @returns Parsed and sorted items with name and quality
 */
function parseAndCacheAcceptHeader(
  req: any,
  headerName: string,
  cacheKey: string,
  resultKey: string
): Array<{ name: string; quality: number }> {
  const headerValue = req.headers[headerName]

  if (!headerValue) {
    return []
  }

  const value = Array.isArray(headerValue) ? headerValue[0] : headerValue

  // Check cache first (performance optimization)
  if (!req[cacheKey] || req[cacheKey].header !== value) {
    // Parse header: split by comma, extract quality values, sort by quality
    const parsed = value
      .split(',')
      .map((item: string) => {
        const [name, ...params] = item.trim().split(';')
        const quality = params
          .find((p: string) => p.trim().startsWith('q='))
          ?.split('=')[1]
        return {
          name: name.trim().toLowerCase(),
          quality: quality ? parseFloat(quality) : 1,
        }
      })
      .filter((item: any) => item.quality > 0)
      .sort((a: any, b: any) => b.quality - a.quality)

    // Cache the result for future calls
    req[cacheKey] = { header: value, [resultKey]: parsed }
  }

  return req[cacheKey][resultKey]
}

/**
 * Extend IncomingMessage with Request methods
 * This function adds Express-compatible methods to the request object
 */
export function extendRequest(req: IncomingMessage): Request {
  const extendedReq = req as Request

  /**
   * Preserve original URL (Express compatibility)
   * This value remains unchanged even if req.url is modified by middleware
   */
  extendedReq.originalUrl = req.url

  // Define getter properties

  /**
   * req.path - Request path without query string
   */
  let pathOverride: string | undefined
  Object.defineProperty(extendedReq, 'path', {
    get() {
      // If path was manually set (e.g., by middleware), return that
      if (pathOverride !== undefined) {
        return pathOverride
      }
      const url = this.url || '/'
      const queryIndex = url.indexOf('?')
      return queryIndex === -1 ? url : url.substring(0, queryIndex)
    },
    set(value: string) {
      pathOverride = value
    },
    configurable: true,
    enumerable: true,
  })

  /**
   * req.host / req.hostname - Cached host parsing
   * Performance optimization: Memoization pattern to avoid repeated header parsing
   */
  let cachedHostHeader: string | undefined
  let cachedHost: string | undefined
  let cachedHostname: string | undefined

  /**
   * req.host - Host from Host header (includes port)
   * Differs from req.hostname which excludes port
   * Performance: Uses memoization to cache parsed value
   */
  Object.defineProperty(extendedReq, 'host', {
    get() {
      const currentHost = this.headers['x-forwarded-host'] || this.headers.host

      // Cache invalidation: header changed
      if (currentHost !== cachedHostHeader) {
        cachedHostHeader = currentHost as string | undefined
        cachedHost = undefined
        cachedHostname = undefined
      }

      // Return cached value if available
      if (cachedHost !== undefined) return cachedHost

      // Calculate and cache
      if (!currentHost) return undefined
      const hostStr = Array.isArray(currentHost) ? currentHost[0] : currentHost
      cachedHost = hostStr
      return cachedHost
    },
    configurable: true,
    enumerable: true,
  })

  /**
   * req.hostname - Hostname from Host header (without port)
   * IPv6 support: Correctly handles [::1]:3000 format
   * Performance: Uses memoization to cache parsed value
   */
  Object.defineProperty(extendedReq, 'hostname', {
    get() {
      // Call host getter to leverage cache
      const host = this.host
      if (!host) return undefined

      // Return cached value if available
      if (cachedHostname !== undefined) return cachedHostname

      // IPv6 address handling: [::1]:3000 -> [::1]
      if (host.startsWith('[')) {
        const bracketEnd = host.indexOf(']')
        if (bracketEnd !== -1) {
          cachedHostname = host.substring(0, bracketEnd + 1)
          return cachedHostname
        }
      }

      // IPv4/domain handling: example.com:3000 -> example.com
      const colonIndex = host.lastIndexOf(':')
      cachedHostname = colonIndex === -1 ? host : host.substring(0, colonIndex)
      return cachedHostname
    },
    configurable: true,
    enumerable: true,
  })

  /**
   * req.ip - Client IP address (considers X-Forwarded-For)
   */
  Object.defineProperty(extendedReq, 'ip', {
    get() {
      // Check X-Forwarded-For header first
      const forwarded = this.headers['x-forwarded-for']
      if (forwarded) {
        const forwardedStr = Array.isArray(forwarded) ? forwarded[0] : forwarded
        // Get the first IP in the list
        const ips = forwardedStr.split(',').map((ip: string) => ip.trim())
        return ips[0]
      }

      // Fall back to socket remote address
      const internalSocket = asInternalSocket(this.socket)
      return internalSocket.remoteAddress || undefined
    },
    configurable: true,
    enumerable: true,
  })

  /**
   * req.ips - Array of proxy IPs from X-Forwarded-For
   */
  Object.defineProperty(extendedReq, 'ips', {
    get() {
      const forwarded = this.headers['x-forwarded-for']
      if (!forwarded) return []

      const forwardedStr = Array.isArray(forwarded) ? forwarded[0] : forwarded
      return forwardedStr.split(',').map((ip: string) => ip.trim())
    },
    configurable: true,
    enumerable: true,
  })

  /**
   * req.protocol - Protocol (http or https)
   */
  Object.defineProperty(extendedReq, 'protocol', {
    get() {
      // Check X-Forwarded-Proto header first
      const proto = this.headers['x-forwarded-proto']
      if (proto) {
        const protoStr = Array.isArray(proto) ? proto[0] : proto
        return protoStr.split(',')[0].trim()
      }

      // Check if connection is encrypted
      const internalSocket = asInternalSocket(this.socket)
      return internalSocket.encrypted ? 'https' : 'http'
    },
    configurable: true,
    enumerable: true,
  })

  /**
   * req.secure - True if HTTPS
   */
  Object.defineProperty(extendedReq, 'secure', {
    get() {
      return this.protocol === 'https'
    },
    configurable: true,
    enumerable: true,
  })

  /**
   * req.xhr - True if X-Requested-With is XMLHttpRequest
   */
  Object.defineProperty(extendedReq, 'xhr', {
    get() {
      const val = this.headers['x-requested-with']
      const valStr = Array.isArray(val) ? val[0] : val
      return valStr?.toLowerCase() === 'xmlhttprequest'
    },
    configurable: true,
    enumerable: true,
  })

  /**
   * Get request header value (case-insensitive)
   */
  extendedReq.get = function (name: string): string | undefined {
    const lowerName = name.toLowerCase()

    // Handle special case for 'referer' / 'referrer'
    if (lowerName === 'referer' || lowerName === 'referrer') {
      return (
        (this.headers.referer as string) ||
        (this.headers.referrer as string)
      )
    }

    const value = this.headers[lowerName]
    return Array.isArray(value) ? value[0] : value
  }

  /**
   * Check if request accepts given content type(s)
   * Returns the first matching type or false
   *
   * Performance: Caches parsed Accept header to avoid re-parsing
   */
  extendedReq.accepts = function (...types: string[]): string | false {
    const acceptHeader = this.headers.accept || '*/*'

    // Check cache first (performance optimization)
    if (!(this as any)._acceptsCache || (this as any)._acceptsCache.header !== acceptHeader) {
      // Parse Accept header only once per request
      const acceptedTypes = acceptHeader
        .split(',')
        .map(type => {
          const [mimeType, ...params] = type.trim().split(';')
          const quality = params
            .find(p => p.trim().startsWith('q='))
            ?.split('=')[1]
          return {
            type: mimeType.trim(),
            quality: quality ? parseFloat(quality) : 1,
          }
        })
        .filter(item => item.quality > 0)
        .sort((a, b) => b.quality - a.quality)

      // Cache the parsed result
      ;(this as any)._acceptsCache = { header: acceptHeader, types: acceptedTypes }
    }

    const acceptedTypes = (this as any)._acceptsCache.types

    // Check each requested type
    for (const requestedType of types) {
      for (const accepted of acceptedTypes) {
        if (
          accepted.type === '*/*' ||
          accepted.type === requestedType ||
          (accepted.type.endsWith('/*') &&
            requestedType.startsWith(accepted.type.slice(0, -2)))
        ) {
          return requestedType
        }
      }
    }

    return false
  }

  /**
   * Check if Content-Type matches given type(s)
   * Returns the matching type or false/null
   */
  extendedReq.is = function (...types: string[]): string | false | null {
    const contentType = this.headers['content-type']

    if (!contentType) {
      return null
    }

    // Parse Content-Type (remove charset, etc.)
    const [mimeType] = contentType.split(';').map(s => s.trim())

    // Check each type
    for (const type of types) {
      // Exact match
      if (mimeType === type) {
        return type
      }

      // Wildcard match (e.g., 'application/*')
      if (type.endsWith('/*')) {
        const prefix = type.slice(0, -2)
        if (mimeType.startsWith(prefix)) {
          return type
        }
      }

      // Short form (e.g., 'json' instead of 'application/json')
      if (!type.includes('/')) {
        const commonTypes: Record<string, string[]> = {
          json: ['application/json'],
          html: ['text/html'],
          text: ['text/plain'],
          urlencoded: ['application/x-www-form-urlencoded'],
          multipart: ['multipart/form-data'],
          xml: ['application/xml', 'text/xml'],
        }

        const fullTypes = commonTypes[type] || []
        if (fullTypes.includes(mimeType)) {
          return type
        }
      }
    }

    return false
  }

  /**
   * Check if request accepts given charset(s)
   * Content negotiation
   *
   * Performance: Caches parsed Accept-Charset header to avoid re-parsing (Phase B-1 + C-3)
   *
   * @example
   * req.acceptsCharsets('utf-8')
   * req.acceptsCharsets('utf-8', 'iso-8859-1')
   */
  extendedReq.acceptsCharsets = function (...charsets: string[]): string | false {
    // If no Accept-Charset header, accept all
    if (!this.headers['accept-charset']) {
      return charsets.length > 0 ? charsets[0] : '*'
    }

    // Use common parsing logic (DRY)
    const acceptedCharsets = parseAndCacheAcceptHeader(
      this,
      'accept-charset',
      '_acceptsCharsetsCache',
      'charsets'
    )

    // Check each requested charset
    for (const requestedCharset of charsets) {
      const lower = requestedCharset.toLowerCase()
      for (const accepted of acceptedCharsets) {
        if (accepted.name === '*' || accepted.name === lower) {
          return requestedCharset
        }
      }
    }

    return false
  }

  /**
   * Check if request accepts given encoding(s)
   * Content negotiation
   *
   * Performance: Caches parsed Accept-Encoding header to avoid re-parsing (Phase B-1 + C-3)
   *
   * @example
   * req.acceptsEncodings('gzip')
   * req.acceptsEncodings('gzip', 'deflate')
   */
  extendedReq.acceptsEncodings = function (...encodings: string[]): string | false {
    // If no Accept-Encoding header, accept identity only
    if (!this.headers['accept-encoding']) {
      return encodings.includes('identity') ? 'identity' : false
    }

    // Use common parsing logic (DRY)
    const acceptedEncodings = parseAndCacheAcceptHeader(
      this,
      'accept-encoding',
      '_acceptsEncodingsCache',
      'encodings'
    )

    // Check each requested encoding
    for (const requestedEncoding of encodings) {
      const lower = requestedEncoding.toLowerCase()
      for (const accepted of acceptedEncodings) {
        if (accepted.name === '*' || accepted.name === lower) {
          return requestedEncoding
        }
      }
    }

    return false
  }

  /**
   * Check if request accepts given language(s)
   * Content negotiation
   *
   * Performance: Caches parsed Accept-Language header to avoid re-parsing
   *
   * @example
   * req.acceptsLanguages('en')
   * req.acceptsLanguages('en', 'ko', 'ja')
   */
  extendedReq.acceptsLanguages = function (...languages: string[]): string | false {
    // If no Accept-Language header, accept all
    if (!this.headers['accept-language']) {
      return languages.length > 0 ? languages[0] : '*'
    }

    // Use common parsing logic (DRY)
    const acceptedLanguages = parseAndCacheAcceptHeader(
      this,
      'accept-language',
      '_acceptsLanguagesCache',
      'languages'
    )

    // Check each requested language
    for (const requestedLanguage of languages) {
      const lower = requestedLanguage.toLowerCase()
      for (const accepted of acceptedLanguages) {
        if (accepted.name === '*' || accepted.name === lower) {
          return requestedLanguage
        }
        // Language prefix match (e.g., 'en' matches 'en-US')
        if (accepted.name.startsWith(lower + '-') || lower.startsWith(accepted.name + '-')) {
          return requestedLanguage
        }
      }
    }

    return false
  }

  /**
   * req.baseUrl - Base URL (router mount path)
   * The path pattern where a router is mounted (set by Application/Router)
   */
  extendedReq.baseUrl = ''

  /**
   * req.route - Current route information
   * Contains path and methods for the matched route (set by router during matching)
   */
  extendedReq.route = undefined

  /**
   * req.subdomains - Subdomain array
   * Parses subdomains from hostname (reverse order for Express compatibility)
   *
   * Supports custom offset via app.set('subdomain offset', N)
   */
  Object.defineProperty(extendedReq, 'subdomains', {
    get() {
      const hostname = this.hostname
      if (!hostname) return []

      // Split hostname by dots
      const parts = hostname.split('.')

      // Get offset from app settings (default: 2)
      // Express: app.set('subdomain offset', N)
      const offset = this.app && typeof this.app.get === 'function'
        ? (this.app.get('subdomain offset') ?? 2)
        : 2

      // If only domain (e.g., 'example.com' or 'localhost'), no subdomains
      if (parts.length <= offset) return []

      // Remove TLD parts based on offset
      // For 'v1.api.example.com' with offset=2 → ['v1', 'api', 'example', 'com']
      // Subdomains are everything except the last <offset> parts
      // Express returns subdomains in forward order (left to right)
      // For 'v1.api.example.com', returns ['v1', 'api']
      return parts.slice(0, -offset) // All except last <offset> (domain.tld)
    },
    configurable: true,
    enumerable: true,
  })

  /**
   * req.fresh - Cache freshness indicator
   * True if cache validators indicate resource is fresh
   * Fixed: Uses req.res instead of undefined _res
   */
  Object.defineProperty(extendedReq, 'fresh', {
    get() {
      const method = this.method
      const res = this.res

      // fresh only applies to GET/HEAD requests
      if (method !== 'GET' && method !== 'HEAD') {
        return false
      }

      // Check response status code (must be 2xx or 304)
      const status = res && res.statusCode
      if (!status || (status < 200 || status >= 300) && status !== 304) {
        return false
      }

      // Check ETag
      const noneMatch = this.headers['if-none-match']
      const etag = res && res.getHeader && res.getHeader('ETag')
      if (noneMatch && etag) {
        return noneMatch === etag
      }

      // Check Last-Modified
      const modifiedSince = this.headers['if-modified-since']
      const lastModified = res && res.getHeader && res.getHeader('Last-Modified')
      if (modifiedSince && lastModified) {
        return modifiedSince === lastModified
      }

      // No cache headers present
      return false
    },
    configurable: true,
    enumerable: true,
  })

  /**
   * req.stale - Cache staleness indicator
   * Opposite of req.fresh
   */
  Object.defineProperty(extendedReq, 'stale', {
    get() {
      return !this.fresh
    },
    configurable: true,
    enumerable: true,
  })

  /**
   * Parse Range header
   * Returns array of ranges, -1 for malformed, -2 for unsatisfiable/missing
   *
   * @param size - Size of the resource
   * @param options - Options (combine: boolean)
   * @returns Array of ranges, -1 (malformed), or -2 (unsatisfiable/missing)
   */
  extendedReq.range = function (
    size: number,
    options?: { combine?: boolean }
  ): Array<{ start: number; end: number }> | -1 | -2 {
    const rangeHeader = this.headers.range

    // No Range header
    if (!rangeHeader) {
      return -2
    }

    // Parse Range header (format: "bytes=0-99,200-299")
    const match = rangeHeader.match(/^(\w+)=(.+)$/)
    if (!match) {
      return -1 // Malformed
    }

    const [, unit, rangesStr] = match

    // Only support 'bytes' unit (Express behavior)
    if (unit !== 'bytes') {
      return -1
    }

    // Parse individual ranges
    const ranges: Array<{ start: number; end: number }> = []
    const rangeParts = rangesStr.split(',')

    for (const part of rangeParts) {
      const trimmed = part.trim()

      // Suffix range: "-100" (last 100 bytes)
      if (trimmed.startsWith('-')) {
        const suffix = parseInt(trimmed.substring(1), 10)
        if (isNaN(suffix) || suffix <= 0) {
          return -1 // Malformed
        }
        ranges.push({
          start: Math.max(0, size - suffix),
          end: size - 1,
        })
        continue
      }

      // Regular range: "0-99" or "500-" (from 500 to end)
      const [startStr, endStr] = trimmed.split('-')
      const start = parseInt(startStr, 10)

      if (isNaN(start)) {
        return -1 // Malformed
      }

      let end: number
      if (!endStr) {
        // Open-ended range: "500-"
        end = size - 1
      } else {
        end = parseInt(endStr, 10)
        if (isNaN(end)) {
          return -1 // Malformed
        }
      }

      // Validate range
      if (start < 0 || end < start || start >= size) {
        return -2 // Unsatisfiable
      }

      // Clamp end to size
      end = Math.min(end, size - 1)

      ranges.push({ start, end })
    }

    // Check if any range is valid
    if (ranges.length === 0) {
      return -2 // Unsatisfiable
    }

    // Combine adjacent/overlapping ranges if requested
    if (options?.combine) {
      return combineRanges(ranges)
    }

    return ranges
  }

  return extendedReq
}

/**
 * Helper to combine adjacent/overlapping ranges
 * @private
 */
function combineRanges(
  ranges: Array<{ start: number; end: number }>
): Array<{ start: number; end: number }> {
  if (ranges.length <= 1) return ranges

  // Sort by start position
  const sorted = [...ranges].sort((a, b) => a.start - b.start)

  const combined: Array<{ start: number; end: number }> = [sorted[0]]

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i]
    const last = combined[combined.length - 1]

    // Check if adjacent or overlapping
    if (current.start <= last.end + 1) {
      // Merge ranges
      last.end = Math.max(last.end, current.end)
    } else {
      // Add as separate range
      combined.push(current)
    }
  }

  return combined
}
