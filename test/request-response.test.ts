/**
 * Request/Response Extension Methods Tests

 */

import { IncomingMessage } from 'http'
import { extendRequest } from '../src/request-extensions'
import { extendResponse } from '../src/response-extensions'
import { EventEmitter } from 'events'

describe('Request Extensions', () => {
  describe('req.path', () => {
    it('should return path only (excluding query string)', () => {
      const req = createMockRequest({}, '/users/123?name=john&age=30')
      const extended = extendRequest(req)

      expect(extended.path).toBe('/users/123')
    })

    it('should return full URL when no query string', () => {
      const req = createMockRequest({}, '/users/123')
      const extended = extendRequest(req)

      expect(extended.path).toBe('/users/123')
    })

    it('should handle root path', () => {
      const req = createMockRequest({}, '/')
      const extended = extendRequest(req)

      expect(extended.path).toBe('/')
    })

    it('should handle empty query string', () => {
      const req = createMockRequest({}, '/users?')
      const extended = extendRequest(req)

      expect(extended.path).toBe('/users')
    })
  })

  describe('req.originalUrl', () => {
    it('should preserve the original URL', () => {
      const req = createMockRequest({}, '/users/123?name=john')
      const extended = extendRequest(req)

      // originalUrl should match the initial req.url
      expect(extended.originalUrl).toBe('/users/123?name=john')
    })

    it('should remain unchanged even if url is modified', () => {
      const req = createMockRequest({}, '/original/path?query=1')
      const extended = extendRequest(req)

      // Store original
      const original = extended.originalUrl

      // Modify req.url (simulating middleware modification)
      extended.url = '/modified/path'

      // originalUrl should remain unchanged
      expect(extended.originalUrl).toBe(original)
      expect(extended.originalUrl).toBe('/original/path?query=1')
      expect(extended.url).toBe('/modified/path')
    })

    it('should handle root path', () => {
      const req = createMockRequest({}, '/')
      const extended = extendRequest(req)

      expect(extended.originalUrl).toBe('/')
    })

    it('should handle complex URLs', () => {
      const req = createMockRequest({}, '/api/v1/users/123?filter=active&sort=name#section')
      const extended = extendRequest(req)

      expect(extended.originalUrl).toBe('/api/v1/users/123?filter=active&sort=name#section')
    })

    it('should handle empty query and hash', () => {
      const req = createMockRequest({}, '/path?')
      const extended = extendRequest(req)

      expect(extended.originalUrl).toBe('/path?')
    })
  })

  describe('req.hostname', () => {
    it('should get hostname from Host header', () => {
      const req = createMockRequest({ host: 'example.com' })
      const extended = extendRequest(req)

      expect(extended.hostname).toBe('example.com')
    })

    it('should remove port from Host header', () => {
      const req = createMockRequest({ host: 'example.com:3000' })
      const extended = extendRequest(req)

      expect(extended.hostname).toBe('example.com')
    })

    it('should prioritize X-Forwarded-Host header', () => {
      const req = createMockRequest({
        host: 'example.com',
        'x-forwarded-host': 'proxy.example.com',
      })
      const extended = extendRequest(req)

      expect(extended.hostname).toBe('proxy.example.com')
    })

    it('should return undefined when Host header is missing', () => {
      const req = createMockRequest({})
      const extended = extendRequest(req)

      expect(extended.hostname).toBeUndefined()
    })

    // IPv6 Support Tests - Bug Fix
    it('should handle IPv6 address without port', () => {
      const req = createMockRequest({ host: '[::1]' })
      const extended = extendRequest(req)

      expect(extended.hostname).toBe('[::1]')
    })

    it('should handle IPv6 address with port (bug test)', () => {
      const req = createMockRequest({ host: '[::1]:3000' })
      const extended = extendRequest(req)

      // Current implementation is WRONG: returns "[::1" instead of "[::1]"
      // This test will FAIL until we fix the implementation
      expect(extended.hostname).toBe('[::1]')
    })

    it('should handle IPv6 full address with port', () => {
      const req = createMockRequest({ host: '[2001:db8::1]:8080' })
      const extended = extendRequest(req)

      expect(extended.hostname).toBe('[2001:db8::1]')
    })

    it('should handle IPv6 loopback with port', () => {
      const req = createMockRequest({ host: '[::ffff:127.0.0.1]:3000' })
      const extended = extendRequest(req)

      expect(extended.hostname).toBe('[::ffff:127.0.0.1]')
    })
  })

  describe('req.ip', () => {
    it('should get first IP from X-Forwarded-For header', () => {
      const req = createMockRequest({
        'x-forwarded-for': '192.168.1.1, 10.0.0.1, 172.16.0.1',
      })
      const extended = extendRequest(req)

      expect(extended.ip).toBe('192.168.1.1')
    })

    it('should use socket.remoteAddress when X-Forwarded-For header is missing', () => {
      const req = createMockRequest({})
      ;(req as any).socket = { remoteAddress: '127.0.0.1' }
      const extended = extendRequest(req)

      expect(extended.ip).toBe('127.0.0.1')
    })

    it('should return it when X-Forwarded-For has only one IP', () => {
      const req = createMockRequest({
        'x-forwarded-for': '192.168.1.1',
      })
      const extended = extendRequest(req)

      expect(extended.ip).toBe('192.168.1.1')
    })
  })

  describe('req.ips', () => {
    it('should parse X-Forwarded-For header as array', () => {
      const req = createMockRequest({
        'x-forwarded-for': '192.168.1.1, 10.0.0.1, 172.16.0.1',
      })
      const extended = extendRequest(req)

      expect(extended.ips).toEqual(['192.168.1.1', '10.0.0.1', '172.16.0.1'])
    })

    it('should return empty array when X-Forwarded-For header is missing', () => {
      const req = createMockRequest({})
      const extended = extendRequest(req)

      expect(extended.ips).toEqual([])
    })

    it('should trim whitespace', () => {
      const req = createMockRequest({
        'x-forwarded-for': '  192.168.1.1  ,  10.0.0.1  ',
      })
      const extended = extendRequest(req)

      expect(extended.ips).toEqual(['192.168.1.1', '10.0.0.1'])
    })
  })

  describe('req.protocol', () => {
    it('should prioritize X-Forwarded-Proto header', () => {
      const req = createMockRequest({
        'x-forwarded-proto': 'https',
      })
      const extended = extendRequest(req)

      expect(extended.protocol).toBe('https')
    })

    it('should return https when socket.encrypted is true', () => {
      const req = createMockRequest({})
      ;(req as any).socket = { encrypted: true }
      const extended = extendRequest(req)

      expect(extended.protocol).toBe('https')
    })

    it('should return http when socket.encrypted is false', () => {
      const req = createMockRequest({})
      ;(req as any).socket = { encrypted: false }
      const extended = extendRequest(req)

      expect(extended.protocol).toBe('http')
    })

    it('should return first protocol when multiple protocols exist', () => {
      const req = createMockRequest({
        'x-forwarded-proto': 'https, http',
      })
      const extended = extendRequest(req)

      expect(extended.protocol).toBe('https')
    })
  })

  describe('req.secure', () => {
    it('should return true when protocol is https', () => {
      const req = createMockRequest({
        'x-forwarded-proto': 'https',
      })
      const extended = extendRequest(req)

      expect(extended.secure).toBe(true)
    })

    it('should return false when protocol is http', () => {
      const req = createMockRequest({})
      ;(req as any).socket = { encrypted: false }
      const extended = extendRequest(req)

      expect(extended.secure).toBe(false)
    })
  })

  describe('req.xhr', () => {
    it('should return true when X-Requested-With is XMLHttpRequest', () => {
      const req = createMockRequest({
        'x-requested-with': 'XMLHttpRequest',
      })
      const extended = extendRequest(req)

      expect(extended.xhr).toBe(true)
    })

    it('should return false when X-Requested-With is different value', () => {
      const req = createMockRequest({
        'x-requested-with': 'Other',
      })
      const extended = extendRequest(req)

      expect(extended.xhr).toBe(false)
    })

    it('should return false when X-Requested-With is missing', () => {
      const req = createMockRequest({})
      const extended = extendRequest(req)

      expect(extended.xhr).toBe(false)
    })

    it('should be case insensitive', () => {
      const req = createMockRequest({
        'x-requested-with': 'xmlhttprequest',
      })
      const extended = extendRequest(req)

      expect(extended.xhr).toBe(true)
    })
  })

  describe('req.get()', () => {
    it('should get header value correctly', () => {
      const req = createMockRequest({
        'content-type': 'application/json',
        'user-agent': 'test-agent',
      })

      const extended = extendRequest(req)

      expect(extended.get('content-type')).toBe('application/json')
      expect(extended.get('user-agent')).toBe('test-agent')
    })

    it('should be case insensitive', () => {
      // Node.js HTTP server automatically converts headers to lowercase
      const req = createMockRequest({
        'content-type': 'application/json',
      })

      const extended = extendRequest(req)

      expect(extended.get('content-type')).toBe('application/json')
      expect(extended.get('Content-Type')).toBe('application/json')
      expect(extended.get('CONTENT-TYPE')).toBe('application/json')
    })

    it('should support both referer and referrer', () => {
      const req = createMockRequest({
        'referer': 'https://example.com',
      })

      const extended = extendRequest(req)

      expect(extended.get('referer')).toBe('https://example.com')
      expect(extended.get('referrer')).toBe('https://example.com')
    })

    it('should return undefined for non-existent header', () => {
      const req = createMockRequest({})

      const extended = extendRequest(req)

      expect(extended.get('x-custom-header')).toBeUndefined()
    })

    it('should return first value of array header', () => {
      const req = createMockRequest({
        'accept': ['application/json', 'text/html'],
      })

      const extended = extendRequest(req)

      expect(extended.get('accept')).toBe('application/json')
    })
  })

  describe('req.accepts()', () => {
    it('should return matching type from Accept header', () => {
      const req = createMockRequest({
        'accept': 'application/json, text/html',
      })

      const extended = extendRequest(req)

      expect(extended.accepts('application/json')).toBe('application/json')
      expect(extended.accepts('text/html')).toBe('text/html')
    })

    it('should return false for type not in Accept header', () => {
      const req = createMockRequest({
        'accept': 'application/json',
      })

      const extended = extendRequest(req)

      expect(extended.accepts('text/html')).toBe(false)
    })

    it('should accept all types with wildcard (*/*) Accept', () => {
      const req = createMockRequest({
        'accept': '*/*',
      })

      const extended = extendRequest(req)

      expect(extended.accepts('application/json')).toBe('application/json')
      expect(extended.accepts('text/html')).toBe('text/html')
    })

    it('should support partial wildcard (application/*)', () => {
      const req = createMockRequest({
        'accept': 'application/*',
      })

      const extended = extendRequest(req)

      expect(extended.accepts('application/json')).toBe('application/json')
      expect(extended.accepts('application/xml')).toBe('application/xml')
      expect(extended.accepts('text/html')).toBe(false)
    })

    it('should consider quality values', () => {
      const req = createMockRequest({
        'accept': 'application/json;q=0.5, text/html;q=1.0',
      })

      const extended = extendRequest(req)

      // Higher quality first
      expect(extended.accepts('text/html', 'application/json')).toBe('text/html')
    })

    it('should return first match from multiple types', () => {
      const req = createMockRequest({
        'accept': 'application/json, text/html',
      })

      const extended = extendRequest(req)

      expect(extended.accepts('text/xml', 'application/json', 'text/html')).toBe('application/json')
    })

    it('should treat missing Accept header as */*', () => {
      const req = createMockRequest({})

      const extended = extendRequest(req)

      expect(extended.accepts('application/json')).toBe('application/json')
    })
  })

  describe('req.acceptsCharsets()', () => {
    it('should return matching charset from Accept-Charset header', () => {
      const req = createMockRequest({
        'accept-charset': 'utf-8, iso-8859-1;q=0.5',
      })

      const extended = extendRequest(req)

      expect(extended.acceptsCharsets('utf-8')).toBe('utf-8')
      expect(extended.acceptsCharsets('iso-8859-1')).toBe('iso-8859-1')
    })

    it('should treat missing Accept-Charset header as */*', () => {
      const req = createMockRequest({})

      const extended = extendRequest(req)

      expect(extended.acceptsCharsets('utf-8')).toBe('utf-8')
      expect(extended.acceptsCharsets('iso-8859-1')).toBe('iso-8859-1')
    })

    it('should return false for charset not in Accept-Charset', () => {
      const req = createMockRequest({
        'accept-charset': 'utf-8',
      })

      const extended = extendRequest(req)

      expect(extended.acceptsCharsets('iso-8859-1')).toBe(false)
    })
  })

  describe('req.acceptsEncodings()', () => {
    it('should return matching encoding from Accept-Encoding header', () => {
      const req = createMockRequest({
        'accept-encoding': 'gzip, deflate, br',
      })

      const extended = extendRequest(req)

      expect(extended.acceptsEncodings('gzip')).toBe('gzip')
      expect(extended.acceptsEncodings('deflate')).toBe('deflate')
      expect(extended.acceptsEncodings('br')).toBe('br')
    })

    it('should only allow identity when Accept-Encoding header is missing', () => {
      const req = createMockRequest({})

      const extended = extendRequest(req)

      expect(extended.acceptsEncodings('identity')).toBe('identity')
      expect(extended.acceptsEncodings('gzip')).toBe(false)
    })

    it('should return false for encoding not in Accept-Encoding', () => {
      const req = createMockRequest({
        'accept-encoding': 'gzip',
      })

      const extended = extendRequest(req)

      expect(extended.acceptsEncodings('deflate')).toBe(false)
    })
  })

  describe('req.acceptsLanguages()', () => {
    it('should return matching language from Accept-Language header', () => {
      const req = createMockRequest({
        'accept-language': 'ko-KR, en-US;q=0.9, en;q=0.8',
      })

      const extended = extendRequest(req)

      expect(extended.acceptsLanguages('ko-KR')).toBe('ko-KR')
      expect(extended.acceptsLanguages('en-US')).toBe('en-US')
      expect(extended.acceptsLanguages('en')).toBe('en')
    })

    it('should treat missing Accept-Language header as *', () => {
      const req = createMockRequest({})

      const extended = extendRequest(req)

      expect(extended.acceptsLanguages('ko')).toBe('ko')
      expect(extended.acceptsLanguages('en')).toBe('en')
    })

    it('should return false for language not in Accept-Language', () => {
      const req = createMockRequest({
        'accept-language': 'ko',
      })

      const extended = extendRequest(req)

      expect(extended.acceptsLanguages('en')).toBe(false)
    })
  })

  describe('req.is()', () => {
    it('should return type when Content-Type matches', () => {
      const req = createMockRequest({
        'content-type': 'application/json',
      })

      const extended = extendRequest(req)

      expect(extended.is('application/json')).toBe('application/json')
    })

    it('should return false when Content-Type does not match', () => {
      const req = createMockRequest({
        'content-type': 'application/json',
      })

      const extended = extendRequest(req)

      expect(extended.is('text/html')).toBe(false)
    })

    it('should return null when Content-Type is missing', () => {
      const req = createMockRequest({})

      const extended = extendRequest(req)

      expect(extended.is('application/json')).toBeNull()
    })

    it('should support wildcards', () => {
      const req = createMockRequest({
        'content-type': 'application/json',
      })

      const extended = extendRequest(req)

      expect(extended.is('application/*')).toBe('application/*')
    })

    it('should support short forms (json, html, text, etc.)', () => {
      const req1 = createMockRequest({ 'content-type': 'application/json' })
      const req2 = createMockRequest({ 'content-type': 'text/html' })
      const req3 = createMockRequest({ 'content-type': 'text/plain' })

      expect(extendRequest(req1).is('json')).toBe('json')
      expect(extendRequest(req2).is('html')).toBe('html')
      expect(extendRequest(req3).is('text')).toBe('text')
    })

    it('should handle Content-Type with charset', () => {
      const req = createMockRequest({
        'content-type': 'application/json; charset=utf-8',
      })

      const extended = extendRequest(req)

      expect(extended.is('application/json')).toBe('application/json')
    })

    it('should check multiple types', () => {
      const req = createMockRequest({
        'content-type': 'application/json',
      })

      const extended = extendRequest(req)

      expect(extended.is('text/html', 'application/json', 'text/plain')).toBe('application/json')
    })

    it('should support urlencoded short form', () => {
      const req = createMockRequest({
        'content-type': 'application/x-www-form-urlencoded',
      })

      const extended = extendRequest(req)

      expect(extended.is('urlencoded')).toBe('urlencoded')
    })
  })

  describe('req.app', () => {
    it('should have app property', () => {
      const req = createMockRequest({})
      const extended = extendRequest(req)

      // Note: app is set by Application.setupRequest(), not by extendRequest()
      // This test verifies the property exists after being set
      const mockApp = {
        get: (key: string) => key === 'port' ? 3000 : undefined,
        set: (_key: string, _value: any) => {},
      }

      ;(extended as any).app = mockApp

      expect(extended.app).toBeDefined()
      expect(extended.app).toBe(mockApp)
    })

    it('should allow accessing app settings', () => {
      const req = createMockRequest({})
      const extended = extendRequest(req)

      // Mock application instance
      const mockApp = {
        get: (key: string) => {
          if (key === 'view engine') return 'ejs'
          if (key === 'port') return 3000
          if (key === 'env') return 'test'
          return undefined
        },
      }

      ;(extended as any).app = mockApp

      // Access app settings through req.app
      expect(extended.app.get('view engine')).toBe('ejs')
      expect(extended.app.get('port')).toBe(3000)
      expect(extended.app.get('env')).toBe('test')
    })

    it('should be undefined if not set', () => {
      const req = createMockRequest({})
      const extended = extendRequest(req)

      // Before setupRequest() is called, app should be undefined
      expect(extended.app).toBeUndefined()
    })
  })
})

describe('Response Extensions', () => {
  describe('res.status()', () => {
    it('should set status code', () => {
      const res = createMockResponse()
      const extended = extendResponse(res)

      extended.status(404)

      expect(res.statusCode).toBe(404)
    })

    it('should support chaining', () => {
      const res = createMockResponse()
      const extended = extendResponse(res)

      const result = extended.status(404)

      expect(result).toBe(extended)
    })

    it('should set various status codes', () => {
      const res = createMockResponse()
      const extended = extendResponse(res)

      extended.status(200)
      expect(res.statusCode).toBe(200)

      extended.status(201)
      expect(res.statusCode).toBe(201)

      extended.status(400)
      expect(res.statusCode).toBe(400)

      extended.status(500)
      expect(res.statusCode).toBe(500)
    })
  })

  describe('res.send()', () => {
    it('should send string', () => {
      const res = createMockResponse()
      const extended = extendResponse(res)

      extended.send('Hello World')

      expect(res.getHeader('Content-Type')).toBe('text/plain; charset=utf-8')
      expect(res._body).toBe('Hello World')
      expect(res._ended).toBe(true)
    })

    it('should send HTML string as text/html', () => {
      const res = createMockResponse()
      const extended = extendResponse(res)

      extended.send('<html><body>Hello</body></html>')

      expect(res.getHeader('Content-Type')).toBe('text/html; charset=utf-8')
    })

    it('should send object as JSON', () => {
      const res = createMockResponse()
      const extended = extendResponse(res)

      extended.send({ name: 'John', age: 30 })

      expect(res.getHeader('Content-Type')).toBe('application/json; charset=utf-8')
      expect(res._body).toBe(JSON.stringify({ name: 'John', age: 30 }))
    })

    it('should send array as JSON', () => {
      const res = createMockResponse()
      const extended = extendResponse(res)

      extended.send([1, 2, 3, 4, 5])

      expect(res.getHeader('Content-Type')).toBe('application/json; charset=utf-8')
      expect(res._body).toBe(JSON.stringify([1, 2, 3, 4, 5]))
    })

    it('should send Buffer', () => {
      const res = createMockResponse()
      const extended = extendResponse(res)

      const buffer = Buffer.from('test data')
      extended.send(buffer)

      expect(res.getHeader('Content-Type')).toBe('application/octet-stream')
      expect(res._body).toBe(buffer)
    })

    it('should send number', () => {
      const res = createMockResponse()
      const extended = extendResponse(res)

      extended.send(123)

      expect(res.getHeader('Content-Type')).toBe('text/plain; charset=utf-8')
      expect(res._body).toBe('123')
    })

    it('should send boolean', () => {
      const res = createMockResponse()
      const extended = extendResponse(res)

      extended.send(true)

      expect(res.getHeader('Content-Type')).toBe('text/plain; charset=utf-8')
      expect(res._body).toBe('true')
    })

    it('should send empty response for undefined', () => {
      const res = createMockResponse()
      const extended = extendResponse(res)

      extended.send(undefined)

      expect(res.getHeader('Content-Length')).toBe('0')
      expect(res._ended).toBe(true)
    })

    it('should send empty response for null', () => {
      const res = createMockResponse()
      const extended = extendResponse(res)

      extended.send(null)

      expect(res.getHeader('Content-Length')).toBe('0')
      expect(res._ended).toBe(true)
    })

    it('should set Content-Length', () => {
      const res = createMockResponse()
      const extended = extendResponse(res)

      extended.send('Hello')

      expect(res.getHeader('Content-Length')).toBe('5')
    })
  })

  describe('res.json()', () => {
    it('should send object as JSON', () => {
      const res = createMockResponse()
      const extended = extendResponse(res)

      extended.json({ name: 'John', age: 30 })

      expect(res.getHeader('Content-Type')).toBe('application/json; charset=utf-8')
      expect(res._body).toBe(JSON.stringify({ name: 'John', age: 30 }))
      expect(res._ended).toBe(true)
    })

    it('should send array as JSON', () => {
      const res = createMockResponse()
      const extended = extendResponse(res)

      extended.json([1, 2, 3])

      expect(res.getHeader('Content-Type')).toBe('application/json; charset=utf-8')
      expect(res._body).toBe('[1,2,3]')
    })

    it('should handle nested objects', () => {
      const res = createMockResponse()
      const extended = extendResponse(res)

      extended.json({
        user: {
          name: 'John',
          address: {
            city: 'Seoul',
          },
        },
      })

      const parsed = JSON.parse(res._body)
      expect(parsed.user.name).toBe('John')
      expect(parsed.user.address.city).toBe('Seoul')
    })

    it('should set Content-Length', () => {
      const res = createMockResponse()
      const extended = extendResponse(res)

      const json = JSON.stringify({ name: 'John' })
      extended.json({ name: 'John' })

      expect(res.getHeader('Content-Length')).toBe(Buffer.byteLength(json).toString())
    })
  })

  describe('res.redirect()', () => {
    it('should send 302 redirect by default', () => {
      const res = createMockResponse()
      const extended = extendResponse(res)

      extended.redirect('https://example.com')

      expect(res.statusCode).toBe(302)
      expect(res.getHeader('Location')).toBe('https://example.com')
      expect(res._ended).toBe(true)
    })

    it('should support custom status code', () => {
      const res = createMockResponse()
      const extended = extendResponse(res)

      extended.redirect(301, 'https://example.com')

      expect(res.statusCode).toBe(301)
      expect(res.getHeader('Location')).toBe('https://example.com')
    })

    it('should support various redirect codes (301, 302, 303, 307, 308)', () => {
      const testCodes = [301, 302, 303, 307, 308]

      for (const code of testCodes) {
        const res = createMockResponse()
        const extended = extendResponse(res)

        extended.redirect(code, 'https://example.com')

        expect(res.statusCode).toBe(code)
      }
    })

    it('should replace invalid status code with 302', () => {
      const res = createMockResponse()
      const extended = extendResponse(res)

      extended.redirect(200, 'https://example.com')

      expect(res.statusCode).toBe(302)
    })

    it('should support relative path redirect', () => {
      const res = createMockResponse()
      const extended = extendResponse(res)

      extended.redirect('/users/123')

      expect(res.statusCode).toBe(302)
      expect(res.getHeader('Location')).toBe('/users/123')
    })

    it('should set Content-Length to 0', () => {
      const res = createMockResponse()
      const extended = extendResponse(res)

      extended.redirect('https://example.com')

      expect(res.getHeader('Content-Length')).toBe('0')
    })
  })

  describe('Chaining', () => {
    it('should chain status() and send()', () => {
      const res = createMockResponse()
      const extended = extendResponse(res)

      extended.status(404).send('Not Found')

      expect(res.statusCode).toBe(404)
      expect(res._body).toBe('Not Found')
    })

    it('should use status() and json() together', () => {
      const res = createMockResponse()
      const extended = extendResponse(res)

      extended.status(201)
      extended.json({ success: true })

      expect(res.statusCode).toBe(201)
      expect(res._body).toBe(JSON.stringify({ success: true }))
    })
  })

  describe('res.sendStatus()', () => {
    it('should send status code and default message', () => {
      const res = createMockResponse()
      const extended = extendResponse(res)

      extended.sendStatus(404)

      expect(res.statusCode).toBe(404)
      expect(res._body).toBe('Not Found')
      expect(res.getHeader('Content-Type')).toBe('text/plain; charset=utf-8')
      expect(res._ended).toBe(true)
    })

    it('should support various status codes', () => {
      const testCases = [
        { code: 200, message: 'OK' },
        { code: 201, message: 'Created' },
        { code: 400, message: 'Bad Request' },
        { code: 401, message: 'Unauthorized' },
        { code: 403, message: 'Forbidden' },
        { code: 404, message: 'Not Found' },
        { code: 500, message: 'Internal Server Error' },
      ]

      for (const { code, message } of testCases) {
        const res = createMockResponse()
        const extended = extendResponse(res)

        extended.sendStatus(code)

        expect(res.statusCode).toBe(code)
        expect(res._body).toBe(message)
      }
    })
  })

  describe('res.set() / res.header()', () => {
    it('should set single header', () => {
      const res = createMockResponse()
      const extended = extendResponse(res)

      extended.set('Content-Type', 'application/json')

      expect(res.getHeader('Content-Type')).toBe('application/json')
    })

    it('should set multiple headers at once', () => {
      const res = createMockResponse()
      const extended = extendResponse(res)

      extended.set({
        'Content-Type': 'application/json',
        'X-Custom-Header': 'custom-value',
      })

      expect(res.getHeader('Content-Type')).toBe('application/json')
      expect(res.getHeader('X-Custom-Header')).toBe('custom-value')
    })

    it('should support chaining', () => {
      const res = createMockResponse()
      const extended = extendResponse(res)

      const result = extended.set('Content-Type', 'application/json')

      expect(result).toBe(extended)
    })

    it('should have header() as alias of set()', () => {
      const res = createMockResponse()
      const extended = extendResponse(res)

      extended.header('X-Test', 'test-value')

      expect(res.getHeader('X-Test')).toBe('test-value')
    })
  })

  describe('res.get()', () => {
    it('should get header value', () => {
      const res = createMockResponse()
      const extended = extendResponse(res)

      extended.set('Content-Type', 'application/json')

      expect(extended.get('Content-Type')).toBe('application/json')
    })

    it('should return undefined for non-existent header', () => {
      const res = createMockResponse()
      const extended = extendResponse(res)

      expect(extended.get('X-Nonexistent')).toBeUndefined()
    })
  })

  describe('res.append()', () => {
    it('should append value to header', () => {
      const res = createMockResponse()
      const extended = extendResponse(res)

      extended.append('Set-Cookie', 'foo=bar')
      extended.append('Set-Cookie', 'baz=qux')

      const cookies = res.getHeader('Set-Cookie')
      expect(Array.isArray(cookies)).toBe(true)
      expect(cookies).toContain('foo=bar')
      expect(cookies).toContain('baz=qux')
    })

    it('should create new header if not exists', () => {
      const res = createMockResponse()
      const extended = extendResponse(res)

      extended.append('X-Custom', 'value1')

      expect(res.getHeader('X-Custom')).toBe('value1')
    })

    it('should support chaining', () => {
      const res = createMockResponse()
      const extended = extendResponse(res)

      const result = extended.append('X-Test', 'value')

      expect(result).toBe(extended)
    })
  })

  describe('res.type()', () => {
    it('should set Content-Type', () => {
      const res = createMockResponse()
      const extended = extendResponse(res)

      extended.type('application/json')

      expect(res.getHeader('Content-Type')).toBe('application/json; charset=utf-8')
    })

    it('should convert extension to MIME type', () => {
      const testCases = [
        { ext: 'html', mime: 'text/html' },
        { ext: 'json', mime: 'application/json' },
        { ext: 'xml', mime: 'application/xml' },
        { ext: 'txt', mime: 'text/plain' },
        { ext: 'css', mime: 'text/css' },
        { ext: 'js', mime: 'application/javascript' },
        { ext: 'png', mime: 'image/png' },
        { ext: 'jpg', mime: 'image/jpeg' },
      ]

      for (const { ext, mime } of testCases) {
        const res = createMockResponse()
        const extended = extendResponse(res)

        extended.type(ext)

        expect(res.getHeader('Content-Type')).toMatch(mime)
      }
    })

    it('should add charset for text types', () => {
      const res = createMockResponse()
      const extended = extendResponse(res)

      extended.type('text/html')

      expect(res.getHeader('Content-Type')).toBe('text/html; charset=utf-8')
    })

    it('should not add charset for image types', () => {
      const res = createMockResponse()
      const extended = extendResponse(res)

      extended.type('image/png')

      expect(res.getHeader('Content-Type')).toBe('image/png')
    })

    it('should support chaining', () => {
      const res = createMockResponse()
      const extended = extendResponse(res)

      const result = extended.type('json')

      expect(result).toBe(extended)
    })
  })

  describe('res.location()', () => {
    it('should set Location header', () => {
      const res = createMockResponse()
      const extended = extendResponse(res)

      extended.location('https://example.com')

      expect(res.getHeader('Location')).toBe('https://example.com')
    })

    it('should support relative path', () => {
      const res = createMockResponse()
      const extended = extendResponse(res)

      extended.location('/users/123')

      expect(res.getHeader('Location')).toBe('/users/123')
    })

    it('should support chaining', () => {
      const res = createMockResponse()
      const extended = extendResponse(res)

      const result = extended.location('/')

      expect(result).toBe(extended)
    })
  })

  describe('res.cookie()', () => {
    it('should set cookie', () => {
      const res = createMockResponse()
      const extended = extendResponse(res)

      extended.cookie('name', 'value')

      const cookie = res.getHeader('Set-Cookie')
      expect(cookie).toContain('name=value')
      expect(cookie).toContain('Path=/')
    })

    it('should support cookie options', () => {
      const res = createMockResponse()
      const extended = extendResponse(res)

      extended.cookie('session', 'abc123', {
        httpOnly: true,
        secure: true,
        maxAge: 3600000,
      })

      const cookie = res.getHeader('Set-Cookie')
      expect(cookie).toContain('session=abc123')
      expect(cookie).toContain('HttpOnly')
      expect(cookie).toContain('Secure')
      expect(cookie).toContain('Max-Age=3600')
    })

    it('should set multiple cookies', () => {
      const res = createMockResponse()
      const extended = extendResponse(res)

      extended.cookie('cookie1', 'value1')
      extended.cookie('cookie2', 'value2')

      const cookies = res.getHeader('Set-Cookie')
      expect(Array.isArray(cookies)).toBe(true)
      expect(cookies).toHaveLength(2)
    })

    it('should support chaining', () => {
      const res = createMockResponse()
      const extended = extendResponse(res)

      const result = extended.cookie('name', 'value')

      expect(result).toBe(extended)
    })
  })

  describe('res.clearCookie()', () => {
    it('should clear cookie', () => {
      const res = createMockResponse()
      const extended = extendResponse(res)

      extended.clearCookie('session')

      const cookie = res.getHeader('Set-Cookie')
      expect(cookie).toContain('session=')
      expect(cookie).toContain('Expires=')
    })

    it('should pass cookie options', () => {
      const res = createMockResponse()
      const extended = extendResponse(res)

      extended.clearCookie('session', { path: '/admin' })

      const cookie = res.getHeader('Set-Cookie')
      expect(cookie).toContain('Path=/admin')
    })

    it('should support chaining', () => {
      const res = createMockResponse()
      const extended = extendResponse(res)

      const result = extended.clearCookie('name')

      expect(result).toBe(extended)
    })
  })

  describe('res.attachment()', () => {
    it('should set Content-Disposition to attachment', () => {
      const res = createMockResponse()
      const extended = extendResponse(res)

      extended.attachment()

      expect(res.getHeader('Content-Disposition')).toBe('attachment')
    })

    it('should set Content-Disposition with filename', () => {
      const res = createMockResponse()
      const extended = extendResponse(res)

      extended.attachment('report.pdf')

      const header = res.getHeader('Content-Disposition')
      expect(header).toContain('attachment')
      expect(header).toContain('filename="report.pdf"')
    })

    it('should encode special characters in filename', () => {
      const res = createMockResponse()
      const extended = extendResponse(res)

      extended.attachment('файл.txt') // Cyrillic characters

      const header = res.getHeader('Content-Disposition')
      expect(header).toContain('attachment')
      expect(header).toContain('filename=')
    })

    it('should set Content-Type based on file extension', () => {
      const res = createMockResponse()
      const extended = extendResponse(res)

      extended.attachment('document.pdf')

      expect(res.getHeader('Content-Type')).toBe('application/pdf')
    })

    it('should support chaining', () => {
      const res = createMockResponse()
      const extended = extendResponse(res)

      const result = extended.attachment('file.txt')

      expect(result).toBe(extended)
    })

    it('should work without filename for streaming', () => {
      const res = createMockResponse()
      const extended = extendResponse(res)

      const result = extended.attachment()

      expect(res.getHeader('Content-Disposition')).toBe('attachment')
      expect(result).toBe(extended)
    })

    // RFC 6266 compliance tests (Phase C-2)
    it('should use simple filename for ASCII-only filenames (RFC 6266)', () => {
      const res = createMockResponse()
      const extended = extendResponse(res)

      extended.attachment('report.pdf')

      const header = res.getHeader('Content-Disposition') as string
      // ASCII filename should use simple format: filename="report.pdf"
      expect(header).toBe('attachment; filename="report.pdf"')
      // Should NOT include filename* for ASCII-only
      expect(header).not.toContain('filename*')
    })

    it('should use RFC 5987 encoding for non-ASCII filenames (RFC 6266)', () => {
      const res = createMockResponse()
      const extended = extendResponse(res)

      extended.attachment('한글.txt') // Korean characters

      const header = res.getHeader('Content-Disposition') as string
      // Non-ASCII should use filename*=UTF-8''...
      expect(header).toContain('filename*=UTF-8\'\'')
      // Should include percent-encoded UTF-8
      expect(header).toContain('%ED%95%9C%EA%B8%80') // "한글" in percent-encoded UTF-8
    })

    it('should provide ASCII fallback for non-ASCII filenames (RFC 6266)', () => {
      const res = createMockResponse()
      const extended = extendResponse(res)

      extended.attachment('документ.pdf') // Cyrillic "document"

      const header = res.getHeader('Content-Disposition') as string
      // Should include both filename (ASCII fallback) and filename* (UTF-8)
      expect(header).toContain('filename=')
      expect(header).toContain('filename*=UTF-8\'\'')
    })

    it('should handle mixed ASCII and non-ASCII characters correctly (RFC 6266)', () => {
      const res = createMockResponse()
      const extended = extendResponse(res)

      extended.attachment('report_한글_2024.pdf')

      const header = res.getHeader('Content-Disposition') as string
      // Mixed case should use filename* for UTF-8 encoding
      expect(header).toContain('filename*=UTF-8\'\'')
      expect(header).toContain('report')
      expect(header).toContain('%ED%95%9C%EA%B8%80') // "한글"
      expect(header).toContain('2024')
    })
  })

  describe('res.render()', () => {
    it('should render EJS template', async () => {
      const res = createMockResponse()
      const extended = extendResponse(res)

      // Mock app with settings
      ;(extended as any).app = {
        get: (key: string) => {
          if (key === 'view engine') return 'ejs'
          if (key === 'views') return './test/views'
          return undefined
        },
      }

      await extended.render('index', {
        title: 'Test Page',
        message: 'Hello from EJS',
        user: { name: 'John' },
      })

      expect(res.getHeader('Content-Type')).toBe('text/html; charset=utf-8')
      expect(res._body).toContain('<title>Test Page</title>')
      expect(res._body).toContain('<h1>Hello from EJS</h1>')
      expect(res._body).toContain('Welcome, John!')
      expect(res._ended).toBe(true)
    })

    it('should render Pug template', async () => {
      const res = createMockResponse()
      const extended = extendResponse(res)

      ;(extended as any).app = {
        get: (key: string) => {
          if (key === 'view engine') return 'pug'
          if (key === 'views') return './test/views'
          return undefined
        },
      }

      await extended.render('index', {
        title: 'Test Page',
        message: 'Hello from Pug',
        user: { name: 'Jane' },
      })

      expect(res.getHeader('Content-Type')).toBe('text/html; charset=utf-8')
      expect(res._body).toContain('<title>Test Page</title>')
      expect(res._body).toContain('<h1>Hello from Pug</h1>')
      expect(res._body).toContain('Welcome, Jane!')
    })

    it('should render Handlebars template', async () => {
      const res = createMockResponse()
      const extended = extendResponse(res)

      ;(extended as any).app = {
        get: (key: string) => {
          if (key === 'view engine') return 'handlebars'
          if (key === 'views') return './test/views'
          return undefined
        },
      }

      await extended.render('index', {
        title: 'Test Page',
        message: 'Hello from Handlebars',
        user: { name: 'Bob' },
      })

      expect(res.getHeader('Content-Type')).toBe('text/html; charset=utf-8')
      expect(res._body).toContain('<title>Test Page</title>')
      expect(res._body).toContain('<h1>Hello from Handlebars</h1>')
      expect(res._body).toContain('Welcome, Bob!')
    })

    it('should throw error when view engine is not configured', async () => {
      const res = createMockResponse()
      const extended = extendResponse(res)

      ;(extended as any).app = {
        get: () => undefined,
      }

      await extended.render('index', {})

      expect(res.statusCode).toBe(500)
      expect(res._body).toContain('No view engine configured')
    })

    it('should throw error when template file not found', async () => {
      const res = createMockResponse()
      const extended = extendResponse(res)

      ;(extended as any).app = {
        get: (key: string) => {
          if (key === 'view engine') return 'ejs'
          if (key === 'views') return './test/views'
          return undefined
        },
      }

      await extended.render('nonexistent', {})

      expect(res.statusCode).toBe(500)
      expect(res._body).toContain('View file not found')
    })

    it('should throw error when res.app is not defined', async () => {
      const res = createMockResponse()
      const extended = extendResponse(res)

      await extended.render('index', {})

      expect(res.statusCode).toBe(500)
      expect(res._body).toContain('res.app is not defined')
    })

    it('should support view name with extension', async () => {
      const res = createMockResponse()
      const extended = extendResponse(res)

      ;(extended as any).app = {
        get: (key: string) => {
          if (key === 'view engine') return 'ejs'
          if (key === 'views') return './test/views'
          return undefined
        },
      }

      await extended.render('index.ejs', {
        title: 'Test',
        message: 'Hello',
        user: null,
      })

      expect(res._body).toContain('<title>Test</title>')
    })

    it('should support callback function', async () => {
      const res = createMockResponse()
      const extended = extendResponse(res)

      ;(extended as any).app = {
        get: (key: string) => {
          if (key === 'view engine') return 'ejs'
          if (key === 'views') return './test/views'
          return undefined
        },
      }

      let callbackCalled = false
      let callbackError: Error | null = null
      let callbackHtml: string | undefined

      await extended.render(
        'index',
        {
          title: 'Test',
          message: 'Hello',
          user: null,
        },
        (err, html) => {
          callbackCalled = true
          callbackError = err
          callbackHtml = html
        }
      )

      expect(callbackCalled).toBe(true)
      expect(callbackError).toBeNull()
      expect(callbackHtml).toContain('<title>Test</title>')
    })
  })

  describe('res.locals', () => {
    it('should initialize locals as empty object', () => {
      const res = createMockResponse()
      const extended = extendResponse(res)

      // Should have locals property initialized
      expect(extended.locals).toBeDefined()
      expect(extended.locals).toEqual({})
    })

    it('should allow setting and getting values', () => {
      const res = createMockResponse()
      const extended = extendResponse(res)

      // Set values
      extended.locals!.user = { id: 1, name: 'John' }
      extended.locals!.title = 'Test Page'

      // Get values
      expect(extended.locals!.user).toEqual({ id: 1, name: 'John' })
      expect(extended.locals!.title).toBe('Test Page')
    })

    it('should persist across multiple accesses', () => {
      const res = createMockResponse()
      const extended = extendResponse(res)

      // Set initial value
      extended.locals!.count = 0

      // Increment
      extended.locals!.count++
      extended.locals!.count++

      // Should persist
      expect(extended.locals!.count).toBe(2)
    })

    it('should work with nested objects', () => {
      const res = createMockResponse()
      const extended = extendResponse(res)

      // Set nested object
      extended.locals!.app = {
        name: 'MyApp',
        settings: {
          debug: true,
          port: 3000,
        },
      }

      // Access nested properties
      expect(extended.locals!.app.name).toBe('MyApp')
      expect(extended.locals!.app.settings.debug).toBe(true)
      expect(extended.locals!.app.settings.port).toBe(3000)
    })
  })

  describe('req.baseUrl', () => {
    it('should return empty string when not mounted', () => {
      const req = createMockRequest({}, '/users/123')
      const extended = extendRequest(req)

      // Default baseUrl is empty string
      expect(extended.baseUrl).toBe('')
    })

    it('should return mount path when set', () => {
      const req = createMockRequest({}, '/api/users/123')
      const extended = extendRequest(req)

      // Simulate router mount by setting baseUrl manually
      extended.baseUrl = '/api'

      expect(extended.baseUrl).toBe('/api')
    })

    it('should handle nested router paths', () => {
      const req = createMockRequest({}, '/api/v1/users/123')
      const extended = extendRequest(req)

      // Simulate nested mount: app.use('/api', router1), router1.use('/v1', router2)
      extended.baseUrl = '/api/v1'

      expect(extended.baseUrl).toBe('/api/v1')
    })
  })

  describe('req.route', () => {
    it('should be undefined by default', () => {
      const req = createMockRequest({}, '/users/123')
      const extended = extendRequest(req)

      // Default route is undefined
      expect(extended.route).toBeUndefined()
    })

    it('should contain route information when set', () => {
      const req = createMockRequest({}, '/users/123')
      const extended = extendRequest(req)

      // Simulate route object (set by router during matching)
      extended.route = {
        path: '/users/:id',
        methods: { get: true },
      }

      expect(extended.route).toBeDefined()
      expect(extended.route!.path).toBe('/users/:id')
      expect(extended.route!.methods.get).toBe(true)
    })
  })

  describe('req.subdomains', () => {
    it('should return empty array for no subdomain', () => {
      const req = createMockRequest({ host: 'example.com' })
      const extended = extendRequest(req)

      expect(extended.subdomains).toEqual([])
    })

    it('should parse single subdomain', () => {
      const req = createMockRequest({ host: 'api.example.com' })
      const extended = extendRequest(req)

      expect(extended.subdomains).toEqual(['api'])
    })

    it('should parse multiple subdomains', () => {
      const req = createMockRequest({ host: 'v1.api.example.com' })
      const extended = extendRequest(req)

      // Subdomains are in reverse order (Express compatibility)
      expect(extended.subdomains).toEqual(['v1', 'api'])
    })

    it('should handle subdomain with port', () => {
      const req = createMockRequest({ host: 'api.example.com:3000' })
      const extended = extendRequest(req)

      expect(extended.subdomains).toEqual(['api'])
    })

    it('should respect subdomain offset setting', () => {
      const req = createMockRequest({ host: 'v1.api.example.co.uk' })
      const extended = extendRequest(req)

      // Default offset is 2 (removes last 2 parts: 'co', 'uk')
      // Subdomains: ['v1', 'api', 'example'] → offset 2 → ['v1', 'api']
      expect(extended.subdomains).toEqual(['v1', 'api', 'example'])
    })

    it('should handle localhost', () => {
      const req = createMockRequest({ host: 'localhost' })
      const extended = extendRequest(req)

      expect(extended.subdomains).toEqual([])
    })

    it('should handle X-Forwarded-Host header', () => {
      const req = createMockRequest({ 'x-forwarded-host': 'api.example.com' })
      const extended = extendRequest(req)

      expect(extended.subdomains).toEqual(['api'])
    })

    it('should use custom subdomain offset from app settings', () => {
      const req = createMockRequest({ host: 'v1.api.example.co.uk' })
      const extended = extendRequest(req)

      // Set custom offset via app.set()
      extended.app = { get: (key: string) => key === 'subdomain offset' ? 3 : undefined } as any

      // With offset 3, remove last 3 parts: 'example', 'co', 'uk'
      // v1.api.example.co.uk → ['v1', 'api', 'example', 'co', 'uk']
      // Remove last 3 → ['v1', 'api']
      expect(extended.subdomains).toEqual(['v1', 'api'])
    })

    it('should default to offset 2 when subdomain offset setting is not set', () => {
      const req = createMockRequest({ host: 'v1.api.example.co.uk' })
      const extended = extendRequest(req)

      // No app or no setting → default offset 2
      // v1.api.example.co.uk → ['v1', 'api', 'example', 'co', 'uk']
      // Remove last 2 → ['v1', 'api', 'example']
      expect(extended.subdomains).toEqual(['v1', 'api', 'example'])
    })

    it('should work with offset 1 for single TLD', () => {
      const req = createMockRequest({ host: 'api.example.com' })
      const extended = extendRequest(req)

      // Set offset to 1 (for single TLD like .com)
      extended.app = { get: (key: string) => key === 'subdomain offset' ? 1 : undefined } as any

      // With offset 1, remove last 1 part: 'com'
      // api.example.com → ['api', 'example', 'com']
      // Remove last 1 → ['api', 'example']
      expect(extended.subdomains).toEqual(['api', 'example'])
    })
  })

  describe('req.fresh / req.stale', () => {
    describe('req.fresh', () => {
      it('should be false for non-GET/HEAD requests', () => {
        const req = createMockRequest({}, '/')
        req.method = 'POST'
        const extended = extendRequest(req)

        expect(extended.fresh).toBe(false)
      })

      it('should be false for non-2xx/3xx status codes', () => {
        const req = createMockRequest({}, '/')
        const extended = extendRequest(req)

        // Simulate response with 404 status
        ;(extended as any)._res = { statusCode: 404 }

        expect(extended.fresh).toBe(false)
      })

      it('should be true when ETags match', () => {
        const req = createMockRequest({ 'if-none-match': '"abc123"' }, '/')
        const extended = extendRequest(req)

        // Simulate response with matching ETag
        ;(extended as any).res = {
          statusCode: 200,
          getHeader: () => '"abc123"',
        }

        expect(extended.fresh).toBe(true)
      })

      it('should be true when Last-Modified not changed', () => {
        const date = 'Wed, 15 Nov 2023 12:00:00 GMT'
        const req = createMockRequest({ 'if-modified-since': date }, '/')
        const extended = extendRequest(req)

        // Simulate response with same Last-Modified
        ;(extended as any).res = {
          statusCode: 200,
          getHeader: () => date,
        }

        expect(extended.fresh).toBe(true)
      })

      it('should be false when no cache headers present', () => {
        const req = createMockRequest({}, '/')
        const extended = extendRequest(req)

        ;(extended as any)._res = { statusCode: 200, getHeader: () => undefined }

        expect(extended.fresh).toBe(false)
      })
    })

    describe('req.stale', () => {
      it('should be opposite of req.fresh', () => {
        const req = createMockRequest({}, '/')
        req.method = 'POST'
        const extended = extendRequest(req)

        expect(extended.stale).toBe(true)
        expect(extended.fresh).toBe(false)
      })

      it('should be false when fresh is true', () => {
        const req = createMockRequest({ 'if-none-match': '"abc123"' }, '/')
        const extended = extendRequest(req)

        ;(extended as any).res = {
          statusCode: 200,
          getHeader: () => '"abc123"',
        }

        expect(extended.fresh).toBe(true)
        expect(extended.stale).toBe(false)
      })
    })
  })
})

describe('Response Extensions', () => {
  describe('res.links()', () => {
    it('should set Link header with single link', () => {
      const res = createMockResponse()
      const extended = extendResponse(res)

      extended.links({
        next: 'http://api.example.com/users?page=2',
      })

      expect(extended.getHeader!('Link')).toBe(
        '<http://api.example.com/users?page=2>; rel="next"'
      )
    })

    it('should set Link header with multiple links', () => {
      const res = createMockResponse()
      const extended = extendResponse(res)

      extended.links({
        next: 'http://api.example.com/users?page=3',
        prev: 'http://api.example.com/users?page=1',
        last: 'http://api.example.com/users?page=10',
      })

      const linkHeader = extended.getHeader!('Link') as string
      expect(linkHeader).toContain('rel="next"')
      expect(linkHeader).toContain('rel="prev"')
      expect(linkHeader).toContain('rel="last"')
      expect(linkHeader).toContain('page=3')
      expect(linkHeader).toContain('page=1')
      expect(linkHeader).toContain('page=10')
    })

    it('should append to existing Link header', () => {
      const res = createMockResponse()
      const extended = extendResponse(res)

      // Set initial Link header
      extended.setHeader!('Link', '<http://example.com/1>; rel="first"')

      // Add more links
      extended.links({
        next: 'http://example.com/2',
      })

      const linkHeader = extended.getHeader!('Link') as string
      expect(linkHeader).toContain('rel="first"')
      expect(linkHeader).toContain('rel="next"')
    })

    it('should return response for chaining', () => {
      const res = createMockResponse()
      const extended = extendResponse(res)

      const result = extended.links({ next: 'http://example.com/2' })

      expect(result).toBe(extended)
    })
  })

  describe('res.vary()', () => {
    it('should set Vary header', () => {
      const res = createMockResponse()
      const extended = extendResponse(res)

      extended.vary('User-Agent')

      expect(extended.getHeader!('Vary')).toBe('User-Agent')
    })

    it('should append to existing Vary header', () => {
      const res = createMockResponse()
      const extended = extendResponse(res)

      extended.vary('Accept-Encoding')
      extended.vary('User-Agent')

      const varyHeader = extended.getHeader!('Vary') as string
      expect(varyHeader).toContain('Accept-Encoding')
      expect(varyHeader).toContain('User-Agent')
    })

    it('should not duplicate values', () => {
      const res = createMockResponse()
      const extended = extendResponse(res)

      extended.vary('User-Agent')
      extended.vary('User-Agent')

      expect(extended.getHeader!('Vary')).toBe('User-Agent')
    })

    it('should handle case-insensitive duplicates', () => {
      const res = createMockResponse()
      const extended = extendResponse(res)

      extended.vary('user-agent')
      extended.vary('User-Agent')

      // Should not duplicate (case-insensitive)
      expect(extended.getHeader!('Vary')).toBe('user-agent')
    })

    it('should handle asterisk (*) special case', () => {
      const res = createMockResponse()
      const extended = extendResponse(res)

      extended.vary('*')

      expect(extended.getHeader!('Vary')).toBe('*')

      // Adding more values after * should not change it
      extended.vary('User-Agent')
      expect(extended.getHeader!('Vary')).toBe('*')
    })

    it('should return response for chaining', () => {
      const res = createMockResponse()
      const extended = extendResponse(res)

      const result = extended.vary('User-Agent')

      expect(result).toBe(extended)
    })
  })

  describe('res.format()', () => {
    it('should call handler for matching Accept type', () => {
      const res = createMockResponse()
      const extended = extendResponse(res)

      // Mock request with Accept header
      const req = createMockRequest({ accept: 'application/json' })
      const extendedReq = extendRequest(req)
      ;(extended as any).req = extendedReq

      let called = false
      extended.format({
        'application/json': () => {
          called = true
          extended.json!({ message: 'Hello' })
        },
        'text/html': () => {
          extended.send!('<p>Hello</p>')
        },
      })

      expect(called).toBe(true)
    })

    it('should call default handler when no match', () => {
      const res = createMockResponse()
      const extended = extendResponse(res)

      const req = createMockRequest({ accept: 'application/xml' })
      const extendedReq = extendRequest(req)
      ;(extended as any).req = extendedReq

      let defaultCalled = false
      extended.format({
        'application/json': () => {},
        'text/html': () => {},
        default: () => {
          defaultCalled = true
        },
      })

      expect(defaultCalled).toBe(true)
    })

    it('should send 406 Not Acceptable when no match and no default', () => {
      const res = createMockResponse()
      const extended = extendResponse(res)

      const req = createMockRequest({ accept: 'application/xml' })
      const extendedReq = extendRequest(req)
      ;(extended as any).req = extendedReq

      extended.format({
        'application/json': () => {},
        'text/html': () => {},
      })

      expect(res.statusCode).toBe(406)
    })

    it('should handle short-form types', () => {
      const res = createMockResponse()
      const extended = extendResponse(res)

      const req = createMockRequest({ accept: 'application/json' })
      const extendedReq = extendRequest(req)
      ;(extended as any).req = extendedReq

      let called = false
      extended.format({
        json: () => {
          // Short form: 'json' → 'application/json'
          called = true
        },
        html: () => {},
      })

      expect(called).toBe(true)
    })

    it('should respect quality values in Accept header', () => {
      const res = createMockResponse()
      const extended = extendResponse(res)

      // Prefer JSON over HTML (q=0.9 vs q=0.5)
      const req = createMockRequest({
        accept: 'text/html; q=0.5, application/json; q=0.9',
      })
      const extendedReq = extendRequest(req)
      ;(extended as any).req = extendedReq

      let calledType = ''
      extended.format({
        'application/json': () => {
          calledType = 'json'
        },
        'text/html': () => {
          calledType = 'html'
        },
      })

      expect(calledType).toBe('json')
    })
  })

  // ========================================

  // ========================================

  describe('req.range()', () => {
    it('should parse single range', () => {
      const req = createMockRequest({
        range: 'bytes=0-99',
      })
      const extendedReq = extendRequest(req as any)

      const ranges = extendedReq.range!(1000)
      expect(ranges).toBeDefined()
      expect(Array.isArray(ranges)).toBe(true)
      if (Array.isArray(ranges)) {
        expect(ranges.length).toBe(1)
        expect(ranges[0]).toEqual({ start: 0, end: 99 })
      }
    })

    it('should parse multiple ranges', () => {
      const req = createMockRequest({
        range: 'bytes=0-99,200-299,400-499',
      })
      const extendedReq = extendRequest(req as any)

      const ranges = extendedReq.range!(1000)
      expect(ranges).toBeDefined()
      expect(Array.isArray(ranges)).toBe(true)
      if (Array.isArray(ranges)) {
        expect(ranges.length).toBe(3)
        expect(ranges[0]).toEqual({ start: 0, end: 99 })
        expect(ranges[1]).toEqual({ start: 200, end: 299 })
        expect(ranges[2]).toEqual({ start: 400, end: 499 })
      }
    })

    it('should return -1 for malformed range', () => {
      const req = createMockRequest({
        range: 'bytes=invalid',
      })
      const extendedReq = extendRequest(req as any)

      const ranges = extendedReq.range!(1000)
      expect(ranges).toBe(-1)
    })

    it('should return -2 for unsatisfiable range', () => {
      const req = createMockRequest({
        range: 'bytes=2000-2999',
      })
      const extendedReq = extendRequest(req as any)

      const ranges = extendedReq.range!(1000) // File size is only 1000
      expect(ranges).toBe(-2)
    })

    it('should return -2 when no Range header', () => {
      const req = createMockRequest({})
      const extendedReq = extendRequest(req as any)

      const ranges = extendedReq.range!(1000)
      expect(ranges).toBe(-2)
    })

    it('should parse open-ended range (start only)', () => {
      const req = createMockRequest({
        range: 'bytes=500-',
      })
      const extendedReq = extendRequest(req as any)

      const ranges = extendedReq.range!(1000)
      expect(ranges).toBeDefined()
      expect(Array.isArray(ranges)).toBe(true)
      if (Array.isArray(ranges)) {
        expect(ranges.length).toBe(1)
        expect(ranges[0]).toEqual({ start: 500, end: 999 })
      }
    })

    it('should parse suffix range (last N bytes)', () => {
      const req = createMockRequest({
        range: 'bytes=-200',
      })
      const extendedReq = extendRequest(req as any)

      const ranges = extendedReq.range!(1000)
      expect(ranges).toBeDefined()
      expect(Array.isArray(ranges)).toBe(true)
      if (Array.isArray(ranges)) {
        expect(ranges.length).toBe(1)
        expect(ranges[0]).toEqual({ start: 800, end: 999 })
      }
    })

    it('should support combine option', () => {
      const req = createMockRequest({
        range: 'bytes=0-99,100-199',
      })
      const extendedReq = extendRequest(req as any)

      const ranges = extendedReq.range!(1000, { combine: true })
      expect(ranges).toBeDefined()
      expect(Array.isArray(ranges)).toBe(true)
      if (Array.isArray(ranges)) {
        // Adjacent ranges should be combined
        expect(ranges.length).toBe(1)
        expect(ranges[0]).toEqual({ start: 0, end: 199 })
      }
    })

    it('should handle non-bytes unit', () => {
      const req = createMockRequest({
        range: 'items=0-10',
      })
      const extendedReq = extendRequest(req as any)

      // Should return -1 for non-bytes unit (Express behavior)
      const ranges = extendedReq.range!(1000)
      expect(ranges).toBe(-1)
    })
  })

  describe('req.host', () => {
    it('should return hostname with port', () => {
      const mockReq = createMockRequest({ host: 'example.com:3000' })
      const extendedReq = extendRequest(mockReq)
      expect(extendedReq.host).toBe('example.com:3000')
    })

    it('should return hostname without port if not specified', () => {
      const mockReq = createMockRequest({ host: 'example.com' })
      const extendedReq = extendRequest(mockReq)
      expect(extendedReq.host).toBe('example.com')
    })

    it('should respect X-Forwarded-Host header', () => {
      const mockReq = createMockRequest({
        host: 'internal.com:8080',
        'x-forwarded-host': 'proxy.com:443',
      })
      const extendedReq = extendRequest(mockReq)
      expect(extendedReq.host).toBe('proxy.com:443')
    })

    it('should handle IPv6 addresses with port', () => {
      const mockReq = createMockRequest({ host: '[::1]:3000' })
      const extendedReq = extendRequest(mockReq)
      expect(extendedReq.host).toBe('[::1]:3000')
    })

    it('should return undefined if no Host header', () => {
      const mockReq = createMockRequest({})
      const extendedReq = extendRequest(mockReq)
      expect(extendedReq.host).toBeUndefined()
    })

    it('should differ from req.hostname (which excludes port)', () => {
      const mockReq = createMockRequest({ host: 'example.com:3000' })
      const extendedReq = extendRequest(mockReq)

      // req.host includes port
      expect(extendedReq.host).toBe('example.com:3000')

      // req.hostname excludes port
      expect(extendedReq.hostname).toBe('example.com')
    })
  })

  describe('req.res', () => {
    it('should reference the response object', () => {
      const mockReq = createMockRequest({ host: 'example.com' })
      const mockRes = createMockResponse()

      const extendedReq = extendRequest(mockReq)
      const extendedRes = extendResponse(mockRes)

      // Manually set req.res (normally done in application.ts)
      ;(extendedReq as any).res = extendedRes

      expect(extendedReq.res).toBe(extendedRes)
    })

    it('should allow accessing response methods from request', () => {
      const mockReq = createMockRequest({ host: 'example.com' })
      const mockRes = createMockResponse()

      const extendedReq = extendRequest(mockReq)
      const extendedRes = extendResponse(mockRes)

      // Manually set req.res
      ;(extendedReq as any).res = extendedRes

      // Should be able to call response methods through req.res
      extendedReq.res?.status(404)

      expect(mockRes.statusCode).toBe(404)
    })
  })
})

/**
 * Mock Request helper
 */
function createMockRequest(
  headers: Record<string, any>,
  url: string = '/'
): IncomingMessage {
  const emitter = new EventEmitter()

  return Object.assign(emitter, {
    headers,
    method: 'GET',
    url,
    socket: {},
  }) as IncomingMessage
}

/**
 * Mock Response helper
 */
function createMockResponse(): any {
  const headers: Record<string, string | string[]> = {}
  let body: any = null
  let ended = false

  return {
    statusCode: 200,
    setHeader: (name: string, value: string | string[]) => {
      headers[name.toLowerCase()] = value
    },
    getHeader: (name: string) => {
      return headers[name.toLowerCase()]
    },
    end: (data?: any) => {
      body = data
      ended = true
    },
    get _body() {
      return body
    },
    get _ended() {
      return ended
    },
  }
}
