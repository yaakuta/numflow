/**
 * Router Tests
 */

import { describe, it, expect } from '@jest/globals'
import numflow from '../src/index.js'
import * as http from 'http'

describe('Router', () => {
  describe('HTTP Method Routing', () => {
    it('should register and call GET route', (done) => {
      const app = numflow()

      app.get('/users', (_req, res) => {
        res.statusCode = 200
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ method: 'GET', path: '/users' }))
      })

      const server = app.listen(0, () => {
        const address = server.address() as any
        const port = address.port

        http.get(`http://localhost:${port}/users`, (res) => {
          let data = ''
          res.on('data', (chunk) => {
            data += chunk
          })
          res.on('end', () => {
            expect(res.statusCode).toBe(200)
            expect(JSON.parse(data)).toEqual({ method: 'GET', path: '/users' })
            server.close()
            done()
          })
        })
      })
    })

    it('should register and call POST route', (done) => {
      const app = numflow()

      app.post('/users', (_req, res) => {
        res.statusCode = 201
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ method: 'POST', path: '/users' }))
      })

      const server = app.listen(0, () => {
        const address = server.address() as any
        const port = address.port

        const req = http.request(
          {
            hostname: 'localhost',
            port,
            path: '/users',
            method: 'POST',
          },
          (res) => {
            let data = ''
            res.on('data', (chunk) => {
              data += chunk
            })
            res.on('end', () => {
              expect(res.statusCode).toBe(201)
              expect(JSON.parse(data)).toEqual({ method: 'POST', path: '/users' })
              server.close()
              done()
            })
          }
        )

        req.end()
      })
    })
  })

  describe('Path Parameters', () => {
    it('should extract dynamic parameters', (done) => {
      const app = numflow()

      app.get('/users/:id', (req, res) => {
        const params = (req as any).params
        res.statusCode = 200
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ userId: params.id }))
      })

      const server = app.listen(0, () => {
        const address = server.address() as any
        const port = address.port

        http.get(`http://localhost:${port}/users/123`, (res) => {
          let data = ''
          res.on('data', (chunk) => {
            data += chunk
          })
          res.on('end', () => {
            expect(res.statusCode).toBe(200)
            expect(JSON.parse(data)).toEqual({ userId: '123' })
            server.close()
            done()
          })
        })
      })
    })

    it('should extract multiple parameters', (done) => {
      const app = numflow()

      app.get('/users/:userId/posts/:postId', (req, res) => {
        const params = (req as any).params
        res.statusCode = 200
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ userId: params.userId, postId: params.postId }))
      })

      const server = app.listen(0, () => {
        const address = server.address() as any
        const port = address.port

        http.get(`http://localhost:${port}/users/123/posts/456`, (res) => {
          let data = ''
          res.on('data', (chunk) => {
            data += chunk
          })
          res.on('end', () => {
            expect(res.statusCode).toBe(200)
            expect(JSON.parse(data)).toEqual({ userId: '123', postId: '456' })
            server.close()
            done()
          })
        })
      })
    })
  })

  describe('Query Parameters', () => {
    it('should parse query parameters', (done) => {
      const app = numflow()

      app.get('/search', (req, res) => {
        const query = (req as any).query
        res.statusCode = 200
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ query }))
      })

      const server = app.listen(0, () => {
        const address = server.address() as any
        const port = address.port

        http.get(`http://localhost:${port}/search?q=test&page=1`, (res) => {
          let data = ''
          res.on('data', (chunk) => {
            data += chunk
          })
          res.on('end', () => {
            expect(res.statusCode).toBe(200)
            expect(JSON.parse(data)).toEqual({ query: { q: 'test', page: '1' } })
            server.close()
            done()
          })
        })
      })
    })
  })

  describe('Route Chaining', () => {
    it('should register multiple methods with route() method', (done) => {
      const app = numflow()

      app.route('/users')
        .get((_req, res) => {
          res.statusCode = 200
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ method: 'GET' }))
        })
        .post((_req, res) => {
          res.statusCode = 201
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ method: 'POST' }))
        })

      const server = app.listen(0, () => {
        const address = server.address() as any
        const port = address.port

        // Test GET request
        http.get(`http://localhost:${port}/users`, (res) => {
          let data = ''
          res.on('data', (chunk) => {
            data += chunk
          })
          res.on('end', () => {
            expect(res.statusCode).toBe(200)
            expect(JSON.parse(data)).toEqual({ method: 'GET' })

            // Test POST request
            const req = http.request(
              {
                hostname: 'localhost',
                port,
                path: '/users',
                method: 'POST',
              },
              (res) => {
                let data = ''
                res.on('data', (chunk) => {
                  data += chunk
                })
                res.on('end', () => {
                  expect(res.statusCode).toBe(201)
                  expect(JSON.parse(data)).toEqual({ method: 'POST' })
                  server.close()
                  done()
                })
              }
            )

            req.end()
          })
        })
      })
    })
  })

  describe('404 Not Found', () => {
    it('should return 404 for unregistered routes', (done) => {
      const app = numflow()

      app.get('/users', (_req, res) => {
        res.statusCode = 200
        res.end('OK')
      })

      const server = app.listen(0, () => {
        const address = server.address() as any
        const port = address.port

        http.get(`http://localhost:${port}/not-found`, (res) => {
          let data = ''
          res.on('data', (chunk) => {
            data += chunk
          })
          res.on('end', () => {
            expect(res.statusCode).toBe(404)
            const parsed = JSON.parse(data)
            expect(parsed.success).toBe(false)
            expect(parsed.error).toBe('Not Found')
            server.close()
            done()
          })
        })
      })
    })
  })

  describe('express.Router Compatibility', () => {
    it('should create Router factory function', () => {
      const router = numflow.Router()
      expect(router).toBeDefined()
      expect(typeof router.get).toBe('function')
      expect(typeof router.post).toBe('function')
      expect(typeof router.use).toBe('function')
    })

    it('should register and mount Router routes', (done) => {
      const app = numflow()
      const apiRouter = numflow.Router()

      apiRouter.get('/users', (_req, res) => {
        res.statusCode = 200
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ message: 'Users list' }))
      })

      apiRouter.post('/users', (_req, res) => {
        res.statusCode = 201
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ message: 'User created' }))
      })

      app.use('/api', apiRouter)

      const server = app.listen(0, () => {
        const address = server.address() as any
        const port = address.port

        http.get(`http://localhost:${port}/api/users`, (res) => {
          let data = ''
          res.on('data', (chunk) => {
            data += chunk
          })
          res.on('end', () => {
            expect(res.statusCode).toBe(200)
            expect(JSON.parse(data)).toEqual({ message: 'Users list' })
            server.close()
            done()
          })
        })
      })
    })

    it('Router-level middleware', (done) => {
      const app = numflow()
      const apiRouter = numflow.Router()

      const middlewareExecuted: string[] = []

      apiRouter.use((_req, _res, next) => {
        middlewareExecuted.push('router-middleware')
        next()
      })

      apiRouter.get('/test', (_req, res) => {
        res.statusCode = 200
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ middlewareExecuted }))
      })

      app.use('/api', apiRouter)

      const server = app.listen(0, () => {
        const address = server.address() as any
        const port = address.port

        http.get(`http://localhost:${port}/api/test`, (res) => {
          let data = ''
          res.on('data', (chunk) => {
            data += chunk
          })
          res.on('end', () => {
            expect(res.statusCode).toBe(200)
            expect(JSON.parse(data).middlewareExecuted).toContain('router-middleware')
            server.close()
            done()
          })
        })
      })
    })

    it('Nested Router', (done) => {
      const app = numflow()
      const apiRouter = numflow.Router()
      const usersRouter = numflow.Router()

      usersRouter.get('/profile', (_req, res) => {
        res.statusCode = 200
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ message: 'User profile' }))
      })

      apiRouter.use('/users', usersRouter)
      app.use('/api', apiRouter)

      const server = app.listen(0, () => {
        const address = server.address() as any
        const port = address.port

        http.get(`http://localhost:${port}/api/users/profile`, (res) => {
          let data = ''
          res.on('data', (chunk) => {
            data += chunk
          })
          res.on('end', () => {
            expect(res.statusCode).toBe(200)
            expect(JSON.parse(data)).toEqual({ message: 'User profile' })
            server.close()
            done()
          })
        })
      })
    })

    it('Router dynamic parameters', (done) => {
      const app = numflow()
      const apiRouter = numflow.Router()

      apiRouter.get('/users/:id', (req, res) => {
        const params = (req as any).params
        res.statusCode = 200
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ userId: params.id }))
      })

      app.use('/api', apiRouter)

      const server = app.listen(0, () => {
        const address = server.address() as any
        const port = address.port

        http.get(`http://localhost:${port}/api/users/123`, (res) => {
          let data = ''
          res.on('data', (chunk) => {
            data += chunk
          })
          res.on('end', () => {
            expect(res.statusCode).toBe(200)
            expect(JSON.parse(data)).toEqual({ userId: '123' })
            server.close()
            done()
          })
        })
      })
    })

    it('should mount multiple Routers at different paths', (done) => {
      const app = numflow()
      const usersRouter = numflow.Router()
      const postsRouter = numflow.Router()

      usersRouter.get('/', (_req, res) => {
        res.statusCode = 200
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ resource: 'users' }))
      })

      postsRouter.get('/', (_req, res) => {
        res.statusCode = 200
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ resource: 'posts' }))
      })

      app.use('/users', usersRouter)
      app.use('/posts', postsRouter)

      const server = app.listen(0, () => {
        const address = server.address() as any
        const port = address.port

        http.get(`http://localhost:${port}/users`, (res) => {
          let data = ''
          res.on('data', (chunk) => {
            data += chunk
          })
          res.on('end', () => {
            expect(res.statusCode).toBe(200)
            expect(JSON.parse(data)).toEqual({ resource: 'users' })

            http.get(`http://localhost:${port}/posts`, (res) => {
              let data = ''
              res.on('data', (chunk) => {
                data += chunk
              })
              res.on('end', () => {
                expect(res.statusCode).toBe(200)
                expect(JSON.parse(data)).toEqual({ resource: 'posts' })
                server.close()
                done()
              })
            })
          })
        })
      })
    })
  })

  describe('Duplicate Route Check', () => {
    it('should throw error when registering same path and method twice', () => {
      const app = numflow()

      app.get('/users', (_req, res) => {
        res.end('First')
      })

      expect(() => {
        app.get('/users', (_req, res) => {
          res.end('Second')
        })
      }).toThrow('Duplicate route registration: GET /users')
    })

    it('should allow same path but different methods', () => {
      const app = numflow()

      expect(() => {
        app.get('/users', (_req, res) => {
          res.end('GET')
        })
        app.post('/users', (_req, res) => {
          res.end('POST')
        })
      }).not.toThrow()
    })

    it('should allow same method but different paths', () => {
      const app = numflow()

      expect(() => {
        app.get('/users', (_req, res) => {
          res.end('Users')
        })
        app.get('/posts', (_req, res) => {
          res.end('Posts')
        })
      }).not.toThrow()
    })

    it('should throw error when re-registering with same method after app.all()', () => {
      const app = numflow()

      app.all('/users', (_req, res) => {
        res.end('All')
      })

      expect(() => {
        app.get('/users', (_req, res) => {
          res.end('GET')
        })
      }).toThrow('Duplicate route registration: GET /users')
    })

    it('should throw error when duplicating same method in app.route() chaining', () => {
      const app = numflow()

      const routeChain = app.route('/users')
      routeChain.get((_req, res) => {
        res.end('First')
      })

      expect(() => {
        routeChain.get((_req, res) => {
          res.end('Second')
        })
      }).toThrow('Duplicate route registration: GET /users')
    })
  })

  describe('router.param()', () => {
    it('should register parameter middleware on router', () => {
      const router = numflow.Router()
      const mockCallback = jest.fn((_req, _res, _next, _value) => {})

      router.param('id', mockCallback)

      // Verify callback is stored on router
      expect(router).toHaveProperty('paramCallbacks')
    })

    it('should call parameter middleware for routes in router', async () => {
      const app = numflow()
      const router = numflow.Router()
      let capturedValue = ''

      // Register param middleware on router
      router.param('id', (_req, _res, next, value) => {
        capturedValue = value
        next()
      })

      // Define route on router with parameter
      router.get('/:id', (req, res) => {
        res.json({ id: req.params!.id })
      })

      // Mount router
      app.use('/items', router)

      const server = app.listen(3907)

      try {
        const response = await new Promise<any>((resolve) => {
          http.get('http://localhost:3907/items/456', (res) => {
            let data = ''
            res.on('data', (chunk) => {
              data += chunk
            })
            res.on('end', () => {
              resolve({ status: res.statusCode, body: JSON.parse(data) })
            })
          })
        })

        expect(response.status).toBe(200)
        expect(capturedValue).toBe('456')
        expect(response.body.id).toBe('456')
      } finally {
        server.close()
      }
    })

    it('should call param middleware before route handler', async () => {
      const app = numflow()
      const router = numflow.Router()
      const callOrder: string[] = []

      router.param('id', (_req, _res, next) => {
        callOrder.push('param')
        next()
      })

      router.get('/:id', (_req, res) => {
        callOrder.push('route')
        res.json({ order: callOrder })
      })

      app.use('/test', router)

      const server = app.listen(3908)

      try {
        const response = await new Promise<any>((resolve) => {
          http.get('http://localhost:3908/test/1', (res) => {
            let data = ''
            res.on('data', (chunk) => {
              data += chunk
            })
            res.on('end', () => {
              resolve({ body: JSON.parse(data) })
            })
          })
        })

        expect(response.body.order).toEqual(['param', 'route'])
      } finally {
        server.close()
      }
    })

    it('should work with multiple routers', async () => {
      const app = numflow()
      const router1 = numflow.Router()
      const router2 = numflow.Router()
      const processed: Record<string, boolean> = {}

      router1.param('userId', (_req, _res, next) => {
        processed.router1 = true
        next()
      })

      router2.param('postId', (_req, _res, next) => {
        processed.router2 = true
        next()
      })

      router1.get('/:userId', (_req, res) => {
        res.json({ router: 'router1', processed })
      })

      router2.get('/:postId', (_req, res) => {
        res.json({ router: 'router2', processed })
      })

      app.use('/users', router1)
      app.use('/posts', router2)

      const server = app.listen(3909)

      try {
        // Test router1
        await new Promise<void>((resolve) => {
          http.get('http://localhost:3909/users/1', (res) => {
            let data = ''
            res.on('data', (chunk) => {
              data += chunk
            })
            res.on('end', () => {
              const body = JSON.parse(data)
              expect(body.processed.router1).toBe(true)
              resolve()
            })
          })
        })

        // Reset
        processed.router1 = false

        // Test router2
        await new Promise<void>((resolve) => {
          http.get('http://localhost:3909/posts/2', (res) => {
            let data = ''
            res.on('data', (chunk) => {
              data += chunk
            })
            res.on('end', () => {
              const body = JSON.parse(data)
              expect(body.processed.router2).toBe(true)
              resolve()
            })
          })
        })
      } finally {
        server.close()
      }
    })
  })
})
