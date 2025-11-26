/**
 * Express-style Error Middleware Tests
 *
 * Verifies that numflow supports Express-style error handling middleware
 * using app.use((err, req, res, next) => {...}) pattern.
 */

import numflow from '../src/index.js'

describe('Express-style Error Middleware', () => {
  describe('Basic error middleware registration', () => {
    it('should register error middleware with 4 parameters', async () => {
      const app = numflow()

      app.get('/error', () => {
        throw new Error('Test error')
      })

      // Express-style error middleware (4 parameters)
      app.use((err: Error, _req: any, res: any, _next: any) => {
        res.statusCode = 400
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ error: err.message }))
      })

      const response = await app.inject({ method: 'GET', url: '/error' })
      expect(response.statusCode).toBe(400)

      const body = JSON.parse(response.payload)
      expect(body.error).toBe('Test error')
    })

    it('should call error middleware when route throws error', async () => {
      const app = numflow()
      const errorHandlerMock = jest.fn()

      app.get('/throw', () => {
        throw new Error('Route error')
      })

      app.use((err: Error, _req: any, res: any, _next: any) => {
        errorHandlerMock(err.message)
        res.statusCode = 500
        res.end('Error handled')
      })

      await app.inject({ method: 'GET', url: '/throw' })
      expect(errorHandlerMock).toHaveBeenCalledWith('Route error')
    })

    it('should use default error handler when no error middleware registered', async () => {
      const app = numflow()

      app.get('/error', () => {
        throw new Error('Unhandled error')
      })

      const response = await app.inject({ method: 'GET', url: '/error' })
      expect(response.statusCode).toBe(500)

      const body = JSON.parse(response.payload)
      expect(body.error.message).toBe('Unhandled error')
      expect(body.error.statusCode).toBe(500)
    })
  })

  describe('Error middleware with statusCode', () => {
    it('should respect error.statusCode property', async () => {
      const app = numflow()

      app.get('/not-found', () => {
        const err = new Error('User not found') as Error & { statusCode: number }
        err.statusCode = 404
        throw err
      })

      app.use((err: any, _req: any, res: any, _next: any) => {
        const statusCode = err.statusCode || 500
        res.statusCode = statusCode
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({
          error: err.message,
          statusCode
        }))
      })

      const response = await app.inject({ method: 'GET', url: '/not-found' })
      expect(response.statusCode).toBe(404)

      const body = JSON.parse(response.payload)
      expect(body.error).toBe('User not found')
      expect(body.statusCode).toBe(404)
    })
  })

  describe('Multiple error middlewares', () => {
    it('should call next error middleware when next(err) is called', async () => {
      const app = numflow()
      const firstHandler = jest.fn()
      const secondHandler = jest.fn()

      app.get('/error', () => {
        throw new Error('Test error')
      })

      // First error middleware - passes to next
      app.use((err: Error, _req: any, _res: any, next: any) => {
        firstHandler()
        next(err)
      })

      // Second error middleware - handles error
      app.use((_err: Error, _req: any, res: any, _next: any) => {
        secondHandler()
        res.statusCode = 500
        res.end('Handled by second middleware')
      })

      await app.inject({ method: 'GET', url: '/error' })
      expect(firstHandler).toHaveBeenCalled()
      expect(secondHandler).toHaveBeenCalled()
    })
  })

  describe('Error middleware with async handlers', () => {
    it('should catch errors from async route handlers', async () => {
      const app = numflow()

      app.get('/async-error', async () => {
        await Promise.resolve()
        throw new Error('Async error')
      })

      app.use((err: Error, _req: any, res: any, _next: any) => {
        res.statusCode = 500
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ error: err.message }))
      })

      const response = await app.inject({ method: 'GET', url: '/async-error' })
      expect(response.statusCode).toBe(500)

      const body = JSON.parse(response.payload)
      expect(body.error).toBe('Async error')
    })
  })

  describe('Error middleware with middleware chain', () => {
    it('should catch errors from regular middleware', async () => {
      const app = numflow()

      // Regular middleware that throws
      app.use((req: any, _res: any, next: any) => {
        if (req.url === '/protected') {
          throw new Error('Unauthorized')
        }
        next()
      })

      app.get('/protected', (_req: any, res: any) => {
        res.end('Should not reach here')
      })

      // Error middleware
      app.use((err: Error, _req: any, res: any, _next: any) => {
        res.statusCode = 401
        res.end(err.message)
      })

      const response = await app.inject({ method: 'GET', url: '/protected' })
      expect(response.statusCode).toBe(401)
      expect(response.payload).toBe('Unauthorized')
    })

    it('should catch errors passed via next(error)', async () => {
      const app = numflow()

      // Regular middleware that passes error via next()
      app.use((req: any, _res: any, next: any) => {
        if (req.url === '/error-next') {
          next(new Error('Error via next'))
          return
        }
        next()
      })

      app.get('/error-next', (_req: any, res: any) => {
        res.end('Should not reach here')
      })

      // Error middleware
      app.use((err: Error, _req: any, res: any, _next: any) => {
        res.statusCode = 500
        res.end(`Caught: ${err.message}`)
      })

      const response = await app.inject({ method: 'GET', url: '/error-next' })
      expect(response.statusCode).toBe(500)
      expect(response.payload).toBe('Caught: Error via next')
    })
  })

  describe('Path-specific error middleware', () => {
    it('should handle path-specific error middleware', async () => {
      const app = numflow()

      app.get('/api/error', () => {
        throw new Error('API error')
      })

      // Path-specific error middleware
      app.use('/api', (err: Error, _req: any, res: any, _next: any) => {
        res.statusCode = 500
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ apiError: err.message }))
      })

      const response = await app.inject({ method: 'GET', url: '/api/error' })
      expect(response.statusCode).toBe(500)

      const body = JSON.parse(response.payload)
      expect(body.apiError).toBe('API error')
    })
  })

  describe('Express compatibility', () => {
    it('should NOT have app.onError method (Express does not have it)', () => {
      const app = numflow()
      expect((app as any).onError).toBeUndefined()
    })

    it('should handle errors the same way as Express', async () => {
      const app = numflow()

      app.get('/users/:id', (_req: any, _res: any) => {
        const err = new Error('User not found') as Error & { statusCode: number }
        err.statusCode = 404
        throw err
      })

      // Standard Express error handling pattern
      app.use((err: any, _req: any, res: any, _next: any) => {
        const statusCode = err.statusCode || 500
        res.statusCode = statusCode
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({
          success: false,
          error: err.message,
          ...(err.code && { code: err.code }),
          ...(err.validationErrors && { validationErrors: err.validationErrors })
        }))
      })

      const response = await app.inject({ method: 'GET', url: '/users/123' })
      expect(response.statusCode).toBe(404)

      const body = JSON.parse(response.payload)
      expect(body.success).toBe(false)
      expect(body.error).toBe('User not found')
    })
  })
})
