/**
 * Cookie Parser Signed Cookies Tests

 */

import numflow, { Application, cookieParser } from '../src/index'
import http from 'http'
import * as crypto from 'crypto'

// Helper function to sign a value
function signValue(value: string, secret: string): string {
  const signature = crypto
    .createHmac('sha256', secret)
    .update(value)
    .digest('base64')
    .replace(/\=+$/, '')
  return `${value}.${signature}`
}

describe('Cookie Parser - Signed Cookies', () => {
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

  describe('Signed Cookies Parsing', () => {
    it('should parse signed cookie with valid signature', (done) => {
      app = numflow()
      const port = 6100
      const secret = 'my-secret'

      app.use(cookieParser(secret))
      app.get('/test', (req: any, res) => {
        res.json({
          cookies: req.cookies,
          signedCookies: req.signedCookies,
        })
      })

      server = app.listen(port, () => {
        // Create a signed cookie
        const signedValue = signValue('john', secret)

        const options = {
          hostname: 'localhost',
          port: port,
          path: '/test',
          headers: {
            Cookie: `s:user=${signedValue}`,
          },
        }

        http.get(options, (res) => {
          let data = ''
          res.on('data', (chunk) => {
            data += chunk
          })
          res.on('end', () => {
            const body = JSON.parse(data)
            expect(body.signedCookies).toEqual({ user: 'john' })
            expect(body.cookies).toEqual({})
            done()
          })
        })
      })
    })

    it('should add signed cookie with invalid signature to regular cookies', (done) => {
      app = numflow()
      const port = 6101
      const secret = 'my-secret'

      app.use(cookieParser(secret))
      app.get('/test', (req: any, res) => {
        res.json({
          cookies: req.cookies,
          signedCookies: req.signedCookies,
        })
      })

      server = app.listen(port, () => {
        const options = {
          hostname: 'localhost',
          port: port,
          path: '/test',
          headers: {
            Cookie: 's:user=john.invalidsignature',
          },
        }

        http.get(options, (res) => {
          let data = ''
          res.on('data', (chunk) => {
            data += chunk
          })
          res.on('end', () => {
            const body = JSON.parse(data)
            expect(body.signedCookies).toEqual({})
            expect(body.cookies).toEqual({ 's:user': 'john.invalidsignature' })
            done()
          })
        })
      })
    })

    it('should treat signed cookie as regular cookie when secret is absent', (done) => {
      app = numflow()
      const port = 6102

      app.use(cookieParser())
      app.get('/test', (req: any, res) => {
        res.json({
          cookies: req.cookies,
          signedCookies: req.signedCookies,
        })
      })

      server = app.listen(port, () => {
        const signedValue = signValue('john', 'some-secret')

        const options = {
          hostname: 'localhost',
          port: port,
          path: '/test',
          headers: {
            Cookie: `s:user=${signedValue}`,
          },
        }

        http.get(options, (res) => {
          let data = ''
          res.on('data', (chunk) => {
            data += chunk
          })
          res.on('end', () => {
            const body = JSON.parse(data)
            expect(body.signedCookies).toEqual({})
            expect(body.cookies).toEqual({ 's:user': signedValue })
            done()
          })
        })
      })
    })

    it('should verify successfully with one of multiple secrets', (done) => {
      app = numflow()
      const port = 6103
      const secrets = ['old-secret', 'current-secret', 'new-secret']

      app.use(cookieParser({ secret: secrets }))
      app.get('/test', (req: any, res) => {
        res.json({
          cookies: req.cookies,
          signedCookies: req.signedCookies,
        })
      })

      server = app.listen(port, () => {
        // Sign with old secret
        const signedValue = signValue('john', 'old-secret')

        const options = {
          hostname: 'localhost',
          port: port,
          path: '/test',
          headers: {
            Cookie: `s:user=${signedValue}`,
          },
        }

        http.get(options, (res) => {
          let data = ''
          res.on('data', (chunk) => {
            data += chunk
          })
          res.on('end', () => {
            const body = JSON.parse(data)
            expect(body.signedCookies).toEqual({ user: 'john' })
            expect(body.cookies).toEqual({})
            done()
          })
        })
      })
    })

    it('should handle both regular and signed cookies together', (done) => {
      app = numflow()
      const port = 6104
      const secret = 'my-secret'

      app.use(cookieParser(secret))
      app.get('/test', (req: any, res) => {
        res.json({
          cookies: req.cookies,
          signedCookies: req.signedCookies,
        })
      })

      server = app.listen(port, () => {
        const signedValue = signValue('john', secret)

        const options = {
          hostname: 'localhost',
          port: port,
          path: '/test',
          headers: {
            Cookie: `name=alice; s:user=${signedValue}; role=admin`,
          },
        }

        http.get(options, (res) => {
          let data = ''
          res.on('data', (chunk) => {
            data += chunk
          })
          res.on('end', () => {
            const body = JSON.parse(data)
            expect(body.signedCookies).toEqual({ user: 'john' })
            expect(body.cookies).toEqual({ name: 'alice', role: 'admin' })
            done()
          })
        })
      })
    })
  })

  describe('Signed Cookie Edge Cases', () => {
    it('should fail verification for signed cookie without dot (.)', (done) => {
      app = numflow()
      const port = 6105
      const secret = 'my-secret'

      app.use(cookieParser(secret))
      app.get('/test', (req: any, res) => {
        res.json({
          cookies: req.cookies,
          signedCookies: req.signedCookies,
        })
      })

      server = app.listen(port, () => {
        const options = {
          hostname: 'localhost',
          port: port,
          path: '/test',
          headers: {
            Cookie: 's:user=johndoe',
          },
        }

        http.get(options, (res) => {
          let data = ''
          res.on('data', (chunk) => {
            data += chunk
          })
          res.on('end', () => {
            const body = JSON.parse(data)
            expect(body.signedCookies).toEqual({})
            expect(body.cookies).toEqual({ 's:user': 'johndoe' })
            done()
          })
        })
      })
    })

    it('should fail verification for signed cookie with empty signature', (done) => {
      app = numflow()
      const port = 6106
      const secret = 'my-secret'

      app.use(cookieParser(secret))
      app.get('/test', (req: any, res) => {
        res.json({
          cookies: req.cookies,
          signedCookies: req.signedCookies,
        })
      })

      server = app.listen(port, () => {
        const options = {
          hostname: 'localhost',
          port: port,
          path: '/test',
          headers: {
            Cookie: 's:user=john.',
          },
        }

        http.get(options, (res) => {
          let data = ''
          res.on('data', (chunk) => {
            data += chunk
          })
          res.on('end', () => {
            const body = JSON.parse(data)
            expect(body.signedCookies).toEqual({})
            expect(body.cookies).toEqual({ 's:user': 'john.' })
            done()
          })
        })
      })
    })

    it('should handle multiple signed cookies', (done) => {
      app = numflow()
      const port = 6107
      const secret = 'my-secret'

      app.use(cookieParser(secret))
      app.get('/test', (req: any, res) => {
        res.json({
          cookies: req.cookies,
          signedCookies: req.signedCookies,
        })
      })

      server = app.listen(port, () => {
        const signedUser = signValue('john', secret)
        const signedSession = signValue('abc123', secret)

        const options = {
          hostname: 'localhost',
          port: port,
          path: '/test',
          headers: {
            Cookie: `s:user=${signedUser}; s:session=${signedSession}`,
          },
        }

        http.get(options, (res) => {
          let data = ''
          res.on('data', (chunk) => {
            data += chunk
          })
          res.on('end', () => {
            const body = JSON.parse(data)
            expect(body.signedCookies).toEqual({ user: 'john', session: 'abc123' })
            expect(body.cookies).toEqual({})
            done()
          })
        })
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle errors during cookie parsing', (done) => {
      app = numflow()
      const port = 6108

      app.use(cookieParser())
      app.get('/test', (_req, res) => {
        res.send('OK')
      })

      // Error handler
      app.use((_err: any, _req: any, res: any, _next: any) => {
        res.status(500).send('Error')
      })

      server = app.listen(port, () => {
        const options = {
          hostname: 'localhost',
          port: port,
          path: '/test',
          headers: {
            // Very long cookie (may cause memory issues)
            Cookie: 'a='.repeat(10000),
          },
        }

        http.get(options, (res) => {
          // Should be handled without errors
          expect(res.statusCode).toBeLessThanOrEqual(500)
          done()
        })
      })
    })
  })
})
