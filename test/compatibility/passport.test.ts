/**
 * Passport Compatibility Tests
 * Tests passport authentication middleware compatibility with Numflow framework
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import { Application } from '../../src/application.js'
import passport from 'passport'
import { Strategy as LocalStrategy } from 'passport-local'
import session from 'express-session'
import * as http from 'http'

// Mock user database
const users = [
  { id: 1, username: 'testuser', password: 'password123' },
  { id: 2, username: 'admin', password: 'admin123' },
]

describe('Passport Compatibility', () => {
  let app: Application
  let server: http.Server

  beforeEach(() => {
    app = new Application()

    // Configure passport
    passport.serializeUser((user: any, done) => {
      done(null, user.id)
    })

    passport.deserializeUser((id: number, done) => {
      const user = users.find((u) => u.id === id)
      done(null, user || null)
    })

    // Configure local strategy
    passport.use(
      new LocalStrategy((username, password, done) => {
        const user = users.find((u) => u.username === username && u.password === password)
        if (user) {
          return done(null, user)
        } else {
          return done(null, false, { message: 'Invalid credentials' })
        }
      })
    )
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

  it('should authenticate user with passport.authenticate()', (done) => {
    app.use(
      session({
        secret: 'test-secret',
        resave: false,
        saveUninitialized: false,
        cookie: { secure: false },
      })
    )

    app.use(passport.initialize())
    app.use(passport.session())

    app.post(
      '/login',
      passport.authenticate('local', { failureRedirect: '/login-failed' }) as any,
      (req: any, res) => {
        res.json({ success: true, user: req.user })
      }
    )

    app.get('/login-failed', (_req, res) => {
      res.status(401).json({ success: false, message: 'Login failed' })
    })

    app.get('/profile', (req: any, res) => {
      if (req.isAuthenticated()) {
        res.json({ user: req.user })
      } else {
        res.status(401).json({ message: 'Not authenticated' })
      }
    })

    server = app.listen(0)
    const address = server.address()
    if (!address || typeof address === 'string') {
      done(new Error('Invalid server address'))
      return
    }
    const port = address.port

    // Login with valid credentials
    const loginData = 'username=testuser&password=password123'
    const options = {
      hostname: 'localhost',
      port,
      path: '/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(loginData),
      },
    }

    const req = http.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => {
        data += chunk
      })
      res.on('end', () => {
        expect(res.statusCode).toBe(200)
        const json = JSON.parse(data)
        expect(json.success).toBe(true)
        expect(json.user.username).toBe('testuser')

        // Check if we got a session cookie
        const cookies = res.headers['set-cookie']
        expect(cookies).toBeDefined()

        // Access protected route with session
        const profileOptions = {
          hostname: 'localhost',
          port,
          path: '/profile',
          headers: {
            Cookie: cookies ? cookies[0] : '',
          },
        }

        http.get(profileOptions, (res2) => {
          let data2 = ''
          res2.on('data', (chunk) => {
            data2 += chunk
          })
          res2.on('end', () => {
            expect(res2.statusCode).toBe(200)
            const json2 = JSON.parse(data2)
            expect(json2.user.username).toBe('testuser')
            done()
          })
        })
      })
    })

    req.write(loginData)
    req.end()
  })

  it('should fail authentication with invalid credentials', (done) => {
    app.use(
      session({
        secret: 'test-secret',
        resave: false,
        saveUninitialized: false,
        cookie: { secure: false },
      })
    )

    app.use(passport.initialize())
    app.use(passport.session())

    app.post(
      '/login',
      passport.authenticate('local', { failureRedirect: '/login-failed' }) as any,
      (req: any, res) => {
        res.json({ success: true, user: req.user })
      }
    )

    app.get('/login-failed', (_req, res) => {
      res.status(401).json({ success: false, message: 'Login failed' })
    })

    server = app.listen(0)
    const address = server.address()
    if (!address || typeof address === 'string') {
      done(new Error('Invalid server address'))
      return
    }
    const port = address.port

    // Login with invalid credentials
    const loginData = 'username=testuser&password=wrongpassword'
    const options = {
      hostname: 'localhost',
      port,
      path: '/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(loginData),
      },
    }

    const req = http.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => {
        data += chunk
      })
      res.on('end', () => {
        // Should redirect to /login-failed
        expect(res.statusCode).toBe(302)
        expect(res.headers.location).toBe('/login-failed')
        done()
      })
    })

    req.write(loginData)
    req.end()
  })

  it('should handle req.logout()', (done) => {
    app.use(
      session({
        secret: 'test-secret',
        resave: false,
        saveUninitialized: false,
        cookie: { secure: false },
      })
    )

    app.use(passport.initialize())
    app.use(passport.session())

    app.post(
      '/login',
      passport.authenticate('local', { failureRedirect: '/login-failed' }) as any,
      (_req: any, res) => {
        res.json({ success: true })
      }
    )

    app.post('/logout', (req: any, res) => {
      req.logout((err: any) => {
        if (err) {
          res.status(500).json({ error: 'Logout failed' })
        } else {
          res.json({ success: true, message: 'Logged out' })
        }
      })
    })

    app.get('/check-auth', (req: any, res) => {
      res.json({ authenticated: req.isAuthenticated() })
    })

    server = app.listen(0)
    const address = server.address()
    if (!address || typeof address === 'string') {
      done(new Error('Invalid server address'))
      return
    }
    const port = address.port

    // Login
    const loginData = 'username=testuser&password=password123'
    const loginOptions = {
      hostname: 'localhost',
      port,
      path: '/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(loginData),
      },
    }

    const loginReq = http.request(loginOptions, (res1) => {
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
          method: 'POST',
          headers: {
            Cookie: cookies ? cookies[0] : '',
          },
        }

        const logoutReq = http.request(logoutOptions, (res2) => {
          let data2 = ''
          res2.on('data', (chunk) => {
            data2 += chunk
          })
          res2.on('end', () => {
            expect(res2.statusCode).toBe(200)
            const json2 = JSON.parse(data2)
            expect(json2.success).toBe(true)

            // Check authentication status after logout
            const checkOptions = {
              hostname: 'localhost',
              port,
              path: '/check-auth',
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
                done()
              })
            })
          })
        })
        logoutReq.end()
      })
    })

    loginReq.write(loginData)
    loginReq.end()
  })

  it('should support req.isAuthenticated()', (done) => {
    app.use(
      session({
        secret: 'test-secret',
        resave: false,
        saveUninitialized: false,
        cookie: { secure: false },
      })
    )

    app.use(passport.initialize())
    app.use(passport.session())

    app.get('/public', (req: any, res) => {
      res.json({ authenticated: req.isAuthenticated() })
    })

    server = app.listen(0)
    const address = server.address()
    if (!address || typeof address === 'string') {
      done(new Error('Invalid server address'))
      return
    }
    const port = address.port

    http.get(`http://localhost:${port}/public`, (res) => {
      let data = ''
      res.on('data', (chunk) => {
        data += chunk
      })
      res.on('end', () => {
        expect(res.statusCode).toBe(200)
        const json = JSON.parse(data)
        expect(json.authenticated).toBe(false)
        done()
      })
    })
  })

  it('should work with custom callback', (done) => {
    app.use(
      session({
        secret: 'test-secret',
        resave: false,
        saveUninitialized: false,
        cookie: { secure: false },
      })
    )

    app.use(passport.initialize())
    app.use(passport.session())

    app.post('/custom-login', (req: any, res, next) => {
      passport.authenticate('local', (err: any, user: any, info: any) => {
        if (err) {
          return res.status(500).json({ error: 'Authentication error' })
        }
        if (!user) {
          return res.status(401).json({ success: false, message: info.message })
        }
        req.logIn(user, (err: any) => {
          if (err) {
            return res.status(500).json({ error: 'Login error' })
          }
          return res.json({ success: true, username: user.username })
        })
      })(req, res, next)
    })

    server = app.listen(0)
    const address = server.address()
    if (!address || typeof address === 'string') {
      done(new Error('Invalid server address'))
      return
    }
    const port = address.port

    // Login with valid credentials
    const loginData = 'username=admin&password=admin123'
    const options = {
      hostname: 'localhost',
      port,
      path: '/custom-login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(loginData),
      },
    }

    const req = http.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => {
        data += chunk
      })
      res.on('end', () => {
        expect(res.statusCode).toBe(200)
        const json = JSON.parse(data)
        expect(json.success).toBe(true)
        expect(json.username).toBe('admin')
        done()
      })
    })

    req.write(loginData)
    req.end()
  })
})
