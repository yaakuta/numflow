import * as cookie from 'cookie'
import * as crypto from 'crypto'
import { RequestHandler } from './types/index.js'

/**
 * Cookie Parser Options
 * Cookie parsing
 */
export interface CookieParserOptions {
  /**
   * Secret key for signed cookies
   */
  secret?: string | string[]

  /**
   * Decode function for cookie values
   */
  decode?: (val: string) => string
}

/**
 * Cookie parser middleware
 * Parses Cookie header and populates req.cookies and req.signedCookies
 *
 * Express-compatible cookie parsing
 *
 * @param options - Parser options
 * @returns Middleware function
 *
 * @example
 * // JavaScript
 * const cookieParser = require('numflow').cookieParser
 * app.use(cookieParser())
 *
 * @example
 * // With secret for signed cookies
 * app.use(cookieParser('my-secret'))
 */
export function cookieParser(options?: string | CookieParserOptions): RequestHandler {
  let secret: string | string[] | undefined
  let decode: ((val: string) => string) | undefined

  if (typeof options === 'string') {
    secret = options
  } else if (options) {
    secret = options.secret
    decode = options.decode
  }

  return (req: any, _res, next) => {
    // Skip if already parsed
    if (req.cookies) {
      return next()
    }

    // Initialize cookies objects
    req.cookies = {}
    req.signedCookies = {}

    // Get Cookie header
    const cookieHeader = req.headers.cookie

    if (!cookieHeader) {
      return next()
    }

    try {
      // Parse cookies
      const parsedCookies = cookie.parse(cookieHeader, {
        decode: decode || decodeURIComponent,
      })

      // Separate regular and signed cookies
      for (const [name, value] of Object.entries(parsedCookies)) {
        // Skip if value is undefined
        if (value === undefined) {
          continue
        }

        if (name.startsWith('s:')) {
          // Signed cookie
          if (secret !== undefined) {
            const unsignedValue = unsign(value, secret)
            if (unsignedValue !== false) {
              req.signedCookies[name.slice(2)] = unsignedValue
            } else {
              // Invalid signature, add to cookies as-is
              req.cookies[name] = value
            }
          } else {
            // No secret provided, treat as regular cookie
            req.cookies[name] = value
          }
        } else {
          // Regular cookie
          req.cookies[name] = value
        }
      }

      next()
    } catch (err) {
      next(err)
    }
  }
}

/**
 * Unsign a signed cookie value
 * @param val - Signed value (e.g., "value.signature")
 * @param secret - Secret key(s)
 * @returns Unsigned value or false if signature is invalid
 */
function unsign(val: string, secret: string | string[]): string | false {
  if (!val || typeof val !== 'string') {
    return false
  }

  // Signed value format: "value.signature"
  const dotIndex = val.lastIndexOf('.')
  if (dotIndex === -1) {
    return false
  }

  const value = val.slice(0, dotIndex)
  const signature = val.slice(dotIndex + 1)

  // Try each secret
  const secrets = Array.isArray(secret) ? secret : [secret]

  for (const sec of secrets) {
    const expectedSignature = sign(value, sec)
    if (signature === expectedSignature) {
      return value
    }
  }

  return false
}

/**
 * Sign a value with a secret
 * @param val - Value to sign
 * @param secret - Secret key
 * @returns Signature
 */
function sign(val: string, secret: string): string {
  // Simple HMAC-like signing (for demonstration)
  // In production, use crypto.createHmac
  return crypto
    .createHmac('sha256', secret)
    .update(val)
    .digest('base64')
    .replace(/\=+$/, '') // Remove padding
}
