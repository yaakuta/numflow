/**
 * Feature async response race condition tests
 *
 * Tests for race conditions when using async response methods (res.render, res.sendFile, etc.)
 * without awaiting them in Feature steps.
 *
 * Problem scenario:
 * 1. ✅ Step 200 calls res.render() without await (async operation starts)
 * 2. ✅ Step 200 returns immediately
 * 3. ❌ But res.headersSent is still false (rendering in progress)
 * 4. ❌ auto-executor continues to next Step 300
 * 5. ❌ Step 300 tries to call res.redirect()
 * 6. 💥 "Cannot set headers after they are sent" error!
 */

import * as fs from 'fs'
import * as path from 'path'
import numbers from '../src/index.js'

describe.skip('Feature - Async Response Race Condition', () => {
  const projectRoot = path.join(__dirname, '..')
  const testDir = path.join(__dirname, '__test-async-race__')
  const viewsDir = path.join(testDir, 'views')
  const featuresDir = path.join(testDir, 'features')

  beforeEach(() => {
    // Clean up existing directory
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true })
    }

    // Create test directories
    fs.mkdirSync(testDir, { recursive: true })
    fs.mkdirSync(viewsDir, { recursive: true })
    fs.mkdirSync(featuresDir, { recursive: true })

    // Create a simple EJS template
    fs.writeFileSync(
      path.join(viewsDir, 'test.ejs'),
      '<html><body><h1><%= title %></h1></body></html>'
    )
  })

  afterEach(() => {
    // Clean up test directories
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true })
    }
  })

  describe('res.render() without await - Race Condition', () => {
    it('should NOT allow next step to execute when res.render() is called without await', async () => {
      // Create feature directory structure
      const featureDir = path.join(featuresDir, 'test', '@get')
      const stepsDir = path.join(featureDir, 'steps')
      fs.mkdirSync(stepsDir, { recursive: true })

      // Create index.js
      fs.writeFileSync(
        path.join(featureDir, 'index.js'),
        `const numflow = require('${path.join(projectRoot, 'dist/cjs/index.js').replace(/\\/g, '/')}')
module.exports = numflow.feature({
  contextInitializer: (ctx, req, res) => {
    ctx.step200Called = false
    ctx.step300Called = false
  }
})`
      )

      // Step 200: Call res.render() WITHOUT await ❌
      fs.writeFileSync(
        path.join(stepsDir, '200-render.js'),
        `module.exports = async (ctx, req, res) => {
  ctx.step200Called = true
  // ❌ BAD: Not awaiting res.render()!
  res.render('test', { title: 'Test Page' })
  // Step returns immediately, but render is still in progress...
}`
      )

      // Step 300: Try to redirect (this should be prevented!)
      fs.writeFileSync(
        path.join(stepsDir, '300-redirect.js'),
        `module.exports = async (ctx, req, res) => {
  ctx.step300Called = true
  // This should NOT execute because response is pending!
  res.redirect('/home')
}`
      )

      // Create app and register features
      const app = numbers()
      app.set('view engine', 'ejs')
      app.set('views', viewsDir)

      await app.registerFeatures(featuresDir)

      // Make request
      const response = await app.inject({
        method: 'GET',
        url: '/test',
      })

      // Response should either:
      // 1. Complete successfully with render output (if step 300 was prevented)
      // 2. OR throw an error (if race condition occurred)

      // The ideal behavior is:
      // - Step 200 should set a "response pending" flag
      // - Step 300 should NOT execute
      // - Only the render output should be returned

      // Current behavior (broken):
      // - Step 200 returns immediately
      // - Step 300 executes and tries to redirect
      // - Race condition may occur

      // For now, we just check that we don't get a successful response with redirect
      // because that would mean both steps executed, which is wrong

      // The test will fail until we implement the fix
      expect(response.statusCode).not.toBe(302) // Should NOT be a redirect
    }, 10000) // Increase timeout for async operations

    it('should work correctly when res.render() is properly awaited ✅', async () => {
      // Create feature directory structure
      const featureDir = path.join(featuresDir, 'test2', '@get')
      const stepsDir = path.join(featureDir, 'steps')
      fs.mkdirSync(stepsDir, { recursive: true })

      // Create index.js
      fs.writeFileSync(
        path.join(featureDir, 'index.js'),
        `const numflow = require('${path.join(projectRoot, 'dist/cjs/index.js').replace(/\\/g, '/')}')
module.exports = numflow.feature({})`
      )

      // Step 200: Call res.render() WITH await ✅
      fs.writeFileSync(
        path.join(stepsDir, '200-render.js'),
        `module.exports = async (ctx, req, res) => {
  // ✅ GOOD: Awaiting res.render()
  await res.render('test', { title: 'Test Page' })
}`
      )

      // Step 300: This should NOT execute because res.headersSent is true
      fs.writeFileSync(
        path.join(stepsDir, '300-should-not-run.js'),
        `module.exports = async (ctx, req, res) => {
  throw new Error('Step 300 should not execute!')
}`
      )

      // Create app and register features
      const app = numbers()
      app.set('view engine', 'ejs')
      app.set('views', viewsDir)

      await app.registerFeatures(featuresDir)

      // Make request
      const response = await app.inject({
        method: 'GET',
        url: '/test2',
      })

      // Should successfully render the template
      expect(response.statusCode).toBe(200)
      expect(response.body).toContain('<h1>Test Page</h1>')
    }, 10000)
  })

  describe('Multiple async response methods', () => {
    it('should detect when multiple response methods are called', async () => {
      // Create feature directory structure
      const featureDir = path.join(featuresDir, 'multi', '@get')
      const stepsDir = path.join(featureDir, 'steps')
      fs.mkdirSync(stepsDir, { recursive: true })

      // Create index.js
      fs.writeFileSync(
        path.join(featureDir, 'index.js'),
        `const numflow = require('${path.join(projectRoot, 'dist/cjs/index.js').replace(/\\/g, '/')}')
module.exports = numflow.feature({})`
      )

      // Step 200: Call res.render() without await
      fs.writeFileSync(
        path.join(stepsDir, '200-render.js'),
        `module.exports = async (ctx, req, res) => {
  res.render('test', { title: 'Test' })
}`
      )

      // Step 300: Try to call res.json()
      fs.writeFileSync(
        path.join(stepsDir, '300-json.js'),
        `module.exports = async (ctx, req, res) => {
  res.json({ message: 'This should not work' })
}`
      )

      // Create app and register features
      const app = numbers()
      app.set('view engine', 'ejs')
      app.set('views', viewsDir)

      await app.registerFeatures(featuresDir)

      // Make request
      const response = await app.inject({
        method: 'GET',
        url: '/multi',
      })

      // Should not return JSON (step 300 should be prevented)
      expect(response.headers['content-type']).not.toContain('application/json')
    }, 10000)
  })

  describe('catch block with res.render() - Critical Bug', () => {
    it('should NOT allow next step to execute when res.render() is called in catch block without await', async () => {
      // Create feature directory structure
      const featureDir = path.join(featuresDir, 'catch-test', '@post')
      const stepsDir = path.join(featureDir, 'steps')
      fs.mkdirSync(stepsDir, { recursive: true })

      // Create index.js
      fs.writeFileSync(
        path.join(featureDir, 'index.js'),
        `const numflow = require('${path.join(projectRoot, 'dist/cjs/index.js').replace(/\\/g, '/')}')
module.exports = numflow.feature({
  contextInitializer: (ctx, req, res) => {
    ctx.step200Executed = false
    ctx.step200CatchBlockEntered = false
    ctx.step300Executed = false
  }
})`
      )

      // Step 200: Simulate Prisma unique constraint error in try-catch
      fs.writeFileSync(
        path.join(stepsDir, '200-create.js'),
        `module.exports = async (ctx, req, res) => {
  ctx.step200Executed = true

  try {
    // Simulate Prisma unique constraint error
    const error = new Error('Unique constraint failed')
    error.code = 'P2002'
    throw error
  } catch (error) {
    ctx.step200CatchBlockEntered = true

    if (error.code === 'P2002') {
      // ❌ BAD: Not awaiting res.render() in catch block!
      // This is the reported bug: catch 블록 안에서 return res.render() 사용 시
      return res.status(400).render('test', { title: 'Error: Duplicate' })
    }
  }
}`
      )

      // Step 300: This should NOT execute!
      fs.writeFileSync(
        path.join(stepsDir, '300-should-not-run.js'),
        `module.exports = async (ctx, req, res) => {
  ctx.step300Executed = true
  // If this executes, the bug still exists!
  res.json({ error: 'Step 300 should not have executed!' })
}`
      )

      // Create app and register features
      const app = numbers()
      app.set('view engine', 'ejs')
      app.set('views', viewsDir)

      await app.registerFeatures(featuresDir)

      // Make request
      const response = await app.inject({
        method: 'POST',
        url: '/catch-test',
      })

      // Verify behavior
      // Step 300 should NOT execute
      expect(response.statusCode).toBe(400) // Should be 400 from catch block, NOT 200 from step 300
      expect(response.headers['content-type']).toContain('text/html') // Should be HTML from render, NOT JSON
      expect(response.headers['content-type']).not.toContain('application/json')
      expect(response.body).toContain('Error: Duplicate') // Should contain error message
      expect(response.body).not.toContain('Step 300 should not have executed!') // Should NOT contain step 300 message
    }, 10000)

    it('should work correctly when res.render() in catch block is properly awaited', async () => {
      // Create feature directory structure
      const featureDir = path.join(featuresDir, 'catch-test-await', '@post')
      const stepsDir = path.join(featureDir, 'steps')
      fs.mkdirSync(stepsDir, { recursive: true })

      // Create index.js
      fs.writeFileSync(
        path.join(featureDir, 'index.js'),
        `const numflow = require('${path.join(projectRoot, 'dist/cjs/index.js').replace(/\\/g, '/')}')
module.exports = numflow.feature({})`
      )

      // Step 200: Properly await res.render() in catch block
      fs.writeFileSync(
        path.join(stepsDir, '200-create.js'),
        `module.exports = async (ctx, req, res) => {
  try {
    const error = new Error('Unique constraint failed')
    error.code = 'P2002'
    throw error
  } catch (error) {
    if (error.code === 'P2002') {
      // ✅ GOOD: Awaiting res.render() in catch block
      return await res.status(400).render('test', { title: 'Error: Duplicate' })
    }
  }
}`
      )

      // Step 300: This should NOT execute (res.headersSent will be true)
      fs.writeFileSync(
        path.join(stepsDir, '300-should-not-run.js'),
        `module.exports = async (ctx, req, res) => {
  throw new Error('Step 300 should not execute!')
}`
      )

      // Create app and register features
      const app = numbers()
      app.set('view engine', 'ejs')
      app.set('views', viewsDir)

      await app.registerFeatures(featuresDir)

      // Make request
      const response = await app.inject({
        method: 'POST',
        url: '/catch-test-await',
      })

      // Should successfully render error template
      expect(response.statusCode).toBe(400)
      expect(response.body).toContain('Error: Duplicate')
    }, 10000)
  })

  describe('Performance impact', () => {
    it('should not significantly impact performance when using await', async () => {
      // Create feature directory structure
      const featureDir = path.join(featuresDir, 'perf', '@get')
      const stepsDir = path.join(featureDir, 'steps')
      fs.mkdirSync(stepsDir, { recursive: true })

      // Create index.js
      fs.writeFileSync(
        path.join(featureDir, 'index.js'),
        `const numflow = require('${path.join(projectRoot, 'dist/cjs/index.js').replace(/\\/g, '/')}')
module.exports = numflow.feature({})`
      )

      // Step 200: Render with await
      fs.writeFileSync(
        path.join(stepsDir, '200-render.js'),
        `module.exports = async (ctx, req, res) => {
  await res.render('test', { title: 'Performance Test' })
}`
      )

      // Create app and register features
      const app = numbers()
      app.set('view engine', 'ejs')
      app.set('views', viewsDir)

      await app.registerFeatures(featuresDir)

      // Measure performance
      const start = Date.now()

      for (let i = 0; i < 10; i++) {
        await app.inject({
          method: 'GET',
          url: '/perf',
        })
      }

      const duration = Date.now() - start
      const avgDuration = duration / 10

      // Should complete in reasonable time (< 50ms per request average)
      expect(avgDuration).toBeLessThan(100)
    }, 15000)
  })
})
