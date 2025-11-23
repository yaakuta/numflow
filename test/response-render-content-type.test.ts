/**
 * Test: res.render() should preserve Content-Type set before render
 *
 * Bug: res.type("application/xml") is overwritten by res.render()
 *
 * Expected behavior:
 * - If Content-Type is already set, res.render() should NOT overwrite it
 * - If Content-Type is NOT set, res.render() should default to 'text/html; charset=utf-8'
 */

import numflow from '../src/index.js'
import * as path from 'path'
import * as fs from 'fs'

describe('res.render() Content-Type handling', () => {
  let testDir: string
  let app: ReturnType<typeof numflow>

  beforeEach(() => {
    testDir = path.join(process.cwd(), 'tmp-test-render-' + Date.now())
    fs.mkdirSync(testDir, { recursive: true })

    // Create views directory
    const viewsDir = path.join(testDir, 'views')
    fs.mkdirSync(viewsDir, { recursive: true })

    // Create test.xml.ejs template
    fs.writeFileSync(
      path.join(viewsDir, 'test.xml.ejs'),
      '<?xml version="1.0" encoding="UTF-8"?>\n<todos><% todos.forEach(todo => { %><todo><%= todo %></todo><% }) %></todos>'
    )

    // Create test.html.ejs template
    fs.writeFileSync(
      path.join(viewsDir, 'test.html.ejs'),
      '<html><body><h1>Todos</h1><ul><% todos.forEach(todo => { %><li><%= todo %></li><% }) %></ul></body></html>'
    )

    app = numflow()
    app.set('view engine', 'ejs')
    app.set('views', viewsDir)
  })

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true })
    }
  })

  describe('Content-Type preservation tests', () => {
    it('should preserve Content-Type set before res.render() (XML example)', async () => {
      // Register route that sets Content-Type BEFORE res.render()
      app.get('/test-xml', (_req, res) => {
        res.type('application/xml') // Set Content-Type first
        res.render('test.xml.ejs', { todos: ['Todo 1', 'Todo 2'] })
      })

      const response = await app.inject({
        method: 'GET',
        url: '/test-xml',
      })

      // SHOULD preserve 'application/xml' (res.type() doesn't add charset for XML)
      expect(response.headers['content-type']).toBe('application/xml')
      expect(response.body).toContain('<?xml version="1.0"')
      expect(response.body).toContain('<todos>')
    })

    it('should preserve Content-Type set with res.set() before res.render()', async () => {
      app.get('/test-custom', (_req, res) => {
        res.set('Content-Type', 'application/custom+xml; charset=iso-8859-1')
        res.render('test.xml.ejs', { todos: ['Test'] })
      })

      const response = await app.inject({
        method: 'GET',
        url: '/test-custom',
      })

      // SHOULD preserve custom Content-Type
      expect(response.headers['content-type']).toBe('application/custom+xml; charset=iso-8859-1')
    })

    it('should default to text/html when Content-Type is NOT set', async () => {
      // Don't set Content-Type before res.render()
      app.get('/test-default', (_req, res) => {
        res.render('test.html.ejs', { todos: ['Todo 1'] })
      })

      const response = await app.inject({
        method: 'GET',
        url: '/test-default',
      })

      // SHOULD default to 'text/html; charset=utf-8'
      expect(response.headers['content-type']).toBe('text/html; charset=utf-8')
      expect(response.body).toContain('<html>')
    })

    it('should work in Feature step handlers', async () => {
      // Create feature directory
      const featuresDir = path.join(testDir, 'features')
      const featureDir = path.join(featuresDir, 'test-xml/@get')
      const stepsDir = path.join(featureDir, 'steps')

      fs.mkdirSync(stepsDir, { recursive: true })

      // Create step that sets Content-Type before render
      fs.writeFileSync(
        path.join(stepsDir, '100-handler.js'),
        `module.exports = async (ctx, req, res) => {
  res.type("application/xml")
  res.render("test.xml.ejs", { todos: ctx.todos })
}`
      )

      // Create feature index.js
      fs.writeFileSync(
        path.join(featureDir, 'index.js'),
        `const { feature } = require('${path.join(process.cwd(), 'dist/cjs/index.js').replace(/\\/g, '/')}')
module.exports = feature({
  contextInitializer: (ctx) => {
    ctx.todos = ['Feature Todo 1', 'Feature Todo 2']
  }
})`
      )

      // Register features
      app.registerFeatures(featuresDir)

      const response = await app.inject({
        method: 'GET',
        url: '/test-xml',
      })

      // SHOULD preserve 'application/xml' (res.type() doesn't add charset for XML)
      expect(response.headers['content-type']).toBe('application/xml')
      expect(response.body).toContain('<?xml version="1.0"')
      expect(response.body).toContain('<todos>')
      expect(response.body).toContain('Feature Todo 1')
    })
  })

  describe('res.send() Content-Type preservation', () => {
    it('should preserve Content-Type for boolean', async () => {
      app.get('/test-boolean', (_req, res) => {
        res.type('application/json')
        res.send(true)
      })

      const response = await app.inject({
        method: 'GET',
        url: '/test-boolean',
      })

      expect(response.headers['content-type']).toBe('application/json; charset=utf-8')
      expect(response.body).toBe('true')
    })

    it('should preserve Content-Type for number', async () => {
      app.get('/test-number', (_req, res) => {
        res.set('Content-Type', 'text/plain; charset=iso-8859-1')
        res.send(42)
      })

      const response = await app.inject({
        method: 'GET',
        url: '/test-number',
      })

      expect(response.headers['content-type']).toBe('text/plain; charset=iso-8859-1')
      expect(response.body).toBe('42')
    })

    it('should default to text/plain for boolean when not set', async () => {
      app.get('/test-boolean-default', (_req, res) => {
        res.send(false)
      })

      const response = await app.inject({
        method: 'GET',
        url: '/test-boolean-default',
      })

      expect(response.headers['content-type']).toBe('text/plain; charset=utf-8')
      expect(response.body).toBe('false')
    })
  })
})
