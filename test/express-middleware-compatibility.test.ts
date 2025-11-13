/**
 * Express Middleware Compatibility Tests
 * Tests if Numflow is compatible with real Express ecosystem middleware
 */

import numflow, { Application } from '../src/index'
import http from 'http'
import cookieParser from 'cookie-parser'
import cors from 'cors'

describe('Express Middleware Compatibility', () => {
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

  // ============================================================================
  // 1. cookie-parser Compatibility Tests
  // ============================================================================
  describe('cookie-parser Compatibility', () => {
    it('should be able to use cookie-parser middleware', (done) => {
      app = numflow()
      const port = 4100

      // Use cookie-parser middleware
      app.use(cookieParser())

      app.get('/test', (req: any, res: any) => {
        res.json({
          cookies: req.cookies,
          signedCookies: req.signedCookies,
        })
      })

      server = app.listen(port, () => {
        const options = {
          hostname: 'localhost',
          port,
          path: '/test',
          headers: {
            Cookie: 'name=value; token=abc123',
          },
        }

        http.get(options, (res) => {
          let data = ''
          res.on('data', (chunk) => {
            data += chunk
          })
          res.on('end', () => {
            const result = JSON.parse(data)
            expect(result.cookies).toEqual({
              name: 'value',
              token: 'abc123',
            })
            done()
          })
        })
      })
    })

    // TODO: - signed cookies require cookie-signature package
    it.skip('should be able to parse signed cookies (requires cookie-signature)', (done) => {
      app = numflow()
      const port = 4101
      const secret = 'my-secret-key'

      // Configure secret for signed cookies
      app.use(cookieParser(secret))

      app.get('/set', (_req: any, res: any) => {
        res.cookie('session', 'user-session-id', { signed: true })
        res.json({ success: true })
      })

      app.get('/get', (req: any, res: any) => {
        res.json({
          signedCookies: req.signedCookies,
        })
      })

      server = app.listen(port, () => {
        // Set cookie first
        http.get(`http://localhost:${port}/set`, (setRes) => {
          const setCookieHeader = setRes.headers['set-cookie']
          let data = ''
          setRes.on('data', (chunk) => {
            data += chunk
          })
          setRes.on('end', () => {
            // Request again with the set cookie
            const options = {
              hostname: 'localhost',
              port,
              path: '/get',
              headers: {
                Cookie: setCookieHeader ? setCookieHeader[0] : '',
              },
            }

            http.get(options, (getRes) => {
              let getData = ''
              getRes.on('data', (chunk) => {
                getData += chunk
              })
              getRes.on('end', () => {
                const result = JSON.parse(getData)
                expect(result.signedCookies.session).toBe('user-session-id')
                done()
              })
            })
          })
        })
      })
    })
  })

  // ============================================================================
  // 2. cors Compatibility Tests
  // ============================================================================
  describe('cors Compatibility', () => {
    it('should be able to use cors middleware (default settings)', (done) => {
      app = numflow()
      const port = 4102

      // Use cors middleware (default: allow all origins)
      app.use(cors())

      app.get('/test', (_req: any, res: any) => {
        res.json({ success: true })
      })

      server = app.listen(port, () => {
        const options = {
          hostname: 'localhost',
          port,
          path: '/test',
          headers: {
            Origin: 'https://example.com',
          },
        }

        http.get(options, (res) => {
          // Check CORS headers
          expect(res.headers['access-control-allow-origin']).toBe('*')

          let data = ''
          res.on('data', (chunk) => {
            data += chunk
          })
          res.on('end', () => {
            const result = JSON.parse(data)
            expect(result.success).toBe(true)
            done()
          })
        })
      })
    })

    it('should be able to use cors middleware (specific origin)', (done) => {
      app = numflow()
      const port = 4103

      // Use cors middleware (allow specific origin only)
      app.use(
        cors({
          origin: 'https://example.com',
          credentials: true,
        })
      )

      app.get('/test', (_req: any, res: any) => {
        res.json({ success: true })
      })

      server = app.listen(port, () => {
        const options = {
          hostname: 'localhost',
          port,
          path: '/test',
          headers: {
            Origin: 'https://example.com',
          },
        }

        http.get(options, (res) => {
          // Check CORS headers
          expect(res.headers['access-control-allow-origin']).toBe('https://example.com')
          expect(res.headers['access-control-allow-credentials']).toBe('true')

          let data = ''
          res.on('data', (chunk) => {
            data += chunk
          })
          res.on('end', () => {
            const result = JSON.parse(data)
            expect(result.success).toBe(true)
            done()
          })
        })
      })
    })

    it('should be able to handle OPTIONS request (preflight)', (done) => {
      app = numflow()
      const port = 4104

      app.use(cors())

      app.post('/test', (_req: any, res: any) => {
        res.json({ success: true })
      })

      server = app.listen(port, () => {
        const options = {
          hostname: 'localhost',
          port,
          path: '/test',
          method: 'OPTIONS',
          headers: {
            Origin: 'https://example.com',
            'Access-Control-Request-Method': 'POST',
          },
        }

        const req = http.request(options, (res) => {
          // Check preflight response
          expect(res.statusCode).toBe(204)
          expect(res.headers['access-control-allow-origin']).toBe('*')
          done()
        })

        req.end()
      })
    })
  })

  // ============================================================================
  // 3. Using Multiple Express Middleware Together
  // ============================================================================
  describe('Multiple Express Middleware Integration', () => {
    it('should be able to use cookie-parser and cors together', (done) => {
      app = numflow()
      const port = 4105

      // Use multiple Express middleware together
      app.use(cors({ origin: 'https://example.com' }))
      app.use(cookieParser())

      app.get('/test', (req: any, res: any) => {
        res.json({
          cookies: req.cookies,
          cors: 'enabled',
        })
      })

      server = app.listen(port, () => {
        const options = {
          hostname: 'localhost',
          port,
          path: '/test',
          headers: {
            Origin: 'https://example.com',
            Cookie: 'user=john; session=abc123',
          },
        }

        http.get(options, (res) => {
          // Check CORS headers
          expect(res.headers['access-control-allow-origin']).toBe('https://example.com')

          let data = ''
          res.on('data', (chunk) => {
            data += chunk
          })
          res.on('end', () => {
            const result = JSON.parse(data)
            expect(result.cookies).toEqual({
              user: 'john',
              session: 'abc123',
            })
            expect(result.cors).toBe('enabled')
            done()
          })
        })
      })
    })
  })

  // ============================================================================
  // 4. Express Middleware with Numflow Middleware
  // ============================================================================
  describe('Mixing Express Middleware with Numflow Middleware', () => {
    it('should be able to use Express middleware and custom middleware together', (done) => {
      app = numflow()
      const port = 4106

      // Express middleware
      app.use(cookieParser())

      // Numflow custom middleware
      app.use((req: any, _res: any, next: any) => {
        req.customData = 'from-numflow-middleware'
        next()
      })

      app.get('/test', (req: any, res: any) => {
        res.json({
          cookies: req.cookies,
          customData: req.customData,
        })
      })

      server = app.listen(port, () => {
        const options = {
          hostname: 'localhost',
          port,
          path: '/test',
          headers: {
            Cookie: 'token=xyz789',
          },
        }

        http.get(options, (res) => {
          let data = ''
          res.on('data', (chunk) => {
            data += chunk
          })
          res.on('end', () => {
            const result = JSON.parse(data)
            expect(result.cookies).toEqual({ token: 'xyz789' })
            expect(result.customData).toBe('from-numflow-middleware')
            done()
          })
        })
      })
    })
  })
})
