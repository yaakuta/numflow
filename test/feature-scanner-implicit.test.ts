/**
 * Feature Scanner - Implicit Feature Tests
 *
  * Tests @ prefix method and implicit Feature creation.
 *
  * Test categories:
  * 1. Implicit Feature Detection
  * 2. Implicit Feature Creation
  * 3. Mixed Explicit and Implicit Features
  * 4. Reserved Word Conflict Resolution
  * 5. Real-world API Structures
 */

import * as path from 'path'
import * as fs from 'fs'
import { FeatureScanner } from '../src/feature/feature-scanner.js'

describe('Feature Scanner - Implicit Feature Tests', () => {
  let testDir: string

  beforeEach(() => {
    // Create temporary test directory
    testDir = path.join(process.cwd(), 'tmp-test-scanner-' + Date.now())
    fs.mkdirSync(testDir, { recursive: true })
  })

  afterEach(() => {
    // Clean up test directory
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true })
    }
  })

  // ==========================================
  // 1. Implicit Feature Detection
  // ==========================================
  describe('Implicit Feature Detection', () => {
    it('should detect implicit feature with @get and steps folder', async () => {
      const featuresDir = path.join(testDir, 'features')
      const featureDir = path.join(featuresDir, 'todos/@get')

      fs.mkdirSync(path.join(featureDir, 'steps'), { recursive: true })
      fs.writeFileSync(path.join(featureDir, 'steps/100-list.js'), 'module.exports = () => {}')

      const scanner = new FeatureScanner({ directory: featuresDir })
      const features = await scanner.scan()

      expect(features).toHaveLength(1)
      expect(features[0].relativePath).toContain('todos/@get')
    })

    it('should detect implicit feature with @post and async-tasks folder', async () => {
      const featuresDir = path.join(testDir, 'features')
      const featureDir = path.join(featuresDir, 'users/@post')

      fs.mkdirSync(path.join(featureDir, 'async-tasks'), { recursive: true })
      fs.writeFileSync(path.join(featureDir, 'async-tasks/send-email.js'), 'module.exports = () => {}')

      const scanner = new FeatureScanner({ directory: featuresDir })
      const features = await scanner.scan()

      expect(features).toHaveLength(1)
      expect(features[0].relativePath).toContain('users/@post')
    })

    it('should detect implicit feature with both steps and async-tasks', async () => {
      const featuresDir = path.join(testDir, 'features')
      const featureDir = path.join(featuresDir, 'orders/@post')

      fs.mkdirSync(path.join(featureDir, 'steps'), { recursive: true })
      fs.mkdirSync(path.join(featureDir, 'async-tasks'), { recursive: true })
      fs.writeFileSync(path.join(featureDir, 'steps/100-create.js'), 'module.exports = () => {}')
      fs.writeFileSync(path.join(featureDir, 'async-tasks/notify.js'), 'module.exports = () => {}')

      const scanner = new FeatureScanner({ directory: featuresDir })
      const features = await scanner.scan()

      expect(features).toHaveLength(1)
      const feature = features[0].feature
      const info = feature.getInfo()

      expect(info.method).toBe('POST')
      expect(info.path).toBe('/orders')
    })

    it('should NOT detect feature without steps or async-tasks', async () => {
      const featuresDir = path.join(testDir, 'features')
      const featureDir = path.join(featuresDir, 'todos/@get')

      // @get folder only, no steps/ async-tasks/
      fs.mkdirSync(featureDir, { recursive: true })

      const scanner = new FeatureScanner({ directory: featuresDir })
      const features = await scanner.scan()

      expect(features).toHaveLength(0)
    })

    it('should NOT detect feature without @ prefix', async () => {
      const featuresDir = path.join(testDir, 'features')
      const featureDir = path.join(featuresDir, 'todos/get')

      // No @ prefix
      fs.mkdirSync(path.join(featureDir, 'steps'), { recursive: true })
      fs.writeFileSync(path.join(featureDir, 'steps/100-list.js'), 'module.exports = () => {}')

      const scanner = new FeatureScanner({ directory: featuresDir })
      const features = await scanner.scan()

      // Not recognized as Feature without @ prefix
      expect(features).toHaveLength(0)
    })
  })

  // ==========================================
  // 2. Implicit Feature Creation
  // ==========================================
  describe('Implicit Feature Creation', () => {
    it('should create feature with correct method and path', async () => {
      const featuresDir = path.join(testDir, 'features')
      const featureDir = path.join(featuresDir, 'api/v1/users/@get')

      fs.mkdirSync(path.join(featureDir, 'steps'), { recursive: true })
      fs.writeFileSync(path.join(featureDir, 'steps/100-list.js'), 'module.exports = () => {}')

      const scanner = new FeatureScanner({ directory: featuresDir })
      const features = await scanner.scan()

      expect(features).toHaveLength(1)
      const info = features[0].feature.getInfo()

      expect(info.method).toBe('GET')
      expect(info.path).toBe('/api/v1/users')
    })

    it('should create feature with dynamic routes', async () => {
      const featuresDir = path.join(testDir, 'features')
      const featureDir = path.join(featuresDir, 'users/[id]/@get')

      fs.mkdirSync(path.join(featureDir, 'steps'), { recursive: true })
      fs.writeFileSync(path.join(featureDir, 'steps/100-detail.js'), 'module.exports = () => {}')

      const scanner = new FeatureScanner({ directory: featuresDir })
      const features = await scanner.scan()

      expect(features).toHaveLength(1)
      const info = features[0].feature.getInfo()

      expect(info.method).toBe('GET')
      expect(info.path).toBe('/users/:id')
    })

    it('should create multiple implicit features', async () => {
      const featuresDir = path.join(testDir, 'features')

      // Feature 1: GET /users
      const feature1Dir = path.join(featuresDir, 'users/@get')
      fs.mkdirSync(path.join(feature1Dir, 'steps'), { recursive: true })
      fs.writeFileSync(path.join(feature1Dir, 'steps/100-list.js'), 'module.exports = () => {}')

      // Feature 2: POST /users
      const feature2Dir = path.join(featuresDir, 'users/@post')
      fs.mkdirSync(path.join(feature2Dir, 'steps'), { recursive: true })
      fs.writeFileSync(path.join(feature2Dir, 'steps/100-create.js'), 'module.exports = () => {}')

      // Feature 3: GET /users/:id
      const feature3Dir = path.join(featuresDir, 'users/[id]/@get')
      fs.mkdirSync(path.join(feature3Dir, 'steps'), { recursive: true })
      fs.writeFileSync(path.join(feature3Dir, 'steps/100-detail.js'), 'module.exports = () => {}')

      const scanner = new FeatureScanner({ directory: featuresDir })
      const features = await scanner.scan()

      expect(features).toHaveLength(3)

      const paths = features.map(f => f.feature.getInfo().path).sort()
      expect(paths).toEqual(['/users', '/users', '/users/:id'])

      const methods = features.map(f => f.feature.getInfo().method).sort()
      expect(methods).toEqual(['GET', 'GET', 'POST'])
    })
  })

  // ==========================================
  // 3. Mixed Explicit and Implicit Features
  // ==========================================
  describe('Mixed Explicit and Implicit Features', () => {
    it('should handle explicit feature (with index.js) and implicit feature together', async () => {
      const featuresDir = path.join(testDir, 'features')

      // Explicit Feature: POST /users (with index.js)
      const explicitDir = path.join(featuresDir, 'users/@post')
      fs.mkdirSync(path.join(explicitDir, 'steps'), { recursive: true })
      fs.writeFileSync(path.join(explicitDir, 'index.js'), `
        // Mock Feature object for testing
        module.exports = {
          getHandler: () => (req, res, next) => next(),
          getInfo: () => ({ method: 'POST', path: '/users' }),
          initialize: async () => {},
          config: { method: 'POST', path: '/users' }
        }
      `)
      fs.writeFileSync(path.join(explicitDir, 'steps/100-create.js'), 'module.exports = () => {}')

      // Implicit Feature: GET /users (no index.js)
      const implicitDir = path.join(featuresDir, 'users/@get')
      fs.mkdirSync(path.join(implicitDir, 'steps'), { recursive: true })
      fs.writeFileSync(path.join(implicitDir, 'steps/100-list.js'), 'module.exports = () => {}')

      const scanner = new FeatureScanner({ directory: featuresDir })
      const features = await scanner.scan()

      expect(features).toHaveLength(2)
    })

    it('should prioritize index.js over implicit detection', async () => {
      const featuresDir = path.join(testDir, 'features')
      const featureDir = path.join(featuresDir, 'users/@get')

      // Both index.js and steps/ exist
      fs.mkdirSync(path.join(featureDir, 'steps'), { recursive: true })
      fs.writeFileSync(path.join(featureDir, 'index.js'), `
        // Mock Feature object for testing
        module.exports = {
          getHandler: () => (req, res, next) => next(),
          getInfo: () => ({ method: 'GET', path: '/users' }),
          initialize: async () => {},
          config: { method: 'GET', path: '/users' }
        }
      `)
      fs.writeFileSync(path.join(featureDir, 'steps/100-list.js'), 'module.exports = () => {}')

      const scanner = new FeatureScanner({ directory: featuresDir })
      const features = await scanner.scan()

      expect(features).toHaveLength(1)
      // Treated as explicit Feature because index.js exists
      expect(features[0].filePath).toContain('index.js')
    })
  })

  // ==========================================
  // 4. Reserved Word Conflict Resolution
  // ==========================================
  describe('Reserved Word Conflict Resolution', () => {
    it('should allow "steps" as resource name with @ prefix', async () => {
      const featuresDir = path.join(testDir, 'features')
      // GET /workflows/:id/steps - use "steps" as resource name
      const featureDir = path.join(featuresDir, 'workflows/[id]/steps/@get')

      fs.mkdirSync(path.join(featureDir, 'steps'), { recursive: true })
      fs.writeFileSync(path.join(featureDir, 'steps/100-list.js'), 'module.exports = () => {}')

      const scanner = new FeatureScanner({ directory: featuresDir })
      const features = await scanner.scan()

      expect(features).toHaveLength(1)
      const info = features[0].feature.getInfo()

      expect(info.method).toBe('GET')
      expect(info.path).toBe('/workflows/:id/steps')
    })

    it('should allow "async-tasks" as resource name with @ prefix', async () => {
      const featuresDir = path.join(testDir, 'features')
      // GET /jobs/async-tasks
      const featureDir = path.join(featuresDir, 'jobs/async-tasks/@get')

      fs.mkdirSync(path.join(featureDir, 'steps'), { recursive: true })
      fs.writeFileSync(path.join(featureDir, 'steps/100-list.js'), 'module.exports = () => {}')

      const scanner = new FeatureScanner({ directory: featuresDir })
      const features = await scanner.scan()

      expect(features).toHaveLength(1)
      const info = features[0].feature.getInfo()

      expect(info.method).toBe('GET')
      expect(info.path).toBe('/jobs/async-tasks')
    })

    it('should allow "get", "post" etc as resource names', async () => {
      const featuresDir = path.join(testDir, 'features')
      // GET /http-methods/get - use "get" as resource name
      const featureDir = path.join(featuresDir, 'http-methods/get/@get')

      fs.mkdirSync(path.join(featureDir, 'steps'), { recursive: true })
      fs.writeFileSync(path.join(featureDir, 'steps/100-detail.js'), 'module.exports = () => {}')

      const scanner = new FeatureScanner({ directory: featuresDir })
      const features = await scanner.scan()

      expect(features).toHaveLength(1)
      const info = features[0].feature.getInfo()

      expect(info.method).toBe('GET')
      expect(info.path).toBe('/http-methods/get')
    })
  })

  // ==========================================
  // 5. Real-world API Structures
  // ==========================================
  describe('Real-world API Structures', () => {
    it('should scan e-commerce API structure', async () => {
      const featuresDir = path.join(testDir, 'features')

      // Products
      const getProducts = path.join(featuresDir, 'api/v1/products/@get/steps')
      fs.mkdirSync(getProducts, { recursive: true })
      fs.writeFileSync(path.join(getProducts, '100-list.js'), 'module.exports = () => {}')

      const postProduct = path.join(featuresDir, 'api/v1/products/@post/steps')
      fs.mkdirSync(postProduct, { recursive: true })
      fs.writeFileSync(path.join(postProduct, '100-create.js'), 'module.exports = () => {}')

      // Product detail
      const getProduct = path.join(featuresDir, 'api/v1/products/[id]/@get/steps')
      fs.mkdirSync(getProduct, { recursive: true })
      fs.writeFileSync(path.join(getProduct, '100-detail.js'), 'module.exports = () => {}')

      // Reviews
      const getReviews = path.join(featuresDir, 'api/v1/products/[id]/reviews/@get/steps')
      fs.mkdirSync(getReviews, { recursive: true })
      fs.writeFileSync(path.join(getReviews, '100-list.js'), 'module.exports = () => {}')

      const scanner = new FeatureScanner({ directory: featuresDir })
      const features = await scanner.scan()

      expect(features).toHaveLength(4)

      const paths = features.map(f => f.feature.getInfo().path).sort()
      expect(paths).toEqual([
        '/api/v1/products',
        '/api/v1/products',
        '/api/v1/products/:id',
        '/api/v1/products/:id/reviews'
      ])
    })

    it('should scan CI/CD pipeline API with "steps" resource', async () => {
      const featuresDir = path.join(testDir, 'features')

      // Pipeline
      const getPipeline = path.join(featuresDir, 'api/pipelines/[id]/@get/steps')
      fs.mkdirSync(getPipeline, { recursive: true })
      fs.writeFileSync(path.join(getPipeline, '100-detail.js'), 'module.exports = () => {}')

      // Pipeline steps (use reserved word "steps" as resource name)
      const getPipelineSteps = path.join(featuresDir, 'api/pipelines/[id]/steps/@get/steps')
      fs.mkdirSync(getPipelineSteps, { recursive: true })
      fs.writeFileSync(path.join(getPipelineSteps, '100-list.js'), 'module.exports = () => {}')

      // Step detail
      const getStepDetail = path.join(featuresDir, 'api/pipelines/[id]/steps/[stepId]/@get/steps')
      fs.mkdirSync(getStepDetail, { recursive: true })
      fs.writeFileSync(path.join(getStepDetail, '100-detail.js'), 'module.exports = () => {}')

      const scanner = new FeatureScanner({ directory: featuresDir })
      const features = await scanner.scan()

      expect(features).toHaveLength(3)

      const paths = features.map(f => f.feature.getInfo().path).sort()
      expect(paths).toEqual([
        '/api/pipelines/:id',
        '/api/pipelines/:id/steps',
        '/api/pipelines/:id/steps/:stepId'
      ])
    })

    it('should scan deeply nested API paths', async () => {
      const featuresDir = path.join(testDir, 'features')

      // Very deep nesting
      const deepPath = path.join(
        featuresDir,
        'api/v2/admin/reports/analytics/metrics/@get/steps'
      )
      fs.mkdirSync(deepPath, { recursive: true })
      fs.writeFileSync(path.join(deepPath, '100-generate.js'), 'module.exports = () => {}')

      const scanner = new FeatureScanner({ directory: featuresDir })
      const features = await scanner.scan()

      expect(features).toHaveLength(1)
      const info = features[0].feature.getInfo()

      expect(info.method).toBe('GET')
      expect(info.path).toBe('/api/v2/admin/reports/analytics/metrics')
    })
  })

  // ==========================================
  // 6. Error Handling
  // ==========================================
  describe('Error Handling', () => {
    it('should handle empty features directory', async () => {
      const featuresDir = path.join(testDir, 'features')
      fs.mkdirSync(featuresDir, { recursive: true })

      const scanner = new FeatureScanner({ directory: featuresDir })
      const features = await scanner.scan()

      expect(features).toHaveLength(0)
    })

    it('should throw error if features directory does not exist', async () => {
      const nonExistentDir = path.join(testDir, 'nonexistent')

      const scanner = new FeatureScanner({ directory: nonExistentDir })

      await expect(scanner.scan()).rejects.toThrow('Features directory not found')
    })

    it('should skip invalid HTTP method folders', async () => {
      const featuresDir = path.join(testDir, 'features')

      // Invalid method @invalid
      const invalidDir = path.join(featuresDir, 'users/@invalid')
      fs.mkdirSync(path.join(invalidDir, 'steps'), { recursive: true })
      fs.writeFileSync(path.join(invalidDir, 'steps/100-test.js'), 'module.exports = () => {}')

      const scanner = new FeatureScanner({ directory: featuresDir })
      const features = await scanner.scan()

      // Invalid method not scanned
      expect(features).toHaveLength(0)
    })
  })
})
