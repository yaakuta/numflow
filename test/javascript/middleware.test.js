/**
 * JavaScript middleware tests
 *

 * Type-safe middleware tests using JSDoc
 */

const numflow = require('../../dist/cjs/index.js')
const http = require('http')

/**
 * @typedef {import('../../dist/cjs/index.js').Application} Application
 * @typedef {import('../../dist/cjs/index.js').Request} Request
 * @typedef {import('../../dist/cjs/index.js').Response} Response
 * @typedef {import('../../dist/cjs/index.js').NextFunction} NextFunction
 */

/**
 * HTTP request helper
 * @param {string} method
 * @param {string} path
 * @param {Object} [options]
 * @returns {Promise<{statusCode: number, body: string, headers: Object}>}
 */
function request(method, path, options = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        method,
        hostname: 'localhost',
        port: 3335,
        path,
        headers: options.headers || {},
      },
      (res) => {
        let body = ''
        res.on('data', (chunk) => {
          body += chunk
        })
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            body,
            headers: res.headers,
          })
        })
      }
    )

    req.on('error', reject)

    if (options.body) {
      req.write(JSON.stringify(options.body))
    }

    req.end()
  })
}

describe('JavaScript - Middleware', () => {
  /** @type {Application} */
  let app
  /** @type {import('http').Server} */
  let server

  beforeAll((done) => {
    app = numflow()

    // Global middleware
    /**
     * @param {Request} req
     * @param {Response} res
     * @param {NextFunction} next
     */
    app.use((req, res, next) => {
      req.timestamp = Date.now()
      next()
    })

    // Logging middleware
    /**
     * @param {Request} req
     * @param {Response} res
     * @param {NextFunction} next
     */
    app.use((req, res, next) => {
      req.requestId = Math.random().toString(36).substring(7)
      next()
    })

    // Path-specific middleware
    /**
     * @param {Request} req
     * @param {Response} res
     * @param {NextFunction} next
     */
    app.use('/api', (req, res, next) => {
      req.apiVersion = 'v1'
      next()
    })

    // Authentication middleware
    /**
     * @param {Request} req
     * @param {Response} res
     * @param {NextFunction} next
     */
    function authMiddleware(req, res, next) {
      const token = req.get('Authorization')
      if (!token || !token.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' })
      }
      req.user = { id: 1, name: 'Test User' }
      next()
    }

    // Route
    app.get('/', (req, res) => {
      res.json({
        timestamp: req.timestamp,
        requestId: req.requestId,
      })
    })

    app.get('/api/data', (req, res) => {
      res.json({
        apiVersion: req.apiVersion,
        timestamp: req.timestamp,
      })
    })

    app.get('/protected', authMiddleware, (req, res) => {
      res.json({
        message: 'Protected data',
        user: req.user,
      })
    })

    // Error middleware
    /**
     * @param {Error} err
     * @param {Request} req
     * @param {Response} res
     * @param {NextFunction} next
     */
    app.use((err, req, res, next) => {
      res.status(500).json({ error: err.message })
    })

    server = app.listen(3335, done)
  })

  afterAll((done) => {
    server.close(done)
  })

  it('should execute global middleware', async () => {
    const res = await request('GET', '/')
    expect(res.statusCode).toBe(200)
    const data = JSON.parse(res.body)
    expect(data.timestamp).toBeDefined()
    expect(data.requestId).toBeDefined()
  })

  it('should execute path-specific middleware', async () => {
    const res = await request('GET', '/api/data')
    expect(res.statusCode).toBe(200)
    const data = JSON.parse(res.body)
    expect(data.apiVersion).toBe('v1')
    expect(data.timestamp).toBeDefined()
  })

  it('should block unauthorized requests', async () => {
    const res = await request('GET', '/protected')
    expect(res.statusCode).toBe(401)
    const data = JSON.parse(res.body)
    expect(data.error).toBe('Unauthorized')
  })

  it('should allow authorized requests', async () => {
    const res = await request('GET', '/protected', {
      headers: { Authorization: 'Bearer test-token' },
    })
    expect(res.statusCode).toBe(200)
    const data = JSON.parse(res.body)
    expect(data.message).toBe('Protected data')
    expect(data.user).toBeDefined()
    expect(data.user.name).toBe('Test User')
  })

  it('should execute middleware in order', async () => {
    const res = await request('GET', '/')
    expect(res.statusCode).toBe(200)
    const data = JSON.parse(res.body)

    // timestamp set in first middleware
    expect(data.timestamp).toBeDefined()
    expect(typeof data.timestamp).toBe('number')

    // requestId set in second middleware
    expect(data.requestId).toBeDefined()
    expect(typeof data.requestId).toBe('string')
  })
})
