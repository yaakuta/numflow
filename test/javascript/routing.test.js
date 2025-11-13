/**
 * JavaScript basic routing tests
 *

 * Type-safe test writing using JSDoc
 */

const numflow = require('../../dist/cjs/index.js')
const http = require('http')

/**
 * @typedef {import('../../dist/cjs/index.js').Application} Application
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
        port: 3333,
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

describe('JavaScript - Basic Routing', () => {
  /** @type {Application} */
  let app
  /** @type {import('http').Server} */
  let server

  beforeAll((done) => {
    app = numflow()

    // Hello World
    app.get('/', (req, res) => {
      res.send('Hello World')
    })

    // JSON Response
    app.get('/json', (req, res) => {
      res.json({ message: 'Hello JSON' })
    })

    // Route Parameters
    app.get('/users/:id', (req, res) => {
      res.json({ userId: req.params.id })
    })

    // Query Parameters
    app.get('/search', (req, res) => {
      res.json({ query: req.query })
    })

    // POST with Body
    app.post('/users', (req, res) => {
      res.json({ created: true, user: req.body })
    })

    server = app.listen(3333, done)
  })

  afterAll((done) => {
    server.close(done)
  })

  it('should handle GET /', async () => {
    const res = await request('GET', '/')
    expect(res.statusCode).toBe(200)
    expect(res.body).toBe('Hello World')
  })

  it('should handle GET /json', async () => {
    const res = await request('GET', '/json')
    expect(res.statusCode).toBe(200)
    const data = JSON.parse(res.body)
    expect(data.message).toBe('Hello JSON')
  })

  it('should handle route parameters', async () => {
    const res = await request('GET', '/users/123')
    expect(res.statusCode).toBe(200)
    const data = JSON.parse(res.body)
    expect(data.userId).toBe('123')
  })

  it('should handle query parameters', async () => {
    const res = await request('GET', '/search?q=test&page=1')
    expect(res.statusCode).toBe(200)
    const data = JSON.parse(res.body)
    expect(data.query.q).toBe('test')
    expect(data.query.page).toBe('1')
  })

  it('should handle POST with JSON body', async () => {
    const res = await request('POST', '/users', {
      headers: { 'Content-Type': 'application/json' },
      body: { name: 'Alice', email: 'alice@example.com' },
    })
    expect(res.statusCode).toBe(200)
    const data = JSON.parse(res.body)
    expect(data.created).toBe(true)
    expect(data.user.name).toBe('Alice')
    expect(data.user.email).toBe('alice@example.com')
  })
})
