/**
 * Express-Session Compatibility Tests
 * Tests session middleware compatibility with Numflow framework
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import { Application } from '../../src/application.js'
import session from 'express-session'
import * as http from 'http'

describe('Express-Session Compatibility', () => {
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

  it('should create and maintain sessions', (done) => {
    app.use(
      session({
        secret: 'test-secret',
        resave: false,
        saveUninitialized: true,
        cookie: { secure: false },
      })
    )

    app.get('/set', (req: any, res) => {
      req.session.user = 'John Doe'
      req.session.visits = (req.session.visits || 0) + 1
      res.json({ user: req.session.user, visits: req.session.visits })
    })

    app.get('/get', (req: any, res) => {
      res.json({
        user: req.session.user || null,
        visits: req.session.visits || 0,
      })
    })

    server = app.listen(0)
    const address = server.address()
    if (!address || typeof address === 'string') {
      done(new Error('Invalid server address'))
      return
    }
    const port = address.port

    // First request - set session
    http.get(`http://localhost:${port}/set`, (res1) => {
      let data1 = ''
      res1.on('data', (chunk) => {
        data1 += chunk
      })
      res1.on('end', () => {
        expect(res1.statusCode).toBe(200)
        const json1 = JSON.parse(data1)
        expect(json1.user).toBe('John Doe')
        expect(json1.visits).toBe(1)

        // Get cookie from response
        const cookies = res1.headers['set-cookie']
        expect(cookies).toBeDefined()

        // Second request - retrieve session with cookie
        const options = {
          hostname: 'localhost',
          port,
          path: '/get',
          headers: {
            Cookie: cookies ? cookies[0] : '',
          },
        }

        http.get(options, (res2) => {
          let data2 = ''
          res2.on('data', (chunk) => {
            data2 += chunk
          })
          res2.on('end', () => {
            expect(res2.statusCode).toBe(200)
            const json2 = JSON.parse(data2)
            expect(json2.user).toBe('John Doe')
            expect(json2.visits).toBe(1)
            done()
          })
        })
      })
    })
  })

  it('should handle session.destroy()', (done) => {
    app.use(
      session({
        secret: 'test-secret',
        resave: false,
        saveUninitialized: false,
        cookie: { secure: false },
      })
    )

    app.get('/login', (req: any, res) => {
      req.session.authenticated = true
      req.session.username = 'testuser'
      res.json({ message: 'Logged in' })
    })

    app.get('/logout', (req: any, res) => {
      req.session.destroy((err: any) => {
        if (err) {
          res.status(500).json({ error: 'Logout failed' })
        } else {
          res.json({ message: 'Logged out' })
        }
      })
    })

    app.get('/check', (req: any, res) => {
      res.json({
        authenticated: req.session.authenticated || false,
        username: req.session.username || null,
      })
    })

    server = app.listen(0)
    const address = server.address()
    if (!address || typeof address === 'string') {
      done(new Error('Invalid server address'))
      return
    }
    const port = address.port

    // Login
    http.get(`http://localhost:${port}/login`, (res1) => {
      let data1 = ''
      res1.on('data', (chunk) => {
        data1 += chunk
      })
      res1.on('end', () => {
        expect(res1.statusCode).toBe(200)
        const cookies = res1.headers['set-cookie']

        // Logout
        const logoutOptions = {
          hostname: 'localhost',
          port,
          path: '/logout',
          headers: {
            Cookie: cookies ? cookies[0] : '',
          },
        }

        http.get(logoutOptions, (res2) => {
          let data2 = ''
          res2.on('data', (chunk) => {
            data2 += chunk
          })
          res2.on('end', () => {
            expect(res2.statusCode).toBe(200)
            const json2 = JSON.parse(data2)
            expect(json2.message).toBe('Logged out')

            // Check if session is destroyed
            const checkOptions = {
              hostname: 'localhost',
              port,
              path: '/check',
              headers: {
                Cookie: cookies ? cookies[0] : '',
              },
            }

            http.get(checkOptions, (res3) => {
              let data3 = ''
              res3.on('data', (chunk) => {
                data3 += chunk
              })
              res3.on('end', () => {
                expect(res3.statusCode).toBe(200)
                const json3 = JSON.parse(data3)
                expect(json3.authenticated).toBe(false)
                expect(json3.username).toBeNull()
                done()
              })
            })
          })
        })
      })
    })
  })

  it('should handle session regeneration', (done) => {
    app.use(
      session({
        secret: 'test-secret',
        resave: false,
        saveUninitialized: false,
        cookie: { secure: false },
      })
    )

    app.get('/init', (req: any, res) => {
      req.session.counter = 1
      res.json({ sessionID: req.sessionID, counter: req.session.counter })
    })

    app.get('/regenerate', (req: any, res) => {
      const oldCounter = req.session.counter || 0
      req.session.regenerate((err: any) => {
        if (err) {
          res.status(500).json({ error: 'Regeneration failed' })
        } else {
          req.session.counter = oldCounter + 1
          res.json({ sessionID: req.sessionID, counter: req.session.counter })
        }
      })
    })

    server = app.listen(0)
    const address = server.address()
    if (!address || typeof address === 'string') {
      done(new Error('Invalid server address'))
      return
    }
    const port = address.port

    // Initialize session
    http.get(`http://localhost:${port}/init`, (res1) => {
      let data1 = ''
      res1.on('data', (chunk) => {
        data1 += chunk
      })
      res1.on('end', () => {
        expect(res1.statusCode).toBe(200)
        const json1 = JSON.parse(data1)
        expect(json1.counter).toBe(1)
        const oldSessionID = json1.sessionID
        const cookies = res1.headers['set-cookie']

        // Regenerate session
        const regenOptions = {
          hostname: 'localhost',
          port,
          path: '/regenerate',
          headers: {
            Cookie: cookies ? cookies[0] : '',
          },
        }

        http.get(regenOptions, (res2) => {
          let data2 = ''
          res2.on('data', (chunk) => {
            data2 += chunk
          })
          res2.on('end', () => {
            expect(res2.statusCode).toBe(200)
            const json2 = JSON.parse(data2)
            expect(json2.counter).toBe(2)
            // Session ID should be different after regeneration
            expect(json2.sessionID).not.toBe(oldSessionID)
            done()
          })
        })
      })
    })
  })

  it('should handle session with cookie options', (done) => {
    app.use(
      session({
        secret: 'test-secret',
        resave: false,
        saveUninitialized: true,
        cookie: {
          maxAge: 3600000, // 1 hour
          httpOnly: true,
          sameSite: 'lax',
          secure: false,
        },
      })
    )

    app.get('/test', (req: any, res) => {
      req.session.testData = 'secure cookie test'
      res.json({ cookie: req.session.cookie })
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
        const cookies = res.headers['set-cookie']
        expect(cookies).toBeDefined()
        if (cookies) {
          const cookieStr = cookies[0]
          expect(cookieStr).toContain('HttpOnly')
          expect(cookieStr).toContain('SameSite=Lax')
        }
        done()
      })
    })
  })

  it('should work with other middlewares', (done) => {
    // Add custom middleware before session
    app.use((_req: any, _res: any, next: any) => {
      // Custom middleware
      next()
    })

    app.use(
      session({
        secret: 'test-secret',
        resave: false,
        saveUninitialized: false,
        cookie: { secure: false },
      })
    )

    // Add custom middleware after session
    app.use((req: any, _res: any, next: any) => {
      req.customTimestamp = Date.now()
      next()
    })

    app.get('/combined', (req: any, res) => {
      req.session.value = 'test'
      res.json({
        sessionValue: req.session.value,
        customTimestamp: req.customTimestamp,
      })
    })

    server = app.listen(0)
    const address = server.address()
    if (!address || typeof address === 'string') {
      done(new Error('Invalid server address'))
      return
    }
    const port = address.port

    http.get(`http://localhost:${port}/combined`, (res) => {
      let data = ''
      res.on('data', (chunk) => {
        data += chunk
      })
      res.on('end', () => {
        expect(res.statusCode).toBe(200)
        const json = JSON.parse(data)
        expect(json.sessionValue).toBe('test')
        expect(json.customTimestamp).toBeDefined()
        expect(typeof json.customTimestamp).toBe('number')
        done()
      })
    })
  })
})
