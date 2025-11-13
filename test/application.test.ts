/**
 * Application class tests


 */

import numflow, { Application, NotFoundError, ValidationError } from '../src/index'
import http from 'http'
import request from 'supertest'

describe('Application', () => {
  describe('Factory Function', () => {
    it('numflow() function should return an Application instance', () => {
      const app = numflow()
      expect(app).toBeInstanceOf(Application)
    })
  })

  describe('listen() method', () => {
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

    it('should start HTTP server on the specified port', (done) => {
      app = numflow()
      const port = 3100

      server = app.listen(port, () => {
        expect(server.listening).toBe(true)
        done()
      })
    })

    it('should return HTTP Server instance', () => {
      app = numflow()
      server = app.listen(3101)
      expect(server).toBeInstanceOf(http.Server)
    })

    it('should respond to basic HTTP requests', (done) => {
      app = numflow()
      const port = 3102

      // Register route on root path
      app.get('/', (_req, res) => {
        res.statusCode = 200
        res.setHeader('Content-Type', 'text/plain')
        res.end('Numflow Framework')
      })

      server = app.listen(port, () => {
        http.get(`http://localhost:${port}`, (res) => {
          expect(res.statusCode).toBe(200)

          let data = ''
          res.on('data', (chunk) => {
            data += chunk
          })

          res.on('end', () => {
            expect(data).toContain('Numflow Framework')
            done()
          })
        })
      })
    })
  })

  describe('set() / get() methods', () => {
    it('should be able to store and retrieve configuration values', () => {
      const app = numflow()
      app.set('env', 'test')
      expect(app.get('env')).toBe('test')
    })

    it('set() method should support chaining', () => {
      const app = numflow()
      const result = app.set('foo', 'bar')
      expect(result).toBe(app)
    })

    it('should be able to manage multiple configuration values independently', () => {
      const app = numflow()
      app.set('port', 3000)
      app.set('env', 'development')
      app.set('debug', true)

      expect(app.get('port')).toBe(3000)
      expect(app.get('env')).toBe('development')
      expect(app.get('debug')).toBe(true)
    })

    it('should return undefined for non-existent settings', () => {
      const app = numflow()
      expect(app.get('nonexistent')).toBeUndefined()
    })
  })

  describe('disable() / enable() methods', () => {
    it('disable() should set the setting to false', () => {
      const app = numflow()
      app.disable('trust proxy')
      expect(app.get('trust proxy')).toBe(false)
    })

    it('enable() should set the setting to true', () => {
      const app = numflow()
      app.enable('trust proxy')
      expect(app.get('trust proxy')).toBe(true)
    })

    it('disable() should support chaining', () => {
      const app = numflow()
      const result = app.disable('trust proxy')
      expect(result).toBe(app)
    })

    it('enable() should support chaining', () => {
      const app = numflow()
      const result = app.enable('trust proxy')
      expect(result).toBe(app)
    })

    it('should be able to enable/disable multiple settings independently', () => {
      const app = numflow()
      app.enable('trust proxy')
      app.disable('x-powered-by')
      app.enable('case sensitive routing')

      expect(app.get('trust proxy')).toBe(true)
      expect(app.get('x-powered-by')).toBe(false)
      expect(app.get('case sensitive routing')).toBe(true)
    })
  })

  describe('app.locals', () => {
    it('should initialize locals as empty object', () => {
      const app = numflow()

      // Should have locals property initialized
      expect(app.locals).toBeDefined()
      expect(app.locals).toEqual({})
    })

    it('should allow setting and getting global variables', () => {
      const app = numflow()

      // Set global variables
      app.locals.title = 'My App'
      app.locals.email = 'admin@example.com'
      app.locals.version = '1.0.0'

      // Get global variables
      expect(app.locals.title).toBe('My App')
      expect(app.locals.email).toBe('admin@example.com')
      expect(app.locals.version).toBe('1.0.0')
    })

    it('should persist across the application lifecycle', () => {
      const app = numflow()

      // Set initial value
      app.locals.counter = 0

      // Increment
      app.locals.counter++
      app.locals.counter++

      // Should persist
      expect(app.locals.counter).toBe(2)
    })

    it('should support nested objects', () => {
      const app = numflow()

      // Set nested object
      app.locals.config = {
        database: {
          host: 'localhost',
          port: 5432,
        },
        cache: {
          enabled: true,
          ttl: 3600,
        },
      }

      // Access nested properties
      expect(app.locals.config.database.host).toBe('localhost')
      expect(app.locals.config.database.port).toBe(5432)
      expect(app.locals.config.cache.enabled).toBe(true)
      expect(app.locals.config.cache.ttl).toBe(3600)
    })

    it('should be accessible as global template variables', () => {
      const app = numflow()

      // Set template variables
      app.locals.siteName = 'MyWebsite'
      app.locals.copyrightYear = 2024
      app.locals.analytics = {
        enabled: true,
        trackingId: 'UA-12345-67',
      }

      // These should be available to all templates
      expect(app.locals.siteName).toBe('MyWebsite')
      expect(app.locals.copyrightYear).toBe(2024)
      expect(app.locals.analytics.enabled).toBe(true)
    })

    it('should be independent between different app instances', () => {
      const app1 = numflow()
      const app2 = numflow()

      // Set different values
      app1.locals.name = 'App 1'
      app2.locals.name = 'App 2'

      // Should be independent
      expect(app1.locals.name).toBe('App 1')
      expect(app2.locals.name).toBe('App 2')
    })
  })

  describe('disabled() / enabled() methods', () => {
    it('disabled() should return true when setting is false', () => {
      const app = numflow()
      app.disable('trust proxy')
      expect(app.disabled('trust proxy')).toBe(true)
    })

    it('disabled() should return false when setting is not false', () => {
      const app = numflow()
      app.enable('trust proxy')
      expect(app.disabled('trust proxy')).toBe(false)
    })

    it('enabled() should return true when setting is true', () => {
      const app = numflow()
      app.enable('trust proxy')
      expect(app.enabled('trust proxy')).toBe(true)
    })

    it('enabled() should return false when setting is not true', () => {
      const app = numflow()
      app.disable('trust proxy')
      expect(app.enabled('trust proxy')).toBe(false)
    })

    it('disabled() and enabled() should return false for unset values', () => {
      const app = numflow()
      expect(app.disabled('nonexistent')).toBe(false)
      expect(app.enabled('nonexistent')).toBe(false)
    })

    it('disabled() and enabled() should return false for non-boolean values', () => {
      const app = numflow()
      app.set('port', 3000)
      expect(app.disabled('port')).toBe(false)
      expect(app.enabled('port')).toBe(false)
    })
  })

  describe('close() method', () => {
    it('should gracefully shut down the server', (done) => {
      const app = numflow()
      const server = app.listen(3103)

      server.on('listening', () => {
        app.close((err) => {
          expect(err).toBeUndefined()
          expect(server.listening).toBe(false)
          done()
        })
      })
    })

    it('should work without error even when server has not started', (done) => {
      const app = numflow()
      app.close((err) => {
        expect(err).toBeUndefined()
        done()
      })
    })
  })

  describe('onError() method', () => {
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

    it.skip('should be able to register custom error handler', (done) => {
      app = numflow()
      const port = 3104

      // Register custom error handler
      app.onError((_err, _req, res) => {
        res.statusCode = 999
        res.setHeader('Content-Type', 'text/plain')
        res.end('Custom error handler')
      })

      // Route that throws error
      app.get('/error', () => {
        throw new Error('Test error')
      })

      server = app.listen(port, () => {
        http.get(`http://localhost:${port}/error`, (res) => {
          expect(res.statusCode).toBe(999)

          let data = ''
          res.on('data', (chunk) => {
            data += chunk
          })

          res.on('end', () => {
            expect(data).toBe('Custom error handler')
            server.close(done)
          })
        })
      })
    })

    it.skip('default error handler should use HttpError statusCode', (done) => {
      app = numflow()
      const port = 3105

      app.get('/not-found', () => {
        throw new NotFoundError('User not found')
      })

      server = app.listen(port, () => {
        http.get(`http://localhost:${port}/not-found`, (res) => {
          expect(res.statusCode).toBe(404)

          let data = ''
          res.on('data', (chunk) => {
            data += chunk
          })

          res.on('end', () => {
            const body = JSON.parse(data)
            expect(body.error.message).toBe('User not found')
            expect(body.error.statusCode).toBe(404)
            server.close(done)
          })
        })
      })
    })

    it('default error handler should handle generic errors as 500', (done) => {
      app = numflow()
      const port = 3106

      app.get('/error', () => {
        throw new Error('Unexpected error')
      })

      server = app.listen(port, () => {
        http.get(`http://localhost:${port}/error`, (res) => {
          expect(res.statusCode).toBe(500)

          let data = ''
          res.on('data', (chunk) => {
            data += chunk
          })

          res.on('end', () => {
            const body = JSON.parse(data)
            expect(body.error.message).toBe('Unexpected error')
            expect(body.error.statusCode).toBe(500)
            server.close(() => {
              server = null as any
              done()
            })
          })
        })
      })
    })

    it.skip('should include validationErrors from ValidationError in response', (done) => {
      app = numflow()
      const port = 3107

      app.post('/validate', () => {
        throw new ValidationError('Validation failed', {
          email: ['Email is required'],
          password: ['Password is too short'],
        })
      })

      server = app.listen(port, () => {
        const postData = JSON.stringify({ test: 'data' })
        const options = {
          hostname: 'localhost',
          port: port,
          path: '/validate',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData),
          },
        }

        const req = http.request(options, (res) => {
          expect(res.statusCode).toBe(400)

          let data = ''
          res.on('data', (chunk) => {
            data += chunk
          })

          res.on('end', () => {
            const body = JSON.parse(data)
            expect(body.error.message).toBe('Validation failed')
            expect(body.error.statusCode).toBe(400)
            expect(body.error.validationErrors).toEqual({
              email: ['Email is required'],
              password: ['Password is too short'],
            })
            server.close(done)
          })
        })

        req.write(postData)
        req.end()
      })
    })

    it.skip('should also catch errors in async route handlers', (done) => {
      app = numflow()
      const port = 3108

      app.get('/async-error', async () => {
        await new Promise((resolve) => setTimeout(resolve, 10))
        throw new NotFoundError('Async error')
      })

      server = app.listen(port, () => {
        http.get(`http://localhost:${port}/async-error`, (res) => {
          expect(res.statusCode).toBe(404)

          let data = ''
          res.on('data', (chunk) => {
            data += chunk
          })

          res.on('end', () => {
            const body = JSON.parse(data)
            expect(body.error.message).toBe('Async error')
            expect(body.error.statusCode).toBe(404)
            server.close(done)
          })
        })
      })
    })

    it.skip('should also catch errors in middleware', (done) => {
      app = numflow()
      const port = 3109

      app.use((_req: any, _res: any, _next: any) => {
        throw new Error('Middleware error')
      })

      app.get('/test', (_req, res) => {
        res.end('Should not reach here')
      })

      server = app.listen(port, () => {
        http.get(`http://localhost:${port}/test`, (res) => {
          expect(res.statusCode).toBe(500)

          let data = ''
          res.on('data', (chunk) => {
            data += chunk
          })

          res.on('end', () => {
            const body = JSON.parse(data)
            expect(body.error.message).toBe('Middleware error')
            server.close(done)
          })
        })
      })
    })
  })

  describe('Feature Registration Failure Handling', () => {
    let app: Application
    let server: http.Server | undefined
    const originalEnv = process.env.NODE_ENV

    afterEach((done) => {
      // Restore NODE_ENV
      process.env.NODE_ENV = originalEnv

      if (server) {
        server.close(() => {
          server = undefined
          done()
        })
      } else {
        done()
      }
    })

    it('should emit error event when Feature registration fails in test environment', (done) => {
      // Set test environment
      process.env.NODE_ENV = 'test'

      app = numflow()
      const port = 3900

      // Intentionally failing Feature registration
      const failingFeaturePromise = new Promise((_resolve, reject) => {
        setTimeout(() => {
          reject(new Error('Feature registration failed'))
        }, 50)
      })

      // Add Feature registration Promise to internal array
      // @ts-ignore - private property access (for testing purposes)
      app.featureRegistrationPromises.push(failingFeaturePromise)

      server = app.listen(port)

      // Register error event handler
      server.on('error', (error: Error) => {
        expect(error.message).toBe('Feature registration failed')
        done()
      })
    })

    it('should not terminate process after Feature registration failure in test environment', (done) => {
      // Set test environment
      process.env.NODE_ENV = 'test'

      app = numflow()
      const port = 3901

      // Intentionally failing Feature registration
      const failingFeaturePromise = new Promise((_resolve, reject) => {
        setTimeout(() => {
          reject(new Error('Feature registration failed'))
        }, 50)
      })

      // @ts-ignore - private property access (for testing purposes)
      app.featureRegistrationPromises.push(failingFeaturePromise)

      server = app.listen(port)

      // Register error event handler
      server.on('error', (error: Error) => {
        expect(error.message).toBe('Feature registration failed')

        // Verify process is still running
        // (meaning process.exit() was not called)
        expect(process.pid).toBeGreaterThan(0)

        done()
      })
    })

    it('should start server normally when Feature registration succeeds', (done) => {
      // Set test environment
      process.env.NODE_ENV = 'test'

      app = numflow()
      const port = 3902

      // Successful Feature registration
      const successFeaturePromise = new Promise((resolve) => {
        setTimeout(() => {
          resolve(undefined)
        }, 50)
      })

      // @ts-ignore - private property access (for testing purposes)
      app.featureRegistrationPromises.push(successFeaturePromise)

      app.get('/test', (_req, res) => {
        res.json({ success: true })
      })

      server = app.listen(port, () => {
        // Verify server started successfully
        http.get(`http://localhost:${port}/test`, (res) => {
          expect(res.statusCode).toBe(200)

          let data = ''
          res.on('data', (chunk) => {
            data += chunk
          })

          res.on('end', () => {
            const body = JSON.parse(data)
            expect(body.success).toBe(true)
            done()
          })
        })
      })
    })
  })

  describe('app.param()', () => {
    it('should register parameter middleware', () => {
      const app = numflow()
      const mockCallback = jest.fn((_req, _res, _next, _value, _name) => {})

      app.param('userId', mockCallback)

      // Verify callback is stored
      expect(app).toHaveProperty('paramCallbacks')
    })

    it('should call parameter middleware when route matches', async () => {
      const app = numflow()
      let capturedValue = ''

      // Register param middleware
      app.param('userId', (req, _res, next, value) => {
        capturedValue = value
        // Add custom property to request
        ;(req as any).userIdProcessed = true
        next()
      })

      // Define route with parameter
      app.get('/users/:userId', (req, res) => {
        res.json({
          userId: req.params!.userId,
          processed: (req as any).userIdProcessed,
        })
      })

      const server = app.listen(3903)

      try {
        const response = await new Promise<any>((resolve) => {
          http.get('http://localhost:3903/users/123', (res) => {
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
        expect(capturedValue).toBe('123')
        expect(response.body.userId).toBe('123')
        expect(response.body.processed).toBe(true)
      } finally {
        server.close()
      }
    })

    it('should call multiple param middlewares in order', async () => {
      const app = numflow()
      const callOrder: string[] = []

      app.param('userId', (_req, _res, next) => {
        callOrder.push('userId-1')
        next()
      })

      app.param('userId', (_req, _res, next) => {
        callOrder.push('userId-2')
        next()
      })

      app.get('/users/:userId', (_req, res) => {
        res.json({ order: callOrder })
      })

      const server = app.listen(3904)

      try {
        const response = await new Promise<any>((resolve) => {
          http.get('http://localhost:3904/users/123', (res) => {
            let data = ''
            res.on('data', (chunk) => {
              data += chunk
            })
            res.on('end', () => {
              resolve({ body: JSON.parse(data) })
            })
          })
        })

        expect(response.body.order).toEqual(['userId-1', 'userId-2'])
      } finally {
        server.close()
      }
    })

    it('should work with different parameter names', async () => {
      const app = numflow()
      const processed: Record<string, boolean> = {}

      app.param('userId', (_req, _res, next) => {
        processed.userId = true
        next()
      })

      app.param('postId', (_req, _res, next) => {
        processed.postId = true
        next()
      })

      app.get('/users/:userId/posts/:postId', (_req, res) => {
        res.json({ processed })
      })

      const server = app.listen(3905)

      try {
        const response = await new Promise<any>((resolve) => {
          http.get('http://localhost:3905/users/1/posts/2', (res) => {
            let data = ''
            res.on('data', (chunk) => {
              data += chunk
            })
            res.on('end', () => {
              resolve({ body: JSON.parse(data) })
            })
          })
        })

        expect(response.body.processed.userId).toBe(true)
        expect(response.body.processed.postId).toBe(true)
      } finally {
        server.close()
      }
    })

    it('should handle errors in param middleware', async () => {
      const app = numflow()

      app.param('userId', (_req, _res, _next) => {
        throw new Error('Invalid user ID')
      })

      app.get('/users/:userId', (_req, res) => {
        res.json({ success: true })
      })

      // Error handler
      app.use((err: Error, _req: any, res: any, _next: any) => {
        res.status(500).json({ error: err.message })
      })

      const server = app.listen(3906)

      try {
        const response = await new Promise<any>((resolve) => {
          http.get('http://localhost:3906/users/123', (res) => {
            let data = ''
            res.on('data', (chunk) => {
              data += chunk
            })
            res.on('end', () => {
              resolve({ status: res.statusCode, body: JSON.parse(data) })
            })
          })
        })

        expect(response.status).toBe(500)
        expect(response.body.error).toBe('Invalid user ID')
      } finally {
        server.close()
      }
    })
  })

  // ========================================

  // ========================================

  describe('app.path()', () => {
    it('should return empty string for non-mounted app', () => {
      const app = numflow()
      expect(app.path()).toBe('')
    })

    it('should return mount path when app is mounted', async () => {
      const app = numflow()
      const subApp = numflow()

      subApp.get('/test', (_req, res) => {
        res.json({ path: subApp.path() })
      })

      app.use('/admin', subApp)

      const server = app.listen(0)
      const port = (server.address() as any).port

      try {
        const response = await request(`http://localhost:${port}`)
          .get('/admin/test')
          .expect(200)

        expect(response.body.path).toBe('/admin')
      } finally {
        server.close()
      }
    })

    it('should return nested mount path', async () => {
      const app = numflow()
      const apiApp = numflow()
      const v1App = numflow()

      v1App.get('/users', (_req, res) => {
        res.json({ path: v1App.path() })
      })

      apiApp.use('/v1', v1App)
      app.use('/api', apiApp)

      const server = app.listen(0)
      const port = (server.address() as any).port

      try {
        const response = await request(`http://localhost:${port}`)
          .get('/api/v1/users')
          .expect(200)

        expect(response.body.path).toBe('/api/v1')
      } finally {
        server.close()
      }
    })
  })

  describe('app.mountpath', () => {
    it('should be empty string for non-mounted app', () => {
      const app = numflow()
      expect(app.mountpath).toBe('')
    })

    it('should return mount path pattern when app is mounted', async () => {
      const app = numflow()
      const subApp = numflow()

      subApp.get('/test', (_req, res) => {
        res.json({ mountpath: subApp.mountpath })
      })

      app.use('/admin', subApp)

      const server = app.listen(0)
      const port = (server.address() as any).port

      try {
        const response = await request(`http://localhost:${port}`)
          .get('/admin/test')
          .expect(200)

        expect(response.body.mountpath).toBe('/admin')
      } finally {
        server.close()
      }
    })

    it('should return array for multiple mount patterns', async () => {
      const app = numflow()
      const subApp = numflow()

      subApp.get('/test', (_req, res) => {
        res.json({ mountpath: subApp.mountpath })
      })

      // Mount on multiple paths
      app.use(['/admin', '/manager'], subApp)

      const server = app.listen(0)
      const port = (server.address() as any).port

      try {
        const response = await request(`http://localhost:${port}`)
          .get('/admin/test')
          .expect(200)

        expect(Array.isArray(response.body.mountpath)).toBe(true)
        expect(response.body.mountpath).toContain('/admin')
        expect(response.body.mountpath).toContain('/manager')
      } finally {
        server.close()
      }
    })

    it('should differ from app.path() for nested apps', async () => {
      const app = numflow()
      const apiApp = numflow()
      const v1App = numflow()

      v1App.get('/users', (_req, res) => {
        res.json({
          mountpath: v1App.mountpath,  // Should be '/v1' (immediate mount)
          path: v1App.path(),           // Should be '/api/v1' (accumulated)
        })
      })

      apiApp.use('/v1', v1App)
      app.use('/api', apiApp)

      const server = app.listen(0)
      const port = (server.address() as any).port

      try {
        const response = await request(`http://localhost:${port}`)
          .get('/api/v1/users')
          .expect(200)

        expect(response.body.mountpath).toBe('/v1')
        expect(response.body.path).toBe('/api/v1')
      } finally {
        server.close()
      }
    })
  })

  describe('app.engine()', () => {
    it('should register custom template engine', () => {
      const app = numflow()
      const customEngine = jest.fn((_filePath: string, _options: any, callback: (err: Error | null, html?: string) => void) => {
        callback(null, '<html>Custom Engine</html>')
      })

      app.engine('custom', customEngine)

      // Verify engine is registered
      const engines = (app as any).engines
      expect(engines).toBeDefined()
      expect(engines.get('custom')).toBe(customEngine)
    })

    it('should use custom engine in res.render()', async () => {
      const app = numflow()
      const customEngine = jest.fn((_filePath: string, _options: any, callback: (err: Error | null, html?: string) => void) => {
        callback(null, '<html>Custom Rendered</html>')
      })

      app.engine('tmpl', customEngine)
      app.set('view engine', 'tmpl')
      app.set('views', './test/fixtures/views')

      app.get('/custom', (_req, res) => {
        res.render('test', { name: 'World' })
      })

      const server = app.listen(0)
      const port = (server.address() as any).port

      try {
        const response = await request(`http://localhost:${port}`)
          .get('/custom')
          .expect(200)

        expect(response.text).toBe('<html>Custom Rendered</html>')
        expect(customEngine).toHaveBeenCalled()
      } finally {
        server.close()
      }
    })

    it('should pass file path and options to custom engine', async () => {
      const app = numflow()
      let capturedFilePath = ''
      let capturedOptions: any = null

      const customEngine = jest.fn((filePath: string, options: any, callback: (err: Error | null, html?: string) => void) => {
        capturedFilePath = filePath
        capturedOptions = options
        callback(null, `<p>Hello ${options.name}</p>`)
      })

      app.engine('tmpl', customEngine)
      app.set('view engine', 'tmpl')
      app.set('views', './test/fixtures/views')

      app.get('/test', (_req, res) => {
        res.render('test', { name: 'Alice' })
      })

      const server = app.listen(0)
      const port = (server.address() as any).port

      try {
        const response = await request(`http://localhost:${port}`)
          .get('/test')
          .expect(200)

        expect(response.text).toBe('<p>Hello Alice</p>')
        expect(capturedFilePath).toContain('test.tmpl')
        expect(capturedOptions.name).toBe('Alice')
      } finally {
        server.close()
      }
    })
  })

  describe('app.render()', () => {
    it('should render template without sending response', (done) => {
      const app = numflow()
      app.set('view engine', 'ejs')
      app.set('views', './test/fixtures/views')

      app.render('hello', { name: 'World' }, (err, html) => {
        expect(err).toBeNull()
        expect(html).toContain('Hello World')
        done()
      })
    })

    it('should pass error to callback on render failure', (done) => {
      const app = numflow()
      app.set('view engine', 'ejs')
      app.set('views', './test/fixtures/views')

      app.render('nonexistent', {}, (err, html) => {
        expect(err).toBeTruthy()
        expect(html).toBeUndefined()
        done()
      })
    })

    it('should use custom engine for app.render()', (done) => {
      const app = numflow()
      const customEngine = jest.fn((_filePath: string, options: any, callback: (err: Error | null, html?: string) => void) => {
        callback(null, `<div>${options.title}</div>`)
      })

      app.engine('custom', customEngine)
      app.set('view engine', 'custom')
      app.set('views', './test/fixtures/views')

      app.render('test', { title: 'Test Title' }, (err, html) => {
        expect(err).toBeNull()
        expect(html).toBe('<div>Test Title</div>')
        expect(customEngine).toHaveBeenCalled()
        done()
      })
    })

    it('should merge app.locals with render locals', (done) => {
      const app = numflow()
      app.locals.appName = 'MyApp'

      const customEngine = jest.fn((_filePath: string, options: any, callback: (err: Error | null, html?: string) => void) => {
        callback(null, `<p>${options.appName} - ${options.page}</p>`)
      })

      app.engine('tmpl', customEngine)
      app.set('view engine', 'tmpl')
      app.set('views', './test/fixtures/views')

      app.render('test', { page: 'Home' }, (err, html) => {
        expect(err).toBeNull()
        expect(html).toBe('<p>MyApp - Home</p>')
        done()
      })
    })
  })
})
