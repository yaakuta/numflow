/**
 * Application.inject() method tests
 *
 * Tests for HTTP injection without starting the server
 * Using light-my-request for fast, socket-less testing
 */

import numflow from '../src/index'

describe('Application.inject()', () => {
  describe('Basic HTTP Methods', () => {
    it('should handle GET request', async () => {
      const app = numflow()

      app.get('/', (_req, res) => {
        res.statusCode = 200
        res.setHeader('Content-Type', 'text/plain')
        res.end('Hello World')
      })

      const response = await app.inject({
        method: 'GET',
        url: '/',
      })

      expect(response.statusCode).toBe(200)
      expect(response.payload).toBe('Hello World')
    })

    it('should handle POST request with JSON body', async () => {
      const app = numflow()

      app.post('/users', (req, res) => {
        res.statusCode = 200
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ created: true, user: req.body }))
      })

      const response = await app.inject({
        method: 'POST',
        url: '/users',
        payload: { name: 'John', age: 30 },
        headers: {
          'content-type': 'application/json',
        },
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.payload)
      expect(body.created).toBe(true)
      expect(body.user.name).toBe('John')
      expect(body.user.age).toBe(30)
    })

    it('should handle PUT request', async () => {
      const app = numflow()

      app.put('/users/:id', (req, res) => {
        res.statusCode = 200
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ updated: true, id: req.params!.id }))
      })

      const response = await app.inject({
        method: 'PUT',
        url: '/users/123',
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.payload)
      expect(body.updated).toBe(true)
      expect(body.id).toBe('123')
    })

    it('should handle DELETE request', async () => {
      const app = numflow()

      app.delete('/users/:id', (_req, res) => {
        res.statusCode = 204
        res.end()
      })

      const response = await app.inject({
        method: 'DELETE',
        url: '/users/123',
      })

      expect(response.statusCode).toBe(204)
    })
  })

  describe('Route Parameters', () => {
    it('should extract single route parameter', async () => {
      const app = numflow()

      app.get('/users/:id', (req, res) => {
        res.statusCode = 200
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ id: req.params!.id }))
      })

      const response = await app.inject({
        method: 'GET',
        url: '/users/456',
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.payload)
      expect(body.id).toBe('456')
    })

    it('should extract multiple route parameters', async () => {
      const app = numflow()

      app.get('/users/:userId/posts/:postId', (req, res) => {
        res.statusCode = 200
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({
          userId: req.params!.userId,
          postId: req.params!.postId,
        }))
      })

      const response = await app.inject({
        method: 'GET',
        url: '/users/123/posts/456',
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.payload)
      expect(body.userId).toBe('123')
      expect(body.postId).toBe('456')
    })
  })

  describe('Query Parameters', () => {
    it('should parse query parameters', async () => {
      const app = numflow()

      app.get('/search', (req, res) => {
        res.statusCode = 200
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({
          query: req.query!.q,
          page: req.query!.page,
          limit: req.query!.limit,
        }))
      })

      const response = await app.inject({
        method: 'GET',
        url: '/search?q=test&page=1&limit=10',
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.payload)
      expect(body.query).toBe('test')
      expect(body.page).toBe('1')
      expect(body.limit).toBe('10')
    })
  })

  describe('Middleware', () => {
    it('should execute middleware', async () => {
      const app = numflow()
      const middlewareCalls: string[] = []

      app.use((_req: any, _res: any, next: any) => {
        middlewareCalls.push('middleware1')
        next()
      })

      app.use((_req: any, _res: any, next: any) => {
        middlewareCalls.push('middleware2')
        next()
      })

      app.get('/', (_req, res) => {
        middlewareCalls.push('handler')
        res.statusCode = 200
        res.end('OK')
      })

      const response = await app.inject({
        method: 'GET',
        url: '/',
      })

      expect(response.statusCode).toBe(200)
      expect(middlewareCalls).toEqual(['middleware1', 'middleware2', 'handler'])
    })
  })

  describe('Error Handling', () => {
    it('should handle errors in route handler', async () => {
      const app = numflow()

      app.get('/error', (_req, _res) => {
        throw new Error('Test error')
      })

      const response = await app.inject({
        method: 'GET',
        url: '/error',
      })

      expect(response.statusCode).toBe(500)
    })

    it('should handle 404 errors', async () => {
      const app = numflow()

      app.get('/exists', (_req, res) => {
        res.statusCode = 200
        res.end('OK')
      })

      const response = await app.inject({
        method: 'GET',
        url: '/not-found',
      })

      expect(response.statusCode).toBe(404)
    })
  })

  describe('Response Extensions', () => {
    it('should work with res.json()', async () => {
      const app = numflow()

      app.get('/json', (_req, res) => {
        res.json({ message: 'Hello World' })
      })

      const response = await app.inject({
        method: 'GET',
        url: '/json',
      })

      expect(response.statusCode).toBe(200)
      expect(response.headers['content-type']).toContain('application/json')
      const body = JSON.parse(response.payload)
      expect(body.message).toBe('Hello World')
    })

    it('should work with res.status().json()', async () => {
      const app = numflow()

      app.post('/created', (_req, res) => {
        res.status(201).json({ created: true })
      })

      const response = await app.inject({
        method: 'POST',
        url: '/created',
      })

      expect(response.statusCode).toBe(201)
      const body = JSON.parse(response.payload)
      expect(body.created).toBe(true)
    })
  })

  describe('Callback Style', () => {
    it('should support callback style', (done) => {
      const app = numflow()

      app.get('/', (_req, res) => {
        res.statusCode = 200
        res.end('Callback Style')
      })

      app.inject({ method: 'GET', url: '/' }, (err, res) => {
        expect(err).toBeNull()
        expect(res!.statusCode).toBe(200)
        expect(res!.payload).toBe('Callback Style')
        done()
      })
    })
  })

  describe('Feature-First Integration', () => {
    it('should work with Feature routes registered via app.use()', async () => {
      const app = numflow()

      // Multi-step handler simulating Feature behavior
      const step1 = (req: any, _res: any, next: any) => {
        if (!req.body || !req.body.test) {
          _res.status(400).json({ error: 'Missing test field' })
          return
        }
        // Add to context (simulating Feature context)
        req.featureContext = { validated: true }
        next()
      }

      const step2 = (req: any, res: any) => {
        res.status(200).json({
          success: true,
          received: req.body.test,
          validated: req.featureContext?.validated || false,
          processedAt: new Date().toISOString()
        })
      }

      // Register route with multiple steps (Feature-like behavior)
      app.post('/api/feature-test', step1, step2)

      // inject() should handle this just like Feature routes
      const response = await app.inject({
        method: 'POST',
        url: '/api/feature-test',
        payload: { test: 'data' },
        headers: {
          'content-type': 'application/json',
        },
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.payload)
      expect(body.success).toBe(true)
      expect(body.received).toBe('data')
      expect(body.validated).toBe(true)
      expect(body.processedAt).toBeDefined()
    })
  })

  describe('Request Extensions', () => {
    it('should work with req.get()', async () => {
      const app = numflow()

      app.get('/headers', (req, res) => {
        const userAgent = req.get('user-agent')
        res.json({ userAgent })
      })

      const response = await app.inject({
        method: 'GET',
        url: '/headers',
        headers: {
          'user-agent': 'Numflow Test',
        },
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.payload)
      expect(body.userAgent).toBe('Numflow Test')
    })
  })
})
