/**
 * Helmet Compatibility Tests
 * Tests security headers middleware compatibility with Numflow framework
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import { Application } from '../../src/application.js'
import helmet from 'helmet'
import * as http from 'http'

describe('Helmet Compatibility', () => {
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

  it('should add default security headers', (done) => {
    app.use(helmet())

    app.get('/test', (_req, res) => {
      res.json({ success: true })
    })

    server = app.listen(0)
    const address = server.address()
    if (!address || typeof address === 'string') {
      done(new Error('Invalid server address'))
      return
    }
    const port = address.port

    http.get(`http://localhost:${port}/test`, (res) => {
      let data = ''
      res.on('data', (chunk) => {
        data += chunk
      })
      res.on('end', () => {
        expect(res.statusCode).toBe(200)

        // Check security headers added by helmet
        expect(res.headers['x-dns-prefetch-control']).toBeDefined()
        expect(res.headers['x-frame-options']).toBeDefined()
        expect(res.headers['strict-transport-security']).toBeDefined()
        expect(res.headers['x-download-options']).toBeDefined()
        expect(res.headers['x-content-type-options']).toBeDefined()
        expect(res.headers['x-permitted-cross-domain-policies']).toBeDefined()

        done()
      })
    })
  })

  it('should add Content-Security-Policy header', (done) => {
    app.use(
      helmet({
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
          },
        },
      })
    )

    app.get('/csp-test', (_req, res) => {
      res.send('CSP Test')
    })

    server = app.listen(0)
    const address = server.address()
    if (!address || typeof address === 'string') {
      done(new Error('Invalid server address'))
      return
    }
    const port = address.port

    http.get(`http://localhost:${port}/csp-test`, (res) => {
      let data = ''
      res.on('data', (chunk) => {
        data += chunk
      })
      res.on('end', () => {
        expect(res.statusCode).toBe(200)
        expect(res.headers['content-security-policy']).toBeDefined()
        expect(res.headers['content-security-policy']).toContain("default-src 'self'")
        done()
      })
    })
  })

  it('should disable X-Powered-By header', (done) => {
    app.use(helmet())

    app.get('/powered-by-test', (_req, res) => {
      res.json({ test: true })
    })

    server = app.listen(0)
    const address = server.address()
    if (!address || typeof address === 'string') {
      done(new Error('Invalid server address'))
      return
    }
    const port = address.port

    http.get(`http://localhost:${port}/powered-by-test`, (res) => {
      let data = ''
      res.on('data', (chunk) => {
        data += chunk
      })
      res.on('end', () => {
        expect(res.statusCode).toBe(200)
        expect(res.headers['x-powered-by']).toBeUndefined()
        done()
      })
    })
  })

  it('should set X-Frame-Options to DENY', (done) => {
    app.use(
      helmet({
        frameguard: { action: 'deny' },
      })
    )

    app.get('/frame-test', (_req, res) => {
      res.send('Frame Test')
    })

    server = app.listen(0)
    const address = server.address()
    if (!address || typeof address === 'string') {
      done(new Error('Invalid server address'))
      return
    }
    const port = address.port

    http.get(`http://localhost:${port}/frame-test`, (res) => {
      let data = ''
      res.on('data', (chunk) => {
        data += chunk
      })
      res.on('end', () => {
        expect(res.statusCode).toBe(200)
        expect(res.headers['x-frame-options']).toBe('DENY')
        done()
      })
    })
  })

  it('should set HSTS header with custom maxAge', (done) => {
    app.use(
      helmet({
        hsts: {
          maxAge: 31536000, // 1 year in seconds
          includeSubDomains: true,
          preload: true,
        },
      })
    )

    app.get('/hsts-test', (_req, res) => {
      res.send('HSTS Test')
    })

    server = app.listen(0)
    const address = server.address()
    if (!address || typeof address === 'string') {
      done(new Error('Invalid server address'))
      return
    }
    const port = address.port

    http.get(`http://localhost:${port}/hsts-test`, (res) => {
      let data = ''
      res.on('data', (chunk) => {
        data += chunk
      })
      res.on('end', () => {
        expect(res.statusCode).toBe(200)
        expect(res.headers['strict-transport-security']).toBeDefined()
        expect(res.headers['strict-transport-security']).toContain('max-age=31536000')
        expect(res.headers['strict-transport-security']).toContain('includeSubDomains')
        expect(res.headers['strict-transport-security']).toContain('preload')
        done()
      })
    })
  })

  it('should work with other middlewares', (done) => {
    app.use(helmet())

    // Add another middleware
    app.use((req: any, _res: any, next: any) => {
      req.customValue = 'test'
      next()
    })

    app.get('/combined-test', (req: any, res) => {
      res.json({ customValue: req.customValue })
    })

    server = app.listen(0)
    const address = server.address()
    if (!address || typeof address === 'string') {
      done(new Error('Invalid server address'))
      return
    }
    const port = address.port

    http.get(`http://localhost:${port}/combined-test`, (res) => {
      let data = ''
      res.on('data', (chunk) => {
        data += chunk
      })
      res.on('end', () => {
        expect(res.statusCode).toBe(200)
        const json = JSON.parse(data)
        expect(json.customValue).toBe('test')

        // Helmet headers should still be present
        expect(res.headers['x-frame-options']).toBeDefined()
        expect(res.headers['x-content-type-options']).toBeDefined()

        done()
      })
    })
  })

  it('should allow selective middleware configuration', (done) => {
    // Only enable specific helmet middlewares
    app.use(
      helmet({
        contentSecurityPolicy: false, // Disable CSP
        xFrameOptions: { action: 'sameorigin' },
      })
    )

    app.get('/selective-test', (_req, res) => {
      res.send('Selective Test')
    })

    server = app.listen(0)
    const address = server.address()
    if (!address || typeof address === 'string') {
      done(new Error('Invalid server address'))
      return
    }
    const port = address.port

    http.get(`http://localhost:${port}/selective-test`, (res) => {
      let data = ''
      res.on('data', (chunk) => {
        data += chunk
      })
      res.on('end', () => {
        expect(res.statusCode).toBe(200)
        expect(res.headers['x-frame-options']).toBe('SAMEORIGIN')
        // CSP should not be present since it's disabled
        expect(res.headers['content-security-policy']).toBeUndefined()
        done()
      })
    })
  })
})
