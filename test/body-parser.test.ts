/**
 * Body Parser Tests

 */

import { IncomingMessage } from 'http'
import { EventEmitter } from 'events'
import { json, urlencoded, raw, text } from '../src/body-parser'

describe('Body Parser', () => {
  describe('JSON Parser', () => {
    it('should parse valid JSON', async () => {
      const req = createMockRequest(
        JSON.stringify({ name: 'John', age: 30 }),
        'application/json'
      )

      await json()(req)

      expect(req.body).toEqual({ name: 'John', age: 30 })
    })

    it('should handle empty JSON object', async () => {
      const req = createMockRequest('', 'application/json')

      await json()(req)

      expect(req.body).toEqual({})
    })

    it('should parse JSON array', async () => {
      const req = createMockRequest(
        JSON.stringify([1, 2, 3, 4, 5]),
        'application/json'
      )

      await json()(req)

      expect(req.body).toEqual([1, 2, 3, 4, 5])
    })

    it('should throw error for invalid JSON', async () => {
      const req = createMockRequest(
        '{ invalid json }',
        'application/json'
      )

      await expect(json()(req)).rejects.toThrow('Invalid JSON')
    })

    it('should not parse when Content-Type is not application/json', async () => {
      const req = createMockRequest(
        JSON.stringify({ name: 'John' }),
        'text/plain'
      )

      await json()(req)

      expect(req.body).toBeUndefined()
    })

    it('should throw error when body size exceeds limit', async () => {
      const largeBody = JSON.stringify({ data: 'x'.repeat(10000) })
      const req = createMockRequest(largeBody, 'application/json')

      await expect(json({ limit: 100 })(req)).rejects.toThrow('exceeds limit')
    })

    it('should throw error for primitive value in strict mode', async () => {
      const req = createMockRequest('123', 'application/json')

      await expect(json({ strict: true })(req)).rejects.toThrow('Strict mode')
    })

    it('should allow primitive value when strict mode is false', async () => {
      const req = createMockRequest('123', 'application/json')

      await json({ strict: false })(req)

      expect(req.body).toBe(123)
    })

    it('should skip when body is already parsed', async () => {
      const req = createMockRequest(
        JSON.stringify({ name: 'John' }),
        'application/json'
      )
      req.body = { existing: 'data' }

      await json()(req)

      expect(req.body).toEqual({ existing: 'data' })
    })

    it('should handle Content-Type with charset', async () => {
      const req = createMockRequest(
        JSON.stringify({ name: 'John' }),
        'application/json; charset=utf-8'
      )

      await json()(req)

      expect(req.body).toEqual({ name: 'John' })
    })

    it('should parse nested objects', async () => {
      const req = createMockRequest(
        JSON.stringify({
          user: {
            name: 'John',
            address: {
              city: 'Seoul',
              country: 'Korea',
            },
          },
        }),
        'application/json'
      )

      await json()(req)

      expect(req.body.user.name).toBe('John')
      expect(req.body.user.address.city).toBe('Seoul')
    })

    it('should parse string form of limit (1mb)', async () => {
      const req = createMockRequest(
        JSON.stringify({ data: 'x'.repeat(100) }),
        'application/json'
      )

      await json({ limit: '1mb' })(req)

      expect(req.body).toBeDefined()
    })

    it('should parse string form of limit (500kb)', async () => {
      const req = createMockRequest(
        JSON.stringify({ data: 'x'.repeat(100) }),
        'application/json'
      )

      await json({ limit: '500kb' })(req)

      expect(req.body).toBeDefined()
    })
  })

  describe('URL-encoded Parser', () => {
    it('should parse valid URL-encoded data', async () => {
      const req = createMockRequest(
        'name=John&age=30&city=Seoul',
        'application/x-www-form-urlencoded'
      )

      await urlencoded()(req)

      expect(req.body).toEqual({
        name: 'John',
        age: '30',
        city: 'Seoul',
      })
    })

    it('should handle empty body', async () => {
      const req = createMockRequest(
        '',
        'application/x-www-form-urlencoded'
      )

      await urlencoded()(req)

      expect(req.body).toEqual({})
    })

    it('should decode URL encoding', async () => {
      const req = createMockRequest(
        'message=Hello%20World&emoji=%F0%9F%98%80',
        'application/x-www-form-urlencoded'
      )

      await urlencoded()(req)

      expect(req.body.message).toBe('Hello World')
      expect(req.body.emoji).toBe('😀')
    })

    it('should support array notation (key[])', async () => {
      const req = createMockRequest(
        'tags[]=javascript&tags[]=typescript&tags[]=nodejs',
        'application/x-www-form-urlencoded'
      )

      await urlencoded()(req)

      expect(req.body.tags).toEqual(['javascript', 'typescript', 'nodejs'])
    })

    it('should not parse when Content-Type doesn\'t match', async () => {
      const req = createMockRequest(
        'name=John&age=30',
        'application/json'
      )

      await urlencoded()(req)

      expect(req.body).toBeUndefined()
    })

    it('should throw error when body size exceeds limit', async () => {
      const largeBody = 'data=' + 'x'.repeat(10000)
      const req = createMockRequest(
        largeBody,
        'application/x-www-form-urlencoded'
      )

      await expect(urlencoded({ limit: 100 })(req)).rejects.toThrow('exceeds limit')
    })

    it('should skip when body is already parsed', async () => {
      const req = createMockRequest(
        'name=John',
        'application/x-www-form-urlencoded'
      )
      req.body = { existing: 'data' }

      await urlencoded()(req)

      expect(req.body).toEqual({ existing: 'data' })
    })

    it('should handle empty values', async () => {
      const req = createMockRequest(
        'name=&age=30',
        'application/x-www-form-urlencoded'
      )

      await urlencoded()(req)

      expect(req.body).toEqual({
        name: '',
        age: '30',
      })
    })

    it('should correctly decode special characters', async () => {
      const req = createMockRequest(
        'email=test%40example.com&url=https%3A%2F%2Fexample.com',
        'application/x-www-form-urlencoded'
      )

      await urlencoded()(req)

      expect(req.body.email).toBe('test@example.com')
      expect(req.body.url).toBe('https://example.com')
    })

    it('should handle Content-Type with charset', async () => {
      const req = createMockRequest(
        'name=John&age=30',
        'application/x-www-form-urlencoded; charset=utf-8'
      )

      await urlencoded()(req)

      expect(req.body).toEqual({
        name: 'John',
        age: '30',
      })
    })

    it('should use last value when same key appears multiple times', async () => {
      const req = createMockRequest(
        'name=John&name=Jane&name=Bob',
        'application/x-www-form-urlencoded'
      )

      await urlencoded()(req)

      // Use last value if not array notation
      expect(req.body.name).toBe('Bob')
    })

    it('should parse string form of limit', async () => {
      const req = createMockRequest(
        'name=John&age=30',
        'application/x-www-form-urlencoded'
      )

      await urlencoded({ limit: '1mb' })(req)

      expect(req.body).toBeDefined()
    })
  })

  describe('Body Parser Options', () => {
    it('should support numeric limit', async () => {
      const req = createMockRequest(
        JSON.stringify({ data: 'test' }),
        'application/json'
      )

      await json({ limit: 1000 })(req)

      expect(req.body).toBeDefined()
    })

    it('should throw error for invalid limit format', async () => {
      expect(() => {
        json({ limit: 'invalid' as any })
      }).toThrow('Invalid body size limit')
    })
  })

  describe('Raw Body Parser', () => {
    it('should parse binary data as Buffer', async () => {
      const binaryData = Buffer.from([0x89, 0x50, 0x4e, 0x47]) // PNG header
      const req = createMockRequestWithBuffer(
        binaryData,
        'application/octet-stream'
      )

      await raw()(req)

      expect(req.body).toBeInstanceOf(Buffer)
      expect(req.body).toEqual(binaryData)
    })

    it('should handle image/* Content-Type', async () => {
      const imageData = Buffer.from('fake-image-data')
      const req = createMockRequestWithBuffer(imageData, 'image/png')

      await raw()(req)

      expect(req.body).toBeInstanceOf(Buffer)
      expect(req.body.toString()).toBe('fake-image-data')
    })

    it('should handle video/* Content-Type', async () => {
      const videoData = Buffer.from('fake-video-data')
      const req = createMockRequestWithBuffer(videoData, 'video/mp4')

      await raw()(req)

      expect(req.body).toBeInstanceOf(Buffer)
    })

    it('should handle audio/* Content-Type', async () => {
      const audioData = Buffer.from('fake-audio-data')
      const req = createMockRequestWithBuffer(audioData, 'audio/mpeg')

      await raw()(req)

      expect(req.body).toBeInstanceOf(Buffer)
    })

    it('should handle application/* Content-Type', async () => {
      const data = Buffer.from('some-application-data')
      const req = createMockRequestWithBuffer(data, 'application/pdf')

      await raw()(req)

      expect(req.body).toBeInstanceOf(Buffer)
    })

    it('should not handle text/* Content-Type', async () => {
      const data = Buffer.from('text data')
      const req = createMockRequestWithBuffer(data, 'text/plain')

      await raw()(req)

      expect(req.body).toBeUndefined()
    })

    it('should throw error when body size exceeds limit', async () => {
      const largeData = Buffer.alloc(10000)
      const req = createMockRequestWithBuffer(
        largeData,
        'application/octet-stream'
      )

      await expect(raw({ limit: 100 })(req)).rejects.toThrow('exceeds limit')
    })

    it('should skip when body is already parsed', async () => {
      const data = Buffer.from('test')
      const req = createMockRequestWithBuffer(
        data,
        'application/octet-stream'
      )
      req.body = { existing: 'data' }

      await raw()(req)

      expect(req.body).toEqual({ existing: 'data' })
    })

    it('should handle empty body', async () => {
      const req = createMockRequestWithBuffer(
        Buffer.from(''),
        'application/octet-stream'
      )

      await raw()(req)

      expect(req.body).toBeInstanceOf(Buffer)
      expect(req.body.length).toBe(0)
    })

    it('should parse string form of limit', async () => {
      const data = Buffer.from('test data')
      const req = createMockRequestWithBuffer(
        data,
        'application/octet-stream'
      )

      await raw({ limit: '1mb' })(req)

      expect(req.body).toBeDefined()
    })
  })

  describe('Text Body Parser', () => {
    it('should parse text/plain as UTF-8 string', async () => {
      const req = createMockRequest('Hello, World!', 'text/plain')

      await text()(req)

      expect(req.body).toBe('Hello, World!')
    })

    it('should handle text/* Content-Type', async () => {
      const req = createMockRequest('<html><body>Test</body></html>', 'text/html')

      await text()(req)

      expect(req.body).toBe('<html><body>Test</body></html>')
    })

    it('should correctly decode UTF-8 characters', async () => {
      const req = createMockRequest('안녕하세요 😀', 'text/plain')

      await text()(req)

      expect(req.body).toBe('안녕하세요 😀')
    })

    it('should not handle application/* Content-Type', async () => {
      const req = createMockRequest('{"test": "data"}', 'application/json')

      await text()(req)

      expect(req.body).toBeUndefined()
    })

    it('should handle empty body', async () => {
      const req = createMockRequest('', 'text/plain')

      await text()(req)

      expect(req.body).toBe('')
    })

    it('should throw error when body size exceeds limit', async () => {
      const largeText = 'x'.repeat(10000)
      const req = createMockRequest(largeText, 'text/plain')

      await expect(text({ limit: 100 })(req)).rejects.toThrow('exceeds limit')
    })

    it('should skip when body is already parsed', async () => {
      const req = createMockRequest('test', 'text/plain')
      req.body = { existing: 'data' }

      await text()(req)

      expect(req.body).toEqual({ existing: 'data' })
    })

    it('should handle multi-line text', async () => {
      const multilineText = 'Line 1\nLine 2\nLine 3'
      const req = createMockRequest(multilineText, 'text/plain')

      await text()(req)

      expect(req.body).toBe(multilineText)
    })

    it('should handle Content-Type with charset', async () => {
      const req = createMockRequest('Hello', 'text/plain; charset=utf-8')

      await text()(req)

      expect(req.body).toBe('Hello')
    })

    it('should parse string form of limit', async () => {
      const req = createMockRequest('test', 'text/plain')

      await text({ limit: '1mb' })(req)

      expect(req.body).toBeDefined()
    })
  })
})

/**
 * Mock request creation helper (string body)
 */
function createMockRequest(body: string, contentType: string): any {
  const emitter = new EventEmitter()

  const req: any = Object.assign(emitter, {
    headers: {
      'content-type': contentType,
    },
    body: undefined,
  })

  // Emit data/end events asynchronously
  setImmediate(() => {
    const buffer = Buffer.from(body, 'utf-8')
    req.emit('data', buffer)
    req.emit('end')
  })

  return req as IncomingMessage & { body?: any }
}

/**
 * Mock request creation helper (Buffer body)
 */
function createMockRequestWithBuffer(body: Buffer, contentType: string): any {
  const emitter = new EventEmitter()

  const req: any = Object.assign(emitter, {
    headers: {
      'content-type': contentType,
    },
    body: undefined,
  })

  // Emit data/end events asynchronously
  setImmediate(() => {
    req.emit('data', body)
    req.emit('end')
  })

  return req as IncomingMessage & { body?: any }
}
