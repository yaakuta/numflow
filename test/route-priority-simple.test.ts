/**
 * Route Priority Simple Tests
 *
 * Tests that find-my-way router handles route priority correctly
 * regardless of registration order
 */

import numbers from '../src/index.js'

describe('Route Priority - Router Tests', () => {
  it('should prioritize static route /blog/search over dynamic route /blog/:slug', async () => {
    const app = numbers()

    // Register in wrong order (dynamic first, then static)
    app.get('/blog/:slug', (req, res) => {
      res.json({ route: 'dynamic', slug: req.params?.slug })
    })

    app.get('/blog/search', (_req, res) => {
      res.json({ route: 'static' })
    })

    // Test: /blog/search should match static route
    const searchRes = await app.inject({
      method: 'GET',
      url: '/blog/search',
    })

    expect(searchRes.statusCode).toBe(200)
    const searchBody = JSON.parse(searchRes.body)
    expect(searchBody.route).toBe('static')

    // Test: /blog/hello should match dynamic route
    const slugRes = await app.inject({
      method: 'GET',
      url: '/blog/hello',
    })

    expect(slugRes.statusCode).toBe(200)
    const slugBody = JSON.parse(slugRes.body)
    expect(slugBody.route).toBe('dynamic')
    expect(slugBody.slug).toBe('hello')
  })

  it('should prioritize multiple static routes over dynamic routes', async () => {
    const app = numbers()

    // Register in wrong order (dynamic first)
    app.get('/blog/:slug', (req, res) => {
      res.json({ route: 'dynamic', slug: req.params?.slug })
    })

    app.get('/blog/search', (_req, res) => {
      res.json({ route: 'static', page: 'search' })
    })

    app.get('/blog/about', (_req, res) => {
      res.json({ route: 'static', page: 'about' })
    })

    app.get('/blog/contact', (_req, res) => {
      res.json({ route: 'static', page: 'contact' })
    })

    // Test all static routes
    const searchRes = await app.inject({ method: 'GET', url: '/blog/search' })
    expect(JSON.parse(searchRes.body).page).toBe('search')

    const aboutRes = await app.inject({ method: 'GET', url: '/blog/about' })
    expect(JSON.parse(aboutRes.body).page).toBe('about')

    const contactRes = await app.inject({ method: 'GET', url: '/blog/contact' })
    expect(JSON.parse(contactRes.body).page).toBe('contact')

    // Test dynamic route
    const slugRes = await app.inject({ method: 'GET', url: '/blog/my-post' })
    const slugBody = JSON.parse(slugRes.body)
    expect(slugBody.route).toBe('dynamic')
    expect(slugBody.slug).toBe('my-post')
  })

  it('should handle nested dynamic routes with correct priority', async () => {
    const app = numbers()

    // Register in wrong order (dynamic first)
    app.get('/users/:userId/posts/:postId', (req, res) => {
      res.json({ route: 'postId', userId: req.params?.userId, postId: req.params?.postId })
    })

    app.get('/users/:userId/posts/latest', (req, res) => {
      res.json({ route: 'latest', userId: req.params?.userId })
    })

    // /users/123/posts/latest should match static
    const latestRes = await app.inject({
      method: 'GET',
      url: '/users/123/posts/latest',
    })
    const latestBody = JSON.parse(latestRes.body)
    expect(latestBody.route).toBe('latest')
    expect(latestBody.userId).toBe('123')

    // /users/123/posts/456 should match dynamic
    const postRes = await app.inject({
      method: 'GET',
      url: '/users/123/posts/456',
    })
    const postBody = JSON.parse(postRes.body)
    expect(postBody.route).toBe('postId')
    expect(postBody.userId).toBe('123')
    expect(postBody.postId).toBe('456')
  })

  it('should prioritize routes: static > parametric > wildcard', async () => {
    const app = numbers()

    // Register in wrong order (wildcard, parametric, static)
    app.get('/api/*', (_req, res) => {
      res.json({ type: 'wildcard' })
    })

    app.get('/api/:action', (req, res) => {
      res.json({ type: 'parametric', action: req.params?.action })
    })

    app.get('/api/search', (_req, res) => {
      res.json({ type: 'static' })
    })

    // /api/search should match static
    const staticRes = await app.inject({ method: 'GET', url: '/api/search' })
    expect(JSON.parse(staticRes.body).type).toBe('static')

    // /api/list should match parametric
    const paramRes = await app.inject({ method: 'GET', url: '/api/list' })
    const paramBody = JSON.parse(paramRes.body)
    expect(paramBody.type).toBe('parametric')
    expect(paramBody.action).toBe('list')

    // /api/foo/bar should match wildcard
    const wildcardRes = await app.inject({ method: 'GET', url: '/api/foo/bar' })
    expect(JSON.parse(wildcardRes.body).type).toBe('wildcard')
  })
})
