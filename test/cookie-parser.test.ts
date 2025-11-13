/**
 * Cookie Parser Middleware Tests

 */

import numflow, { Application, cookieParser } from '../src/index'
import http from 'http'

describe('Cookie Parser Middleware', () => {
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

  describe('Basic Cookie Parsing', () => {
    it('should parse Cookie header and set to req.cookies', (done) => {
      app = numflow()
      const port = 6000

      app.use(cookieParser())
      app.get('/test', (req, res) => {
        res.json({ cookies: req.cookies })
      })

      server = app.listen(port, () => {
        const options = {
          hostname: 'localhost',
          port: port,
          path: '/test',
          headers: {
            Cookie: 'name=John; age=30',
          },
        }

        http.get(options, (res) => {
          let data = ''
          res.on('data', (chunk) => {
            data += chunk
          })
          res.on('end', () => {
            const body = JSON.parse(data)
            expect(body.cookies).toEqual({ name: 'John', age: '30' })
            done()
          })
        })
      })
    })

    it('should set empty object when Cookie header is absent', (done) => {
      app = numflow()
      const port = 6001

      app.use(cookieParser())
      app.get('/test', (req, res) => {
        res.json({ cookies: req.cookies })
      })

      server = app.listen(port, () => {
        http.get(`http://localhost:${port}/test`, (res) => {
          let data = ''
          res.on('data', (chunk) => {
            data += chunk
          })
          res.on('end', () => {
            const body = JSON.parse(data)
            expect(body.cookies).toEqual({})
            done()
          })
        })
      })
    })

    it('should decode URL-encoded cookies', (done) => {
      app = numflow()
      const port = 6002

      app.use(cookieParser())
      app.get('/test', (req, res) => {
        res.json({ cookies: req.cookies })
      })

      server = app.listen(port, () => {
        const options = {
          hostname: 'localhost',
          port: port,
          path: '/test',
          headers: {
            Cookie: 'message=Hello%20World',
          },
        }

        http.get(options, (res) => {
          let data = ''
          res.on('data', (chunk) => {
            data += chunk
          })
          res.on('end', () => {
            const body = JSON.parse(data)
            expect(body.cookies.message).toBe('Hello World')
            done()
          })
        })
      })
    })

    it('should parse multiple cookies', (done) => {
      app = numflow()
      const port = 6003

      app.use(cookieParser())
      app.get('/test', (req, res) => {
        res.json({ cookies: req.cookies })
      })

      server = app.listen(port, () => {
        const options = {
          hostname: 'localhost',
          port: port,
          path: '/test',
          headers: {
            Cookie: 'a=1; b=2; c=3; d=4',
          },
        }

        http.get(options, (res) => {
          let data = ''
          res.on('data', (chunk) => {
            data += chunk
          })
          res.on('end', () => {
            const body = JSON.parse(data)
            expect(body.cookies).toEqual({ a: '1', b: '2', c: '3', d: '4' })
            done()
          })
        })
      })
    })
  })

  describe('Signed Cookies', () => {
    it('should accept secret as string', (done) => {
      app = numflow()
      const port = 6004

      app.use(cookieParser('my-secret'))
      app.get('/test', (_req, res) => {
        res.json({ ok: true })
      })

      server = app.listen(port, () => {
        http.get(`http://localhost:${port}/test`, (res) => {
          expect(res.statusCode).toBe(200)
          done()
        })
      })
    })

    it('should accept secret as options object', (done) => {
      app = numflow()
      const port = 6005

      app.use(cookieParser({ secret: 'my-secret' }))
      app.get('/test', (_req, res) => {
        res.json({ ok: true })
      })

      server = app.listen(port, () => {
        http.get(`http://localhost:${port}/test`, (res) => {
          expect(res.statusCode).toBe(200)
          done()
        })
      })
    })

    it('should accept multiple secrets as array', (done) => {
      app = numflow()
      const port = 6006

      app.use(cookieParser({ secret: ['secret1', 'secret2'] }))
      app.get('/test', (_req, res) => {
        res.json({ ok: true })
      })

      server = app.listen(port, () => {
        http.get(`http://localhost:${port}/test`, (res) => {
          expect(res.statusCode).toBe(200)
          done()
        })
      })
    })
  })

  describe('Already Parsed Cookies', () => {
    it('should not parse again if req.cookies already exists', (done) => {
      app = numflow()
      const port = 6007

      // Set cookies in first middleware
      app.use((req: any, _res: any, next: any) => {
        req.cookies = { preset: 'value' }
        next()
      })

      app.use(cookieParser())
      app.get('/test', (req, res) => {
        res.json({ cookies: req.cookies })
      })

      server = app.listen(port, () => {
        const options = {
          hostname: 'localhost',
          port: port,
          path: '/test',
          headers: {
            Cookie: 'name=John',
          },
        }

        http.get(options, (res) => {
          let data = ''
          res.on('data', (chunk) => {
            data += chunk
          })
          res.on('end', () => {
            const body = JSON.parse(data)
            // Keep already set cookies
            expect(body.cookies).toEqual({ preset: 'value' })
            done()
          })
        })
      })
    })
  })

  describe('Custom Decode Function', () => {
    it('should use custom decode function', (done) => {
      app = numflow()
      const port = 6008

      app.use(
        cookieParser({
          decode: (val) => val.toUpperCase(),
        })
      )
      app.get('/test', (req, res) => {
        res.json({ cookies: req.cookies })
      })

      server = app.listen(port, () => {
        const options = {
          hostname: 'localhost',
          port: port,
          path: '/test',
          headers: {
            Cookie: 'name=john',
          },
        }

        http.get(options, (res) => {
          let data = ''
          res.on('data', (chunk) => {
            data += chunk
          })
          res.on('end', () => {
            const body = JSON.parse(data)
            expect(body.cookies.name).toBe('JOHN')
            done()
          })
        })
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle malformed cookie format', (done) => {
      app = numflow()
      const port = 6009

      app.use(cookieParser())
      app.get('/test', (req, res) => {
        res.json({ cookies: req.cookies })
      })

      server = app.listen(port, () => {
        const options = {
          hostname: 'localhost',
          port: port,
          path: '/test',
          headers: {
            Cookie: 'invalid cookie format;;;',
          },
        }

        http.get(options, (res) => {
          // Should be handled without error
          expect(res.statusCode).toBe(200)
          done()
        })
      })
    })
  })
})
