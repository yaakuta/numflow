/**
 * Application Advanced Features Tests
 * Improve uncovered code coverage in application.ts
 */

import numflow, { Application } from '../src/index'
import http from 'http'

describe('Application Advanced Features', () => {
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

  describe('Body Parser Configuration', () => {
    it('should be able to disable body parsing with disableBodyParser()', (done) => {
      app = numflow()
      const port = 10000

      app.disableBodyParser()

      app.post('/test', (req: any, res) => {
        // Body parser is disabled, so req.body should be undefined
        res.json({ hasBody: req.body !== undefined })
      })

      server = app.listen(port, () => {
        const postData = JSON.stringify({ name: 'John' })

        const options = {
          method: 'POST',
          hostname: 'localhost',
          port: port,
          path: '/test',
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
            const body = JSON.parse(data)
            expect(body.hasBody).toBe(false)
            done()
          })
        })

        req.write(postData)
        req.end()
      })
    })

    it('should be able to configure body parser options with configureBodyParser()', (done) => {
      app = numflow()
      const port = 10001

      // Set limit option
      app.configureBodyParser({
        limit: '1kb',
      })

      app.post('/test', (req: any, res) => {
        res.json({ received: req.body })
      })

      server = app.listen(port, () => {
        const postData = JSON.stringify({ message: 'Hello' })

        const options = {
          method: 'POST',
          hostname: 'localhost',
          port: port,
          path: '/test',
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
            const body = JSON.parse(data)
            expect(body.received).toEqual({ message: 'Hello' })
            done()
          })
        })

        req.write(postData)
        req.end()
      })
    })

    it('should be able to set strict option with configureBodyParser()', (done) => {
      app = numflow()
      const port = 10002

      app.configureBodyParser({
        strict: false, // non-strict mode
      })

      app.post('/test', (req: any, res) => {
        res.json({ received: req.body })
      })

      server = app.listen(port, () => {
        const postData = JSON.stringify({ name: 'Alice' })

        const options = {
          method: 'POST',
          hostname: 'localhost',
          port: port,
          path: '/test',
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
            const body = JSON.parse(data)
            expect(body.received).toEqual({ name: 'Alice' })
            done()
          })
        })

        req.write(postData)
        req.end()
      })
    })

    it('should be able to chain disableBodyParser() and configureBodyParser()', (done) => {
      app = numflow()
      const port = 10003

      // Chaining test (disableBodyParser takes precedence)
      app.configureBodyParser({ limit: '10kb' }).disableBodyParser()

      app.post('/test', (req: any, res) => {
        res.json({ hasBody: req.body !== undefined })
      })

      server = app.listen(port, () => {
        const postData = JSON.stringify({ data: 'test' })

        const options = {
          method: 'POST',
          hostname: 'localhost',
          port: port,
          path: '/test',
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
            const body = JSON.parse(data)
            expect(body.hasBody).toBe(false)
            done()
          })
        })

        req.write(postData)
        req.end()
      })
    })
  })

  describe('HTTP Method Aliases', () => {
    it('should support app.put()', (done) => {
      app = numflow()
      const port = 10004

      app.put('/resource', (_req, res) => {
        res.json({ method: 'PUT' })
      })

      server = app.listen(port, () => {
        const options = {
          method: 'PUT',
          hostname: 'localhost',
          port: port,
          path: '/resource',
        }

        const req = http.request(options, (res) => {
          let data = ''
          res.on('data', (chunk) => {
            data += chunk
          })
          res.on('end', () => {
            const body = JSON.parse(data)
            expect(body.method).toBe('PUT')
            done()
          })
        })

        req.end()
      })
    })

    it('should support app.delete()', (done) => {
      app = numflow()
      const port = 10005

      app.delete('/resource', (_req, res) => {
        res.json({ method: 'DELETE' })
      })

      server = app.listen(port, () => {
        const options = {
          method: 'DELETE',
          hostname: 'localhost',
          port: port,
          path: '/resource',
        }

        const req = http.request(options, (res) => {
          let data = ''
          res.on('data', (chunk) => {
            data += chunk
          })
          res.on('end', () => {
            const body = JSON.parse(data)
            expect(body.method).toBe('DELETE')
            done()
          })
        })

        req.end()
      })
    })

    it('should support app.patch()', (done) => {
      app = numflow()
      const port = 10006

      app.patch('/resource', (_req, res) => {
        res.json({ method: 'PATCH' })
      })

      server = app.listen(port, () => {
        const options = {
          method: 'PATCH',
          hostname: 'localhost',
          port: port,
          path: '/resource',
        }

        const req = http.request(options, (res) => {
          let data = ''
          res.on('data', (chunk) => {
            data += chunk
          })
          res.on('end', () => {
            const body = JSON.parse(data)
            expect(body.method).toBe('PATCH')
            done()
          })
        })

        req.end()
      })
    })

    it('should support app.head()', (done) => {
      app = numflow()
      const port = 10007

      app.head('/resource', (_req, res) => {
        res.setHeader('X-Custom', 'Value')
        res.end()
      })

      server = app.listen(port, () => {
        const options = {
          method: 'HEAD',
          hostname: 'localhost',
          port: port,
          path: '/resource',
        }

        const req = http.request(options, (res) => {
          expect(res.headers['x-custom']).toBe('Value')
          done()
        })

        req.end()
      })
    })

    it('should support app.options()', (done) => {
      app = numflow()
      const port = 10008

      app.options('/resource', (_req, res) => {
        res.setHeader('Allow', 'GET, POST, PUT, DELETE')
        res.end()
      })

      server = app.listen(port, () => {
        const options = {
          method: 'OPTIONS',
          hostname: 'localhost',
          port: port,
          path: '/resource',
        }

        const req = http.request(options, (res) => {
          expect(res.headers['allow']).toBe('GET, POST, PUT, DELETE')
          done()
        })

        req.end()
      })
    })
  })

  describe('Response headersSent Handling', () => {
    it('should stop pipeline when response is sent in middleware and next() is called', (done) => {
      app = numflow()
      const port = 10009

      let routeCalled = false

      // Send response in middleware and call next()
      app.use((_req: any, res: any, next: any) => {
        res.status(200).send('Middleware response')
        next() // Call next() after sending response (incorrect usage but for testing)
      })

      // Route handler (should not be executed)
      app.get('/test', (_req: any, res: any) => {
        routeCalled = true
        res.send('Route response')
      })

      server = app.listen(port, () => {
        http.get(`http://localhost:${port}/test`, (res) => {
          let data = ''
          res.on('data', (chunk) => {
            data += chunk
          })
          res.on('end', () => {
            expect(data).toBe('Middleware response')
            expect(routeCalled).toBe(false)
            done()
          })
        })
      })
    })

    it('should stop middleware pipeline when response is already sent at next() call time', (done) => {
      app = numflow()
      const port = 10011

      let secondMiddlewareCalled = false

      // Send response in first middleware then call next()
      app.use((_req: any, res: any, next: any) => {
        res.end('First')
        next() // Call next() with res.headersSent being true
      })

      // Second middleware (should not be executed)
      app.use((_req: any, _res: any, next: any) => {
        secondMiddlewareCalled = true
        next()
      })

      server = app.listen(port, () => {
        http.get(`http://localhost:${port}/test`, (res) => {
          let data = ''
          res.on('data', (chunk) => {
            data += chunk
          })
          res.on('end', () => {
            expect(data).toBe('First')
            expect(secondMiddlewareCalled).toBe(false)
            done()
          })
        })
      })
    })
  })

  describe('Middleware Error Handling', () => {
    it('should forward errors thrown in middleware to error handler', (done) => {
      app = numflow()
      const port = 10010

      // Throw error in middleware (execute runMiddlewares catch block)
      app.use((_req: any, _res: any, _next: any) => {
        throw new Error('Middleware throw error')
      })

      // Error handler
      app.use((err: any, _req: any, res: any, _next: any) => {
        res.status(500).json({ error: err.message })
      })

      server = app.listen(port, () => {
        http.get(`http://localhost:${port}/test`, (res) => {
          let data = ''
          res.on('data', (chunk) => {
            data += chunk
          })
          res.on('end', () => {
            expect(res.statusCode).toBe(500)
            const body = JSON.parse(data)
            expect(body.error).toBe('Middleware throw error')
            done()
          })
        })
      })
    })
  })

  describe('app.router Property (Express compatibility)', () => {
    it('should expose internal router reference via app.router getter', () => {
      app = numflow()

      // app.router should return the internal router instance
      expect(app.router).toBeDefined()
      expect(typeof app.router).toBe('object')
    })

    it('should allow accessing router methods through app.router', () => {
      app = numflow()

      // Router should have standard methods
      expect(typeof app.router.get).toBe('function')
      expect(typeof app.router.post).toBe('function')
      expect(typeof app.router.put).toBe('function')
      expect(typeof app.router.delete).toBe('function')
    })

    it('should return the same router instance on multiple accesses', () => {
      app = numflow()

      const router1 = app.router
      const router2 = app.router

      // Should return the same instance (not create new ones)
      expect(router1).toBe(router2)
    })

    it('should work with routes registered via app.router', (done) => {
      app = numflow()
      const port = 10011

      // Register route directly via app.router
      app.router.get('/test', (_req: any, res: any) => {
        res.json({ message: 'Via app.router' })
      })

      server = app.listen(port, () => {
        http.get(`http://localhost:${port}/test`, (res) => {
          let data = ''
          res.on('data', (chunk) => {
            data += chunk
          })
          res.on('end', () => {
            expect(res.statusCode).toBe(200)
            const body = JSON.parse(data)
            expect(body.message).toBe('Via app.router')
            done()
          })
        })
      })
    })
  })

  describe('mount Event (Express compatibility)', () => {
    it('should emit mount event when sub-app is mounted', () => {
      const mainApp = numflow()
      const subApp = numflow()
      let mountEventFired = false
      let receivedParentApp: any = null

      // Listen for mount event on sub-app
      subApp.on('mount', (parent: any) => {
        mountEventFired = true
        receivedParentApp = parent
      })

      // Mount sub-app
      mainApp.use('/admin', subApp)

      // Verify mount event was fired
      expect(mountEventFired).toBe(true)
      expect(receivedParentApp).toBe(mainApp)
    })

    it('should provide parent app in mount event callback', () => {
      const mainApp = numflow()
      const subApp = numflow()
      let parentAppFromEvent: any = null

      // Set a property on main app to verify identity
      mainApp.set('test-id', 'main-app-123')

      subApp.on('mount', (parent: any) => {
        parentAppFromEvent = parent
      })

      mainApp.use('/api', subApp)

      // Verify we received the correct parent app
      expect(parentAppFromEvent).toBeDefined()
      expect(parentAppFromEvent.get('test-id')).toBe('main-app-123')
    })

    it('should emit mount event for each mount path', () => {
      const mainApp = numflow()
      const subApp = numflow()
      let mountEventCount = 0

      subApp.on('mount', () => {
        mountEventCount++
      })

      // Mount on multiple paths
      mainApp.use(['/path1', '/path2'], subApp)

      // Event should fire for each path
      expect(mountEventCount).toBe(2)
    })
  })
})
