/**
 * Middleware System Tests

 */

import numflow, { Application } from '../src/index'
import http from 'http'
import { Layer } from '../src/layer'
import { Request, Response, NextFunction } from '../src/types'

describe('Middleware System', () => {
  // ============================================================================
  // 1. Layer Class Tests
  // ============================================================================
  describe('Layer Class', () => {
    describe('Path Matching', () => {
      it('should match all paths for global middleware', () => {
        const handler = (_req: Request, _res: Response, next: NextFunction) => next()
        const layer = new Layer(handler)

        expect(layer.match('/')).toBe(true)
        expect(layer.match('/users')).toBe(true)
        expect(layer.match('/api/orders')).toBe(true)
      })

      it('should match exact paths', () => {
        const handler = (_req: Request, _res: Response, next: NextFunction) => next()
        const layer = new Layer(handler, '/users')

        expect(layer.match('/users')).toBe(true)
        expect(layer.match('/api')).toBe(false)
      })

      it('should support prefix matching', () => {
        const handler = (_req: Request, _res: Response, next: NextFunction) => next()
        const layer = new Layer(handler, '/api')

        expect(layer.match('/api')).toBe(true)
        expect(layer.match('/api/users')).toBe(true)
        expect(layer.match('/api/orders/123')).toBe(true)
        expect(layer.match('/users')).toBe(false)
      })
    })

    describe('Error Middleware Detection', () => {
      it('should detect error middleware with 4 parameters', () => {
        const errorHandler = (err: Error, _req: Request, res: Response, _next: NextFunction) => {
          res.status(500).json({ error: err.message })
        }
        const layer = new Layer(errorHandler)

        expect(layer.isError).toBe(true)
      })

      it('should detect normal middleware with 3 parameters', () => {
        const handler = (_req: Request, _res: Response, next: NextFunction) => next()
        const layer = new Layer(handler)

        expect(layer.isError).toBe(false)
      })
    })
  })

  // ============================================================================
  // 2. app.use() Tests
  // ============================================================================
  describe('app.use() Method', () => {
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

    it('should register global middleware', (done) => {
      app = numflow()
      const port = 3200
      let middlewareCalled = false

      app.use((_req: Request, _res: Response, next: NextFunction) => {
        middlewareCalled = true
        next()
      })

      app.get('/test', (_req: Request, res: Response) => {
        res.json({ success: true, middlewareCalled })
      })

      server = app.listen(port, () => {
        http.get(`http://localhost:${port}/test`, (res) => {
          let data = ''
          res.on('data', (chunk) => {
            data += chunk
          })
          res.on('end', () => {
            const result = JSON.parse(data)
            expect(result.middlewareCalled).toBe(true)
            done()
          })
        })
      })
    })

    it('should register path-specific middleware', (done) => {
      app = numflow()
      const port = 3201
      let apiMiddlewareCalled = false

      app.use('/api', (_req: Request, _res: Response, next: NextFunction) => {
        apiMiddlewareCalled = true
        next()
      })

      app.get('/api/users', (_req: Request, res: Response) => {
        res.json({ success: true, apiMiddlewareCalled })
      })

      server = app.listen(port, () => {
        http.get(`http://localhost:${port}/api/users`, (res) => {
          let data = ''
          res.on('data', (chunk) => {
            data += chunk
          })
          res.on('end', () => {
            const result = JSON.parse(data)
            expect(result.apiMiddlewareCalled).toBe(true)
            done()
          })
        })
      })
    })

    it('should register multiple middleware', (done) => {
      app = numflow()
      const port = 3202
      const callOrder: number[] = []

      app.use(
        (_req: Request, _res: Response, next: NextFunction) => {
          callOrder.push(1)
          next()
        },
        (_req: Request, _res: Response, next: NextFunction) => {
          callOrder.push(2)
          next()
        },
        (_req: Request, _res: Response, next: NextFunction) => {
          callOrder.push(3)
          next()
        }
      )

      app.get('/test', (_req: Request, res: Response) => {
        res.json({ callOrder })
      })

      server = app.listen(port, () => {
        http.get(`http://localhost:${port}/test`, (res) => {
          let data = ''
          res.on('data', (chunk) => {
            data += chunk
          })
          res.on('end', () => {
            const result = JSON.parse(data)
            expect(result.callOrder).toEqual([1, 2, 3])
            done()
          })
        })
      })
    })

  })

  describe('app.use() Chaining', () => {
    it('should support chaining', () => {
      const app = numflow()
      const result = app.use((_req: Request, _res: Response, next: NextFunction) => next())
      expect(result).toBe(app)
    })
  })

  // ============================================================================
  // 3. next() Function Tests
  // ============================================================================
  describe('next() Function', () => {
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

    it('should execute middleware sequentially', (done) => {
      app = numflow()
      const port = 3203
      const executionOrder: string[] = []

      app.use((_req: Request, _res: Response, next: NextFunction) => {
        executionOrder.push('middleware1')
        next()
      })

      app.use((_req: Request, _res: Response, next: NextFunction) => {
        executionOrder.push('middleware2')
        next()
      })

      app.get('/test', (_req: Request, res: Response) => {
        executionOrder.push('handler')
        res.json({ executionOrder })
      })

      server = app.listen(port, () => {
        http.get(`http://localhost:${port}/test`, (res) => {
          let data = ''
          res.on('data', (chunk) => {
            data += chunk
          })
          res.on('end', () => {
            const result = JSON.parse(data)
            expect(result.executionOrder).toEqual(['middleware1', 'middleware2', 'handler'])
            done()
          })
        })
      })
    })

    it('should not execute next middleware if next() is not called', (done) => {
      app = numflow()
      const port = 3204
      let secondMiddlewareCalled = false

      app.use((_req: Request, res: Response, _next: NextFunction) => {
        res.json({ success: true })
        // Not calling next()
      })

      app.use((_req: Request, _res: Response, next: NextFunction) => {
        secondMiddlewareCalled = true
        next()
      })

      app.get('/test', (_req: Request, res: Response) => {
        res.json({ secondMiddlewareCalled })
      })

      server = app.listen(port, () => {
        http.get(`http://localhost:${port}/test`, (res) => {
          let data = ''
          res.on('data', (chunk) => {
            data += chunk
          })
          res.on('end', () => {
            const result = JSON.parse(data)
            expect(result.success).toBe(true)
            expect(result.secondMiddlewareCalled).toBeUndefined()
            done()
          })
        })
      })
    })

    it('should propagate errors with next(error)', (done) => {
      app = numflow()
      const port = 3205

      app.use((_req: Request, _res: Response, next: NextFunction) => {
        next(new Error('Test error'))
      })

      app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
        res.status(500).json({ error: err.message })
      })

      app.get('/test', (_req: Request, res: Response) => {
        res.json({ success: true })
      })

      server = app.listen(port, () => {
        http.get(`http://localhost:${port}/test`, (res) => {
          let data = ''
          res.on('data', (chunk) => {
            data += chunk
          })
          res.on('end', () => {
            const result = JSON.parse(data)
            expect(result.error).toBe('Test error')
            done()
          })
        })
      })
    })
  })

  // ============================================================================
  // 4. Route-specific Middleware Tests
  // ============================================================================
  describe('Route-specific Middleware', () => {
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

    it('should support middleware in GET routes', (done) => {
      app = numflow()
      const port = 3206
      let authCalled = false

      const auth = (_req: Request, _res: Response, next: NextFunction) => {
        authCalled = true
        next()
      }

      app.get('/protected', auth, (_req: Request, res: Response) => {
        res.json({ success: true, authCalled })
      })

      server = app.listen(port, () => {
        http.get(`http://localhost:${port}/protected`, (res) => {
          let data = ''
          res.on('data', (chunk) => {
            data += chunk
          })
          res.on('end', () => {
            const result = JSON.parse(data)
            expect(result.authCalled).toBe(true)
            done()
          })
        })
      })
    })

    it('should support multiple middleware in routes', (done) => {
      app = numflow()
      const port = 3207
      const callOrder: string[] = []

      const auth = (_req: Request, _res: Response, next: NextFunction) => {
        callOrder.push('auth')
        next()
      }

      const validate = (_req: Request, _res: Response, next: NextFunction) => {
        callOrder.push('validate')
        next()
      }

      const logger = (_req: Request, _res: Response, next: NextFunction) => {
        callOrder.push('logger')
        next()
      }

      app.post('/users', auth, validate, logger, (_req: Request, res: Response) => {
        res.json({ callOrder })
      })

      server = app.listen(port, () => {
        const postData = JSON.stringify({ name: 'Test' })
        const options = {
          hostname: 'localhost',
          port,
          path: '/users',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData),
          },
        }

        const req = http.request(options, (res) => {
          let data = ''
          res.on('data', (chunk) => {
            data += chunk
          })
          res.on('end', () => {
            const result = JSON.parse(data)
            expect(result.callOrder).toEqual(['auth', 'validate', 'logger'])
            done()
          })
        })

        req.write(postData)
        req.end()
      })
    })

    it('should support middleware in route chaining', (done) => {
      app = numflow()
      const port = 3208
      let middlewareCalled = false

      const middleware = (_req: Request, _res: Response, next: NextFunction) => {
        middlewareCalled = true
        next()
      }

      app
        .route('/users')
        .get(middleware, (_req: Request, res: Response) => {
          res.json({ method: 'GET', middlewareCalled })
        })
        .post(middleware, (_req: Request, res: Response) => {
          res.json({ method: 'POST', middlewareCalled })
        })

      server = app.listen(port, () => {
        http.get(`http://localhost:${port}/users`, (res) => {
          let data = ''
          res.on('data', (chunk) => {
            data += chunk
          })
          res.on('end', () => {
            const result = JSON.parse(data)
            expect(result.method).toBe('GET')
            expect(result.middlewareCalled).toBe(true)
            done()
          })
        })
      })
    })
  })

  // ============================================================================
  // 5. Error Middleware Tests
  // ============================================================================
  describe('Error Middleware', () => {
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

    it('should execute error middleware on error', (done) => {
      app = numflow()
      const port = 3209

      app.use((_req: Request, _res: Response, _next: NextFunction) => {
        throw new Error('Middleware error')
      })

      app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
        res.status(500).json({ error: err.message })
      })

      app.get('/test', (_req: Request, res: Response) => {
        res.json({ success: true })
      })

      server = app.listen(port, () => {
        http.get(`http://localhost:${port}/test`, (res) => {
          let data = ''
          res.on('data', (chunk) => {
            data += chunk
          })
          res.on('end', () => {
            const result = JSON.parse(data)
            expect(result.error).toBe('Middleware error')
            done()
          })
        })
      })
    })

    it('should skip normal middleware when error exists', (done) => {
      app = numflow()
      const port = 3210
      let normalMiddlewareCalled = false

      app.use((_req: Request, _res: Response, next: NextFunction) => {
        next(new Error('Test error'))
      })

      app.use((_req: Request, _res: Response, next: NextFunction) => {
        normalMiddlewareCalled = true
        next()
      })

      app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
        res.status(500).json({ error: err.message, normalMiddlewareCalled })
      })

      app.get('/test', (_req: Request, res: Response) => {
        res.json({ success: true })
      })

      server = app.listen(port, () => {
        http.get(`http://localhost:${port}/test`, (res) => {
          let data = ''
          res.on('data', (chunk) => {
            data += chunk
          })
          res.on('end', () => {
            const result = JSON.parse(data)
            expect(result.error).toBe('Test error')
            expect(result.normalMiddlewareCalled).toBe(false)
            done()
          })
        })
      })
    })

    it('should skip error middleware when no error exists', (done) => {
      app = numflow()
      const port = 3211
      let errorMiddlewareCalled = false

      app.use((_req: Request, _res: Response, next: NextFunction) => {
        next()
      })

      app.use((_err: Error, _req: Request, res: Response, _next: NextFunction) => {
        errorMiddlewareCalled = true
        res.status(500).json({ error: 'error' })
      })

      app.get('/test', (_req: Request, res: Response) => {
        res.json({ success: true, errorMiddlewareCalled })
      })

      server = app.listen(port, () => {
        http.get(`http://localhost:${port}/test`, (res) => {
          let data = ''
          res.on('data', (chunk) => {
            data += chunk
          })
          res.on('end', () => {
            const result = JSON.parse(data)
            expect(result.success).toBe(true)
            expect(result.errorMiddlewareCalled).toBe(false)
            done()
          })
        })
      })
    })
  })

  // ============================================================================
  // 6. Express Compatibility Tests
  // ============================================================================
  describe('Express Compatibility', () => {
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

    it('should support modifying req object', (done) => {
      app = numflow()
      const port = 3213

      app.use((req: any, _res: Response, next: NextFunction) => {
        req.customProperty = 'test value'
        next()
      })

      app.get('/test', (req: any, res: Response) => {
        res.json({ customProperty: req.customProperty })
      })

      server = app.listen(port, () => {
        http.get(`http://localhost:${port}/test`, (res) => {
          let data = ''
          res.on('data', (chunk) => {
            data += chunk
          })
          res.on('end', () => {
            const result = JSON.parse(data)
            expect(result.customProperty).toBe('test value')
            done()
          })
        })
      })
    })

    it('should support passing data through res.locals', (done) => {
      app = numflow()
      const port = 3214

      app.use((_req: Request, res: any, next: NextFunction) => {
        res.locals = res.locals || {}
        res.locals.user = { id: 1, name: 'Test User' }
        next()
      })

      app.get('/test', (_req: Request, res: any) => {
        res.json({ user: res.locals?.user })
      })

      server = app.listen(port, () => {
        http.get(`http://localhost:${port}/test`, (res) => {
          let data = ''
          res.on('data', (chunk) => {
            data += chunk
          })
          res.on('end', () => {
            const result = JSON.parse(data)
            expect(result.user).toEqual({ id: 1, name: 'Test User' })
            done()
          })
        })
      })
    })
  })

  // ============================================================================
  // 7. Async Middleware Tests
  // ============================================================================
  describe('Async Middleware', () => {
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

    it('should support async/await middleware', (done) => {
      app = numflow()
      const port = 3215

      app.use(async (req: any, _res: Response, next: NextFunction) => {
        await new Promise((resolve) => setTimeout(resolve, 10))
        req.asyncData = 'loaded'
        next()
      })

      app.get('/test', (req: any, res: Response) => {
        res.json({ asyncData: req.asyncData })
      })

      server = app.listen(port, () => {
        http.get(`http://localhost:${port}/test`, (res) => {
          let data = ''
          res.on('data', (chunk) => {
            data += chunk
          })
          res.on('end', () => {
            const result = JSON.parse(data)
            expect(result.asyncData).toBe('loaded')
            done()
          })
        })
      })
    })

    it('should support Promise-returning middleware', (done) => {
      app = numflow()
      const port = 3216

      app.use((req: any, _res: Response, next: NextFunction) => {
        return Promise.resolve()
          .then(() => {
            req.promiseData = 'resolved'
            next()
          })
          .catch(next)
      })

      app.get('/test', (req: any, res: Response) => {
        res.json({ promiseData: req.promiseData })
      })

      server = app.listen(port, () => {
        http.get(`http://localhost:${port}/test`, (res) => {
          let data = ''
          res.on('data', (chunk) => {
            data += chunk
          })
          res.on('end', () => {
            const result = JSON.parse(data)
            expect(result.promiseData).toBe('resolved')
            done()
          })
        })
      })
    })
  })
})
