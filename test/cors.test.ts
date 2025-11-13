/**
 * CORS Middleware Tests

 */

import numflow, { Application, cors } from '../src/index'
import http from 'http'

describe('CORS Middleware', () => {
  let app: Application
  let server: http.Server

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

  describe('Basic Behavior', () => {
    it('should set default CORS headers', (done) => {
      app = numflow()
      const port = 8000

      app.use(cors())
      app.get('/test', (_req, res) => {
        res.send('OK')
      })

      server = app.listen(port, () => {
        const options = {
          hostname: 'localhost',
          port: port,
          path: '/test',
          headers: {
            Origin: 'http://example.com',
          },
        }

        http.get(options, (res) => {
          expect(res.headers['access-control-allow-origin']).toBe('*')
          done()
        })
      })
    })

    it('should set Vary header when specific origin is configured', (done) => {
      app = numflow()
      const port = 8001

      app.use(cors({ origin: 'http://example.com' }))
      app.get('/test', (_req, res) => {
        res.send('OK')
      })

      server = app.listen(port, () => {
        const options = {
          hostname: 'localhost',
          port: port,
          path: '/test',
          headers: {
            Origin: 'http://example.com',
          },
        }

        http.get(options, (res) => {
          expect(res.headers['vary']).toBe('Origin')
          done()
        })
      })
    })

    it('should set CORS headers even without Origin header', (done) => {
      app = numflow()
      const port = 8002

      app.use(cors())
      app.get('/test', (_req, res) => {
        res.send('OK')
      })

      server = app.listen(port, () => {
        http.get(`http://localhost:${port}/test`, (res) => {
          expect(res.headers['access-control-allow-origin']).toBe('*')
          done()
        })
      })
    })
  })

  describe('origin Option', () => {
    it('should be able to allow specific origin', (done) => {
      app = numflow()
      const port = 8003

      app.use(cors({ origin: 'http://example.com' }))
      app.get('/test', (_req, res) => {
        res.send('OK')
      })

      server = app.listen(port, () => {
        const options = {
          hostname: 'localhost',
          port: port,
          path: '/test',
          headers: {
            Origin: 'http://example.com',
          },
        }

        http.get(options, (res) => {
          expect(res.headers['access-control-allow-origin']).toBe('http://example.com')
          done()
        })
      })
    })

    it('should support origin array', (done) => {
      app = numflow()
      const port = 8004

      app.use(cors({ origin: ['http://example.com', 'http://test.com'] }))
      app.get('/test', (_req, res) => {
        res.send('OK')
      })

      server = app.listen(port, () => {
        const options = {
          hostname: 'localhost',
          port: port,
          path: '/test',
          headers: {
            Origin: 'http://test.com',
          },
        }

        http.get(options, (res) => {
          expect(res.headers['access-control-allow-origin']).toBe('http://test.com')
          done()
        })
      })
    })

    it('should reject disallowed origin (using array)', (done) => {
      app = numflow()
      const port = 8005

      app.use(cors({ origin: ['http://example.com', 'http://test.com'] }))
      app.get('/test', (_req, res) => {
        res.send('OK')
      })

      server = app.listen(port, () => {
        const options = {
          hostname: 'localhost',
          port: port,
          path: '/test',
          headers: {
            Origin: 'http://malicious.com',
          },
        }

        http.get(options, (res) => {
          expect(res.headers['access-control-allow-origin']).toBeUndefined()
          done()
        })
      })
    })

    it('should support origin function', (done) => {
      app = numflow()
      const port = 8006

      app.use(
        cors({
          origin: (origin) => {
            return origin?.endsWith('.example.com') || origin === 'http://localhost:3000'
          },
        })
      )
      app.get('/test', (_req, res) => {
        res.send('OK')
      })

      server = app.listen(port, () => {
        const options = {
          hostname: 'localhost',
          port: port,
          path: '/test',
          headers: {
            Origin: 'http://subdomain.example.com',
          },
        }

        http.get(options, (res) => {
          expect(res.headers['access-control-allow-origin']).toBe('http://subdomain.example.com')
          done()
        })
      })
    })
  })

  describe('credentials Option', () => {
    it('should include Access-Control-Allow-Credentials when credentials is set to true', (done) => {
      app = numflow()
      const port = 8007

      app.use(cors({ credentials: true, origin: 'http://example.com' }))
      app.get('/test', (_req, res) => {
        res.send('OK')
      })

      server = app.listen(port, () => {
        const options = {
          hostname: 'localhost',
          port: port,
          path: '/test',
          headers: {
            Origin: 'http://example.com',
          },
        }

        http.get(options, (res) => {
          expect(res.headers['access-control-allow-credentials']).toBe('true')
          done()
        })
      })
    })

    it('should not set header when credentials is false', (done) => {
      app = numflow()
      const port = 8008

      app.use(cors({ credentials: false }))
      app.get('/test', (_req, res) => {
        res.send('OK')
      })

      server = app.listen(port, () => {
        const options = {
          hostname: 'localhost',
          port: port,
          path: '/test',
          headers: {
            Origin: 'http://example.com',
          },
        }

        http.get(options, (res) => {
          expect(res.headers['access-control-allow-credentials']).toBeUndefined()
          done()
        })
      })
    })
  })

  describe('methods Option', () => {
    it('should be able to set allowed HTTP methods', (done) => {
      app = numflow()
      const port = 8009

      app.use(cors({ methods: ['GET', 'POST'] }))
      app.options('/test', (_req, res) => {
        res.sendStatus(204)
      })

      server = app.listen(port, () => {
        const options = {
          method: 'OPTIONS',
          hostname: 'localhost',
          port: port,
          path: '/test',
          headers: {
            Origin: 'http://example.com',
            'Access-Control-Request-Method': 'POST',
          },
        }

        const req = http.request(options, (res) => {
          expect(res.headers['access-control-allow-methods']).toBe('GET, POST')
          done()
        })

        req.end()
      })
    })

    it('should be able to set methods as string', (done) => {
      app = numflow()
      const port = 8010

      app.use(cors({ methods: 'GET, POST, PUT' }))
      app.options('/test', (_req, res) => {
        res.sendStatus(204)
      })

      server = app.listen(port, () => {
        const options = {
          method: 'OPTIONS',
          hostname: 'localhost',
          port: port,
          path: '/test',
          headers: {
            Origin: 'http://example.com',
            'Access-Control-Request-Method': 'PUT',
          },
        }

        const req = http.request(options, (res) => {
          expect(res.headers['access-control-allow-methods']).toBe('GET, POST, PUT')
          done()
        })

        req.end()
      })
    })
  })

  describe('allowedHeaders Option', () => {
    it('should be able to set allowed headers', (done) => {
      app = numflow()
      const port = 8011

      app.use(cors({ allowedHeaders: ['Content-Type', 'Authorization'] }))
      app.options('/test', (_req, res) => {
        res.sendStatus(204)
      })

      server = app.listen(port, () => {
        const options = {
          method: 'OPTIONS',
          hostname: 'localhost',
          port: port,
          path: '/test',
          headers: {
            Origin: 'http://example.com',
            'Access-Control-Request-Headers': 'Content-Type',
          },
        }

        const req = http.request(options, (res) => {
          expect(res.headers['access-control-allow-headers']).toBe('Content-Type, Authorization')
          done()
        })

        req.end()
      })
    })

    it('should be able to set allowedHeaders as string', (done) => {
      app = numflow()
      const port = 8012

      app.use(cors({ allowedHeaders: 'Content-Type, X-Custom-Header' }))
      app.options('/test', (_req, res) => {
        res.sendStatus(204)
      })

      server = app.listen(port, () => {
        const options = {
          method: 'OPTIONS',
          hostname: 'localhost',
          port: port,
          path: '/test',
          headers: {
            Origin: 'http://example.com',
            'Access-Control-Request-Headers': 'X-Custom-Header',
          },
        }

        const req = http.request(options, (res) => {
          expect(res.headers['access-control-allow-headers']).toBe('Content-Type, X-Custom-Header')
          done()
        })

        req.end()
      })
    })
  })

  describe('exposedHeaders Option', () => {
    it('should be able to set exposed headers', (done) => {
      app = numflow()
      const port = 8013

      app.use(cors({ exposedHeaders: ['X-Total-Count', 'X-Page-Number'] }))
      app.get('/test', (_req, res) => {
        res.send('OK')
      })

      server = app.listen(port, () => {
        const options = {
          hostname: 'localhost',
          port: port,
          path: '/test',
          headers: {
            Origin: 'http://example.com',
          },
        }

        http.get(options, (res) => {
          expect(res.headers['access-control-expose-headers']).toBe('X-Total-Count, X-Page-Number')
          done()
        })
      })
    })
  })

  describe('maxAge Option', () => {
    it('should be able to set cache time for preflight request', (done) => {
      app = numflow()
      const port = 8014

      app.use(cors({ maxAge: 3600 }))
      app.options('/test', (_req, res) => {
        res.sendStatus(204)
      })

      server = app.listen(port, () => {
        const options = {
          method: 'OPTIONS',
          hostname: 'localhost',
          port: port,
          path: '/test',
          headers: {
            Origin: 'http://example.com',
            'Access-Control-Request-Method': 'POST',
          },
        }

        const req = http.request(options, (res) => {
          expect(res.headers['access-control-max-age']).toBe('3600')
          done()
        })

        req.end()
      })
    })
  })

  describe('Preflight Request Handling', () => {
    it('should handle OPTIONS request as preflight', (done) => {
      app = numflow()
      const port = 8015

      app.use(cors())
      app.options('/test', (_req, res) => {
        res.sendStatus(204)
      })

      server = app.listen(port, () => {
        const options = {
          method: 'OPTIONS',
          hostname: 'localhost',
          port: port,
          path: '/test',
          headers: {
            Origin: 'http://example.com',
            'Access-Control-Request-Method': 'POST',
          },
        }

        const req = http.request(options, (res) => {
          expect(res.statusCode).toBe(204)
          expect(res.headers['access-control-allow-origin']).toBe('*')
          done()
        })

        req.end()
      })
    })

    it('should pass to next handler when preflightContinue is true', (done) => {
      app = numflow()
      const port = 8016

      let handlerCalled = false

      app.use(cors({ preflightContinue: true }))
      app.options('/test', (_req, res) => {
        handlerCalled = true
        res.sendStatus(204)
      })

      server = app.listen(port, () => {
        const options = {
          method: 'OPTIONS',
          hostname: 'localhost',
          port: port,
          path: '/test',
          headers: {
            Origin: 'http://example.com',
            'Access-Control-Request-Method': 'POST',
          },
        }

        const req = http.request(options, (res) => {
          expect(res.statusCode).toBe(204)
          setTimeout(() => {
            expect(handlerCalled).toBe(true)
            done()
          }, 10)
        })

        req.end()
      })
    })
  })

  describe('Comprehensive Scenario', () => {
    it('should apply all complex CORS settings', (done) => {
      app = numflow()
      const port = 8017

      app.use(
        cors({
          origin: 'http://example.com',
          credentials: true,
          methods: ['GET', 'POST', 'PUT'],
          allowedHeaders: ['Content-Type', 'Authorization'],
          exposedHeaders: ['X-Total-Count'],
          maxAge: 86400,
        })
      )
      app.get('/test', (_req, res) => {
        res.send('OK')
      })

      server = app.listen(port, () => {
        const options = {
          hostname: 'localhost',
          port: port,
          path: '/test',
          headers: {
            Origin: 'http://example.com',
          },
        }

        http.get(options, (res) => {
          expect(res.headers['access-control-allow-origin']).toBe('http://example.com')
          expect(res.headers['access-control-allow-credentials']).toBe('true')
          expect(res.headers['access-control-expose-headers']).toBe('X-Total-Count')
          expect(res.headers['vary']).toBe('Origin')
          done()
        })
      })
    })
  })
})
