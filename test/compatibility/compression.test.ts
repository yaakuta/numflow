/**
 * Compression Compatibility Tests
 * Tests response compression middleware compatibility with Numflow framework
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import { Application } from '../../src/application.js'
import compression from 'compression'
import * as http from 'http'
import * as zlib from 'zlib'

describe('Compression Compatibility', () => {
  let app: Application
  let server: http.Server

  beforeEach(() => {
    app = new Application()
  })

  afterEach(async () => {
    if (server && server.listening) {
      if (typeof server.closeAllConnections === 'function') {
        server.closeAllConnections()
      }
      await new Promise<void>((resolve) => {
        const timeout = setTimeout(() => resolve(), 2000)
        server.close(() => {
          clearTimeout(timeout)
          resolve()
        })
      })
    }
    server = null as any
  })

  it('should compress response with gzip', (done) => {
    app.use(compression())

    app.get('/test', (_req, res) => {
      res.json({ message: 'This is a long message that should be compressed'.repeat(100) })
    })

    server = app.listen(0)
    const address = server.address()
    if (!address || typeof address === 'string') {
      done(new Error('Invalid server address'))
      return
    }
    const port = address.port

    const options = {
      hostname: 'localhost',
      port,
      path: '/test',
      headers: {
        'Accept-Encoding': 'gzip',
      },
    }

    http.get(options, (res) => {
      expect(res.statusCode).toBe(200)
      expect(res.headers['content-encoding']).toBe('gzip')

      const chunks: Buffer[] = []
      res.on('data', (chunk) => {
        chunks.push(Buffer.from(chunk))
      })
      res.on('end', () => {
        const buffer = Buffer.concat(chunks)
        const decompressed = zlib.gunzipSync(buffer).toString()
        const json = JSON.parse(decompressed)
        expect(json.message).toContain('This is a long message')
        done()
      })
    })
  })

  it.skip('should compress response with deflate', (done) => {
    app.use(compression())

    app.get('/deflate-test', (_req, res) => {
      res.send('A'.repeat(1000)) // Send repetitive data for better compression
    })

    server = app.listen(0)
    const address = server.address()
    if (!address || typeof address === 'string') {
      done(new Error('Invalid server address'))
      return
    }
    const port = address.port

    const options = {
      hostname: 'localhost',
      port,
      path: '/deflate-test',
      headers: {
        'Accept-Encoding': 'deflate',
      },
    }

    http.get(options, (res) => {
      expect(res.statusCode).toBe(200)
      expect(res.headers['content-encoding']).toBe('deflate')

      const chunks: Buffer[] = []
      res.on('data', (chunk) => {
        chunks.push(Buffer.from(chunk))
      })
      res.on('end', () => {
        const buffer = Buffer.concat(chunks)
        const decompressed = zlib.inflateSync(buffer).toString()
        expect(decompressed).toBe('A'.repeat(1000))
        done()
      })
    })
  })

  it('should not compress small responses', (done) => {
    app.use(compression({ threshold: 1024 })) // Only compress if > 1KB

    app.get('/small', (_req, res) => {
      res.send('Small response')
    })

    server = app.listen(0)
    const address = server.address()
    if (!address || typeof address === 'string') {
      done(new Error('Invalid server address'))
      return
    }
    const port = address.port

    const options = {
      hostname: 'localhost',
      port,
      path: '/small',
      headers: {
        'Accept-Encoding': 'gzip',
      },
    }

    http.get(options, (res) => {
      let data = ''
      res.on('data', (chunk) => {
        data += chunk
      })
      res.on('end', () => {
        expect(res.statusCode).toBe(200)
        // Small response should not be compressed
        expect(res.headers['content-encoding']).toBeUndefined()
        expect(data).toBe('Small response')
        done()
      })
    })
  })

  it('should not compress when Accept-Encoding is missing', (done) => {
    app.use(compression())

    app.get('/no-encoding', (_req, res) => {
      res.json({ message: 'Test'.repeat(1000) })
    })

    server = app.listen(0)
    const address = server.address()
    if (!address || typeof address === 'string') {
      done(new Error('Invalid server address'))
      return
    }
    const port = address.port

    // No Accept-Encoding header
    http.get(`http://localhost:${port}/no-encoding`, (res) => {
      let data = ''
      res.on('data', (chunk) => {
        data += chunk
      })
      res.on('end', () => {
        expect(res.statusCode).toBe(200)
        expect(res.headers['content-encoding']).toBeUndefined()
        const json = JSON.parse(data)
        expect(json.message).toContain('Test')
        done()
      })
    })
  })

  it('should compress JSON responses', (done) => {
    app.use(compression())

    const largeObject = {
      data: Array.from({ length: 100 }, (_, i) => ({
        id: i,
        name: `User ${i}`,
        email: `user${i}@example.com`,
        description: 'This is a long description that will help with compression'.repeat(10),
      })),
    }

    app.get('/json', (_req, res) => {
      res.json(largeObject)
    })

    server = app.listen(0)
    const address = server.address()
    if (!address || typeof address === 'string') {
      done(new Error('Invalid server address'))
      return
    }
    const port = address.port

    const options = {
      hostname: 'localhost',
      port,
      path: '/json',
      headers: {
        'Accept-Encoding': 'gzip',
      },
    }

    http.get(options, (res) => {
      expect(res.statusCode).toBe(200)
      expect(res.headers['content-encoding']).toBe('gzip')
      expect(res.headers['content-type']).toContain('application/json')

      const chunks: Buffer[] = []
      res.on('data', (chunk) => {
        chunks.push(Buffer.from(chunk))
      })
      res.on('end', () => {
        const buffer = Buffer.concat(chunks)
        const decompressed = zlib.gunzipSync(buffer).toString()
        const json = JSON.parse(decompressed)
        expect(json.data).toHaveLength(100)
        expect(json.data[0].name).toBe('User 0')
        done()
      })
    })
  })

  it('should work with custom filter function', (done) => {
    app.use(
      compression({
        filter: (req: any, _res: any) => {
          // Only compress responses with 'compress' query parameter
          return req.query?.compress === 'true'
        },
      })
    )

    app.get('/custom-filter', (_req, res) => {
      res.send('Test data '.repeat(1000))
    })

    server = app.listen(0)
    const address = server.address()
    if (!address || typeof address === 'string') {
      done(new Error('Invalid server address'))
      return
    }
    const port = address.port

    // First request: without compress query param (should not compress)
    const options1 = {
      hostname: 'localhost',
      port,
      path: '/custom-filter',
      headers: {
        'Accept-Encoding': 'gzip',
      },
    }

    http.get(options1, (res1) => {
      let data1 = ''
      res1.on('data', (chunk) => {
        data1 += chunk
      })
      res1.on('end', () => {
        expect(res1.statusCode).toBe(200)
        expect(res1.headers['content-encoding']).toBeUndefined()

        // Second request: with compress=true (should compress)
        const options2 = {
          hostname: 'localhost',
          port,
          path: '/custom-filter?compress=true',
          headers: {
            'Accept-Encoding': 'gzip',
          },
        }

        http.get(options2, (res2) => {
          expect(res2.statusCode).toBe(200)
          expect(res2.headers['content-encoding']).toBe('gzip')

          const chunks: Buffer[] = []
          res2.on('data', (chunk) => {
            chunks.push(Buffer.from(chunk))
          })
          res2.on('end', () => {
            const buffer = Buffer.concat(chunks)
            const decompressed = zlib.gunzipSync(buffer).toString()
            expect(decompressed).toContain('Test data')
            done()
          })
        })
      })
    })
  })

  it('should compress with multiple middlewares', (done) => {
    // Add compression along with other middlewares
    app.use((req: any, _res: any, next: any) => {
      req.timestamp = Date.now()
      next()
    })

    app.use(compression())

    app.use((_req: any, res: any, next: any) => {
      res.set('X-Custom-Header', 'test')
      next()
    })

    app.get('/multi-middleware', (req: any, res) => {
      res.json({
        timestamp: req.timestamp,
        data: 'A'.repeat(1000),
      })
    })

    server = app.listen(0)
    const address = server.address()
    if (!address || typeof address === 'string') {
      done(new Error('Invalid server address'))
      return
    }
    const port = address.port

    const options = {
      hostname: 'localhost',
      port,
      path: '/multi-middleware',
      headers: {
        'Accept-Encoding': 'gzip',
      },
    }

    http.get(options, (res) => {
      expect(res.statusCode).toBe(200)
      expect(res.headers['content-encoding']).toBe('gzip')
      expect(res.headers['x-custom-header']).toBe('test')

      const chunks: Buffer[] = []
      res.on('data', (chunk) => {
        chunks.push(Buffer.from(chunk))
      })
      res.on('end', () => {
        const buffer = Buffer.concat(chunks)
        const decompressed = zlib.gunzipSync(buffer).toString()
        const json = JSON.parse(decompressed)
        expect(json.timestamp).toBeDefined()
        expect(json.data).toContain('A')
        done()
      })
    })
  })
})
