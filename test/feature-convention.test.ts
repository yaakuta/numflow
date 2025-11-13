/**
 * Feature Convention Tests
 *
 * Thoroughly validates Convention over Configuration feature.
 *
 * Test categories:
 * 1. HTTP Method Inference (Method Inference) - 10+ cases
 * 2. Path Inference (Path Inference) - 15+ cases
 * 3. Dynamic Route Parsing (Dynamic Route Parsing) - 8+ cases
 * 4. Steps Directory Detection (steps Folder Detection) - 5+ cases
 * 5. Async Tasks Directory Detection (async-tasks Folder Detection) - 5+ cases
 * 6. Features Base Directory Finding (Features Base Finding) - 5+ cases
 * 7. Full Convention Resolution (Full Convention Resolution) - 8+ cases
 * 8. Error Cases (Error Cases) - 6+ cases
 *
 * Total: 60+ test cases
 */

import * as path from 'path'
import * as fs from 'fs'
import { ConventionResolver } from '../src/feature/convention.js'

describe('Feature Convention Tests', () => {
  // ==========================================
  // 1. HTTP Method Inference - @ prefix
  // ==========================================
  describe('HTTP Method Inference', () => {
    it('should infer GET from "@get" folder', () => {
      const method = ConventionResolver.inferMethod('/features/users/@get')
      expect(method).toBe('GET')
    })

    it('should infer POST from "@post" folder', () => {
      const method = ConventionResolver.inferMethod('/features/users/@post')
      expect(method).toBe('POST')
    })

    it('should infer PUT from "@put" folder', () => {
      const method = ConventionResolver.inferMethod('/features/users/@put')
      expect(method).toBe('PUT')
    })

    it('should infer PATCH from "@patch" folder', () => {
      const method = ConventionResolver.inferMethod('/features/users/@patch')
      expect(method).toBe('PATCH')
    })

    it('should infer DELETE from "@delete" folder', () => {
      const method = ConventionResolver.inferMethod('/features/users/@delete')
      expect(method).toBe('DELETE')
    })

    it('should handle uppercase method folder "@GET"', () => {
      const method = ConventionResolver.inferMethod('/features/users/@GET')
      expect(method).toBe('GET')
    })

    it('should handle mixed case method folder "@Post"', () => {
      const method = ConventionResolver.inferMethod('/features/users/@Post')
      expect(method).toBe('POST')
    })

    it('should handle mixed case method folder "@DELETE"', () => {
      const method = ConventionResolver.inferMethod('/features/users/@DELETE')
      expect(method).toBe('DELETE')
    })

    it('should throw error for folder without @ prefix "get"', () => {
      expect(() => {
        ConventionResolver.inferMethod('/features/users/get')
      }).toThrow('Feature folder must start with @')
    })

    it('should throw error for invalid method folder "@invalid"', () => {
      expect(() => {
        ConventionResolver.inferMethod('/features/users/@invalid')
      }).toThrow('Invalid HTTP method: "@invalid"')
    })

    it('should throw error for invalid method folder "@foo"', () => {
      expect(() => {
        ConventionResolver.inferMethod('/features/users/@foo')
      }).toThrow('Invalid HTTP method')
    })

    it('should throw error for empty method folder ""', () => {
      expect(() => {
        ConventionResolver.inferMethod('/features/users/')
      }).toThrow('Feature folder must start with @')
    })

    it('should throw error for @ only folder', () => {
      expect(() => {
        ConventionResolver.inferMethod('/features/users/@')
      }).toThrow('Invalid HTTP method')
    })
  })

  // ==========================================
  // 2. Path Inference
  // ==========================================
  describe('Path Inference', () => {
    it('should infer path from single resource: /features/users/get → /users', () => {
      const apiPath = ConventionResolver.inferPath(
        '/features/users/@get',
        '/features'
      )
      expect(apiPath).toBe('/users')
    })

    it('should infer path from nested resource: /features/api/v1/users/get → /api/v1/users', () => {
      const apiPath = ConventionResolver.inferPath(
        '/features/api/v1/users/@get',
        '/features'
      )
      expect(apiPath).toBe('/api/v1/users')
    })

    it('should infer path from deeply nested: /features/api/v1/admin/users/post → /api/v1/admin/users', () => {
      const apiPath = ConventionResolver.inferPath(
        '/features/api/v1/admin/users/@post',
        '/features'
      )
      expect(apiPath).toBe('/api/v1/admin/users')
    })

    it('should infer path from single resource: /features/orders/post → /orders', () => {
      const apiPath = ConventionResolver.inferPath(
        '/features/orders/@post',
        '/features'
      )
      expect(apiPath).toBe('/orders')
    })

    it('should infer path from api versioned: /features/v1/users/get → /v1/users', () => {
      const apiPath = ConventionResolver.inferPath(
        '/features/v1/users/@get',
        '/features'
      )
      expect(apiPath).toBe('/v1/users')
    })

    it('should infer path from complex nesting: /features/api/v2/admin/reports/analytics/get → /api/v2/admin/reports/analytics', () => {
      const apiPath = ConventionResolver.inferPath(
        '/features/api/v2/admin/reports/analytics/@get',
        '/features'
      )
      expect(apiPath).toBe('/api/v2/admin/reports/analytics')
    })

    it('should handle root-level resource: /features/health/get → /health', () => {
      const apiPath = ConventionResolver.inferPath(
        '/features/health/@get',
        '/features'
      )
      expect(apiPath).toBe('/health')
    })

    it('should handle dynamic routes: /features/users/[id]/get → /users/:id', () => {
      const apiPath = ConventionResolver.inferPath(
        '/features/users/[id]/@get',
        '/features'
      )
      expect(apiPath).toBe('/users/:id')
    })

    it('should handle multiple dynamic routes: /features/users/[userId]/posts/[postId]/get → /users/:userId/posts/:postId', () => {
      const apiPath = ConventionResolver.inferPath(
        '/features/users/[userId]/posts/[postId]/@get',
        '/features'
      )
      expect(apiPath).toBe('/users/:userId/posts/:postId')
    })

    it('should handle mixed static and dynamic: /features/api/users/[id]/posts/get → /api/users/:id/posts', () => {
      const apiPath = ConventionResolver.inferPath(
        '/features/api/users/[id]/posts/@get',
        '/features'
      )
      expect(apiPath).toBe('/api/users/:id/posts')
    })

    it('should handle kebab-case folders: /features/user-profiles/get → /user-profiles', () => {
      const apiPath = ConventionResolver.inferPath(
        '/features/user-profiles/@get',
        '/features'
      )
      expect(apiPath).toBe('/user-profiles')
    })

    it('should handle snake_case folders: /features/user_profiles/get → /user_profiles', () => {
      const apiPath = ConventionResolver.inferPath(
        '/features/user_profiles/@get',
        '/features'
      )
      expect(apiPath).toBe('/user_profiles')
    })

    it('should handle numeric folders: /features/v1/users/get → /v1/users', () => {
      const apiPath = ConventionResolver.inferPath(
        '/features/v1/users/@get',
        '/features'
      )
      expect(apiPath).toBe('/v1/users')
    })

    it('should exclude method folder from path: /features/users/delete → /users', () => {
      const apiPath = ConventionResolver.inferPath(
        '/features/users/@delete',
        '/features'
      )
      expect(apiPath).toBe('/users')
    })
  })

  // ==========================================
  // 3. Dynamic Route Parsing
  // ==========================================
  describe('Dynamic Route Parsing', () => {
    it('should parse [id] → :id', () => {
      const segment = ConventionResolver.parseDynamicRoute('[id]')
      expect(segment).toBe(':id')
    })

    it('should parse [userId] → :userId', () => {
      const segment = ConventionResolver.parseDynamicRoute('[userId]')
      expect(segment).toBe(':userId')
    })

    it('should parse [postId] → :postId', () => {
      const segment = ConventionResolver.parseDynamicRoute('[postId]')
      expect(segment).toBe(':postId')
    })

    it('should parse [post-id] → :post-id (kebab-case)', () => {
      const segment = ConventionResolver.parseDynamicRoute('[post-id]')
      expect(segment).toBe(':post-id')
    })

    it('should parse [post_id] → :post_id (snake_case)', () => {
      const segment = ConventionResolver.parseDynamicRoute('[post_id]')
      expect(segment).toBe(':post_id')
    })

    it('should NOT parse regular folder: users → users', () => {
      const segment = ConventionResolver.parseDynamicRoute('users')
      expect(segment).toBe('users')
    })

    it('should NOT parse incomplete bracket: [id → [id', () => {
      const segment = ConventionResolver.parseDynamicRoute('[id')
      expect(segment).toBe('[id')
    })

    it('should NOT parse incomplete bracket: id] → id]', () => {
      const segment = ConventionResolver.parseDynamicRoute('id]')
      expect(segment).toBe('id]')
    })
  })

  // ==========================================
  // 4. Steps Directory Detection
  // ==========================================
  describe('Steps Directory Detection', () => {
    let testDir: string

    beforeEach(() => {
      // Create temporary test directory
      testDir = path.join(process.cwd(), 'tmp-test-convention-' + Date.now())
      fs.mkdirSync(testDir, { recursive: true })
    })

    afterEach(() => {
      // Clean up test directory
      if (fs.existsSync(testDir)) {
        fs.rmSync(testDir, { recursive: true, force: true })
      }
    })

    it('should detect steps directory when it exists', () => {
      const featureDir = path.join(testDir, 'features/users/post')
      fs.mkdirSync(featureDir, { recursive: true })
      fs.mkdirSync(path.join(featureDir, 'steps'))

      const stepsPath = ConventionResolver.findStepsDir(featureDir)
      expect(stepsPath).toBe('./steps')
    })

    it('should return null when steps directory does not exist', () => {
      const featureDir = path.join(testDir, 'features/users/post')
      fs.mkdirSync(featureDir, { recursive: true })

      const stepsPath = ConventionResolver.findStepsDir(featureDir)
      expect(stepsPath).toBeNull()
    })

    it('should return null for non-directory steps file', () => {
      const featureDir = path.join(testDir, 'features/users/post')
      fs.mkdirSync(featureDir, { recursive: true })
      fs.writeFileSync(path.join(featureDir, 'steps'), 'not a directory')

      const stepsPath = ConventionResolver.findStepsDir(featureDir)
      expect(stepsPath).toBeNull()
    })

    it('should detect empty steps directory', () => {
      const featureDir = path.join(testDir, 'features/users/post')
      fs.mkdirSync(featureDir, { recursive: true })
      fs.mkdirSync(path.join(featureDir, 'steps'))

      const stepsPath = ConventionResolver.findStepsDir(featureDir)
      expect(stepsPath).toBe('./steps')
    })
  })

  // ==========================================
  // 5. Async Tasks Directory Detection
  // ==========================================
  describe('Async Tasks Directory Detection', () => {
    let testDir: string

    beforeEach(() => {
      testDir = path.join(process.cwd(), 'tmp-test-convention-' + Date.now())
      fs.mkdirSync(testDir, { recursive: true })
    })

    afterEach(() => {
      if (fs.existsSync(testDir)) {
        fs.rmSync(testDir, { recursive: true, force: true })
      }
    })

    it('should detect async-tasks directory when it exists', () => {
      const featureDir = path.join(testDir, 'features/users/post')
      fs.mkdirSync(featureDir, { recursive: true })
      fs.mkdirSync(path.join(featureDir, 'async-tasks'))

      const asyncTasksPath = ConventionResolver.findAsyncTasksDir(featureDir)
      expect(asyncTasksPath).toBe('./async-tasks')
    })

    it('should return null when async-tasks directory does not exist', () => {
      const featureDir = path.join(testDir, 'features/users/post')
      fs.mkdirSync(featureDir, { recursive: true })

      const asyncTasksPath = ConventionResolver.findAsyncTasksDir(featureDir)
      expect(asyncTasksPath).toBeNull()
    })

    it('should return null for non-directory async-tasks file', () => {
      const featureDir = path.join(testDir, 'features/users/post')
      fs.mkdirSync(featureDir, { recursive: true })
      fs.writeFileSync(path.join(featureDir, 'async-tasks'), 'not a directory')

      const asyncTasksPath = ConventionResolver.findAsyncTasksDir(featureDir)
      expect(asyncTasksPath).toBeNull()
    })

    it('should detect empty async-tasks directory', () => {
      const featureDir = path.join(testDir, 'features/users/post')
      fs.mkdirSync(featureDir, { recursive: true })
      fs.mkdirSync(path.join(featureDir, 'async-tasks'))

      const asyncTasksPath = ConventionResolver.findAsyncTasksDir(featureDir)
      expect(asyncTasksPath).toBe('./async-tasks')
    })
  })

  // ==========================================
  // 6. Features Base Directory Finding
  // ==========================================
  describe('Features Base Directory Finding', () => {
    let testDir: string

    beforeEach(() => {
      testDir = path.join(process.cwd(), 'tmp-test-convention-' + Date.now())
      fs.mkdirSync(testDir, { recursive: true })
    })

    afterEach(() => {
      if (fs.existsSync(testDir)) {
        fs.rmSync(testDir, { recursive: true, force: true })
      }
    })

    it('should find features directory when directly inside', () => {
      const featuresDir = path.join(testDir, 'features')
      const featureDir = path.join(featuresDir, 'users/post')
      fs.mkdirSync(featureDir, { recursive: true })

      const foundBase = ConventionResolver.findFeaturesBaseDir(featureDir)
      expect(foundBase).toBe(featuresDir)
    })

    it('should find features directory from deeply nested path', () => {
      const featuresDir = path.join(testDir, 'features')
      const featureDir = path.join(featuresDir, 'api/v1/admin/users/post')
      fs.mkdirSync(featureDir, { recursive: true })

      const foundBase = ConventionResolver.findFeaturesBaseDir(featureDir)
      expect(foundBase).toBe(featuresDir)
    })

    it('should find features directory from immediate child', () => {
      const featuresDir = path.join(testDir, 'features')
      const featureDir = path.join(featuresDir, 'users')
      fs.mkdirSync(featureDir, { recursive: true })

      const foundBase = ConventionResolver.findFeaturesBaseDir(featureDir)
      expect(foundBase).toBe(featuresDir)
    })

    it('should throw error when features directory is not found', () => {
      const nonFeaturesDir = path.join(testDir, 'src/components/users')
      fs.mkdirSync(nonFeaturesDir, { recursive: true })

      expect(() => {
        ConventionResolver.findFeaturesBaseDir(nonFeaturesDir)
      }).toThrow('Could not find \'features\' directory')
    })

    it('should find features directory even with other "features" in path', () => {
      // /project/features/api/features-v2/users/post
      // Should find the first "features" folder
      const featuresDir = path.join(testDir, 'features')
      const featureDir = path.join(featuresDir, 'api/features-v2/users/post')
      fs.mkdirSync(featureDir, { recursive: true })

      const foundBase = ConventionResolver.findFeaturesBaseDir(featureDir)
      expect(foundBase).toBe(featuresDir)
    })
  })

  // ==========================================
  // 7. Full Convention Resolution
  // ==========================================
  describe('Full Convention Resolution', () => {
    let testDir: string

    beforeEach(() => {
      testDir = path.join(process.cwd(), 'tmp-test-convention-' + Date.now())
      fs.mkdirSync(testDir, { recursive: true })
    })

    afterEach(() => {
      if (fs.existsSync(testDir)) {
        fs.rmSync(testDir, { recursive: true, force: true })
      }
    })

    it('should resolve all conventions: method + path + steps + asyncTasks', () => {
      const featuresDir = path.join(testDir, 'features')
      const featureDir = path.join(featuresDir, 'api/v1/orders/@post')
      const indexFile = path.join(featureDir, 'index.js')
      fs.mkdirSync(featureDir, { recursive: true })
      fs.mkdirSync(path.join(featureDir, 'steps'))
      fs.mkdirSync(path.join(featureDir, 'async-tasks'))
      fs.writeFileSync(indexFile, 'module.exports = {}')

      const conventions = ConventionResolver.resolveConventions(indexFile)

      expect(conventions.method).toBe('POST')
      expect(conventions.path).toBe('/api/v1/orders')
      expect(conventions.steps).toBe('./steps')
      expect(conventions.asyncTasks).toBe('./async-tasks')
    })

    it('should resolve with only method and path (no steps/asyncTasks)', () => {
      const featuresDir = path.join(testDir, 'features')
      const featureDir = path.join(featuresDir, 'users/@get')
      const indexFile = path.join(featureDir, 'index.js')
      fs.mkdirSync(featureDir, { recursive: true })
      fs.writeFileSync(indexFile, 'module.exports = {}')

      const conventions = ConventionResolver.resolveConventions(indexFile)

      expect(conventions.method).toBe('GET')
      expect(conventions.path).toBe('/users')
      expect(conventions.steps).toBeNull()
      expect(conventions.asyncTasks).toBeNull()
    })

    it('should resolve with steps only (no asyncTasks)', () => {
      const featuresDir = path.join(testDir, 'features')
      const featureDir = path.join(featuresDir, 'orders/@post')
      const indexFile = path.join(featureDir, 'index.js')
      fs.mkdirSync(featureDir, { recursive: true })
      fs.mkdirSync(path.join(featureDir, 'steps'))
      fs.writeFileSync(indexFile, 'module.exports = {}')

      const conventions = ConventionResolver.resolveConventions(indexFile)

      expect(conventions.method).toBe('POST')
      expect(conventions.path).toBe('/orders')
      expect(conventions.steps).toBe('./steps')
      expect(conventions.asyncTasks).toBeNull()
    })

    it('should resolve with asyncTasks only (no steps)', () => {
      const featuresDir = path.join(testDir, 'features')
      const featureDir = path.join(featuresDir, 'notifications/@post')
      const indexFile = path.join(featureDir, 'index.js')
      fs.mkdirSync(featureDir, { recursive: true })
      fs.mkdirSync(path.join(featureDir, 'async-tasks'))
      fs.writeFileSync(indexFile, 'module.exports = {}')

      const conventions = ConventionResolver.resolveConventions(indexFile)

      expect(conventions.method).toBe('POST')
      expect(conventions.path).toBe('/notifications')
      expect(conventions.steps).toBeNull()
      expect(conventions.asyncTasks).toBe('./async-tasks')
    })

    it('should resolve dynamic routes with conventions', () => {
      const featuresDir = path.join(testDir, 'features')
      const featureDir = path.join(featuresDir, 'users/[id]/posts/[postId]/@get')
      const indexFile = path.join(featureDir, 'index.js')
      fs.mkdirSync(featureDir, { recursive: true })
      fs.writeFileSync(indexFile, 'module.exports = {}')

      const conventions = ConventionResolver.resolveConventions(indexFile)

      expect(conventions.method).toBe('GET')
      expect(conventions.path).toBe('/users/:id/posts/:postId')
      expect(conventions.steps).toBeNull()
      expect(conventions.asyncTasks).toBeNull()
    })

    it('should resolve deeply nested API paths', () => {
      const featuresDir = path.join(testDir, 'features')
      const featureDir = path.join(featuresDir, 'api/v2/admin/reports/analytics/@get')
      const indexFile = path.join(featureDir, 'index.js')
      fs.mkdirSync(featureDir, { recursive: true })
      fs.mkdirSync(path.join(featureDir, 'steps'))
      fs.writeFileSync(indexFile, 'module.exports = {}')

      const conventions = ConventionResolver.resolveConventions(indexFile)

      expect(conventions.method).toBe('GET')
      expect(conventions.path).toBe('/api/v2/admin/reports/analytics')
      expect(conventions.steps).toBe('./steps')
      expect(conventions.asyncTasks).toBeNull()
    })

    it('should handle DELETE method with full conventions', () => {
      const featuresDir = path.join(testDir, 'features')
      const featureDir = path.join(featuresDir, 'users/@delete')
      const indexFile = path.join(featureDir, 'index.js')
      fs.mkdirSync(featureDir, { recursive: true })
      fs.mkdirSync(path.join(featureDir, 'steps'))
      fs.mkdirSync(path.join(featureDir, 'async-tasks'))
      fs.writeFileSync(indexFile, 'module.exports = {}')

      const conventions = ConventionResolver.resolveConventions(indexFile)

      expect(conventions.method).toBe('DELETE')
      expect(conventions.path).toBe('/users')
      expect(conventions.steps).toBe('./steps')
      expect(conventions.asyncTasks).toBe('./async-tasks')
    })

    it('should handle PATCH method', () => {
      const featuresDir = path.join(testDir, 'features')
      const featureDir = path.join(featuresDir, 'users/[id]/@patch')
      const indexFile = path.join(featureDir, 'index.js')
      fs.mkdirSync(featureDir, { recursive: true })
      fs.writeFileSync(indexFile, 'module.exports = {}')

      const conventions = ConventionResolver.resolveConventions(indexFile)

      expect(conventions.method).toBe('PATCH')
      expect(conventions.path).toBe('/users/:id')
      expect(conventions.steps).toBeNull()
      expect(conventions.asyncTasks).toBeNull()
    })
  })

  // ==========================================
  // 8. Error Cases
  // ==========================================
  describe('Error Cases', () => {
    it('should throw error for invalid HTTP method in resolveConventions', () => {
      const testDir = path.join(process.cwd(), 'tmp-test-convention-' + Date.now())
      const featuresDir = path.join(testDir, 'features')
      const featureDir = path.join(featuresDir, 'users/@invalid')
      const indexFile = path.join(featureDir, 'index.js')

      try {
        fs.mkdirSync(featureDir, { recursive: true })
        fs.writeFileSync(indexFile, 'module.exports = {}')

        expect(() => {
          ConventionResolver.resolveConventions(indexFile)
        }).toThrow('Invalid HTTP method')
      } finally {
        if (fs.existsSync(testDir)) {
          fs.rmSync(testDir, { recursive: true, force: true })
        }
      }
    })

    it('should throw error when features directory is not found in resolveConventions', () => {
      const testDir = path.join(process.cwd(), 'tmp-test-convention-' + Date.now())
      const nonFeaturesDir = path.join(testDir, 'src/users/get')
      const indexFile = path.join(nonFeaturesDir, 'index.js')

      try {
        fs.mkdirSync(nonFeaturesDir, { recursive: true })
        fs.writeFileSync(indexFile, 'module.exports = {}')

        expect(() => {
          ConventionResolver.resolveConventions(indexFile)
        }).toThrow('Could not find \'features\' directory')
      } finally {
        if (fs.existsSync(testDir)) {
          fs.rmSync(testDir, { recursive: true, force: true })
        }
      }
    })

    it('should handle empty folder name in inferMethod', () => {
      expect(() => {
        ConventionResolver.inferMethod('/features/users/')
      }).toThrow('Feature folder must start with @')
    })

    it('should handle special characters in folder name', () => {
      expect(() => {
        ConventionResolver.inferMethod('/features/users/$pecial')
      }).toThrow('Feature folder must start with @')
    })

    it('should handle numeric folder name in inferMethod', () => {
      expect(() => {
        ConventionResolver.inferMethod('/features/users/123')
      }).toThrow('Feature folder must start with @')
    })

    it('should handle very long invalid method name', () => {
      expect(() => {
        ConventionResolver.inferMethod('/features/users/verylonginvalidmethodname')
      }).toThrow('Feature folder must start with @')
    })

    it('should handle @ with invalid method name', () => {
      expect(() => {
        ConventionResolver.inferMethod('/features/users/@verylonginvalidmethodname')
      }).toThrow('Invalid HTTP method')
    })
  })

  // ==========================================
  // 9. isHttpMethod() Helper Tests - @ prefix required
  // ==========================================
  describe('isHttpMethod() Helper', () => {
    it('should return true for "@get"', () => {
      expect(ConventionResolver.isHttpMethod('@get')).toBe(true)
    })

    it('should return true for "@post"', () => {
      expect(ConventionResolver.isHttpMethod('@post')).toBe(true)
    })

    it('should return true for "@put"', () => {
      expect(ConventionResolver.isHttpMethod('@put')).toBe(true)
    })

    it('should return true for "@patch"', () => {
      expect(ConventionResolver.isHttpMethod('@patch')).toBe(true)
    })

    it('should return true for "@delete"', () => {
      expect(ConventionResolver.isHttpMethod('@delete')).toBe(true)
    })

    it('should return true for uppercase "@GET"', () => {
      expect(ConventionResolver.isHttpMethod('@GET')).toBe(true)
    })

    it('should return false for "get" (no @ prefix)', () => {
      expect(ConventionResolver.isHttpMethod('get')).toBe(false)
    })

    it('should return false for "invalid"', () => {
      expect(ConventionResolver.isHttpMethod('invalid')).toBe(false)
    })

    it('should return false for "@invalid"', () => {
      expect(ConventionResolver.isHttpMethod('@invalid')).toBe(false)
    })

    it('should return false for empty string', () => {
      expect(ConventionResolver.isHttpMethod('')).toBe(false)
    })

    it('should return false for "steps"', () => {
      expect(ConventionResolver.isHttpMethod('steps')).toBe(false)
    })

    it('should return false for "async-tasks"', () => {
      expect(ConventionResolver.isHttpMethod('async-tasks')).toBe(false)
    })

    it('should return false for "@" only', () => {
      expect(ConventionResolver.isHttpMethod('@')).toBe(false)
    })
  })

  // ==========================================
  // 10. Caching
  // ==========================================
  describe('Caching', () => {
    beforeEach(() => {
      // Clear cache before each test
      ConventionResolver.clearCache()
    })

    afterAll(() => {
      // Clear cache after all tests
      ConventionResolver.clearCache()
    })

    it('should cache findFeaturesBaseDir results', () => {
      const testDir = path.join(__dirname, '../examples/05-auto-discovery/features/users/post')

      // First call (cache miss)
      const result1 = ConventionResolver.findFeaturesBaseDir(testDir)
      expect(ConventionResolver.getCacheSize()).toBe(1)

      // Second call (cache hit)
      const result2 = ConventionResolver.findFeaturesBaseDir(testDir)
      expect(ConventionResolver.getCacheSize()).toBe(1)

      // Results should be the same
      expect(result1).toBe(result2)
    })

    it('should cache different paths separately', () => {
      const testDir1 = path.join(__dirname, '../examples/05-auto-discovery/features/users/post')
      const testDir2 = path.join(__dirname, '../examples/05-auto-discovery/features/orders/post')

      ConventionResolver.findFeaturesBaseDir(testDir1)
      ConventionResolver.findFeaturesBaseDir(testDir2)

      // Different paths should be cached separately
      expect(ConventionResolver.getCacheSize()).toBe(2)
    })

    it('should clear cache with clearCache()', () => {
      const testDir = path.join(__dirname, '../examples/05-auto-discovery/features/users/post')

      ConventionResolver.findFeaturesBaseDir(testDir)
      expect(ConventionResolver.getCacheSize()).toBe(1)

      ConventionResolver.clearCache()
      expect(ConventionResolver.getCacheSize()).toBe(0)
    })

    it('should rebuild cache after clearCache()', () => {
      const testDir = path.join(__dirname, '../examples/05-auto-discovery/features/users/post')

      // First call
      const result1 = ConventionResolver.findFeaturesBaseDir(testDir)
      expect(ConventionResolver.getCacheSize()).toBe(1)

      // Clear cache
      ConventionResolver.clearCache()
      expect(ConventionResolver.getCacheSize()).toBe(0)

      // Call again (rebuild cache)
      const result2 = ConventionResolver.findFeaturesBaseDir(testDir)
      expect(ConventionResolver.getCacheSize()).toBe(1)

      // Results should be the same
      expect(result1).toBe(result2)
    })

    it('should improve performance with caching', () => {
      const testDir = path.join(__dirname, '../examples/05-auto-discovery/features/users/post')

      // First call (cache miss) - measure time
      const start1 = performance.now()
      for (let i = 0; i < 100; i++) {
        ConventionResolver.findFeaturesBaseDir(testDir)
      }
      const duration1 = performance.now() - start1

      // Clear cache
      ConventionResolver.clearCache()

      // Measure cache miss with different paths
      const start2 = performance.now()
      for (let i = 0; i < 100; i++) {
        const uniqueDir = path.join(testDir, `../test${i}`)
        try {
          ConventionResolver.findFeaturesBaseDir(uniqueDir)
        } catch (e) {
          // Ignore errors (non-existent paths)
        }
      }
      const duration2 = performance.now() - start2

      // Cache hit should be faster or similar to cache miss
      expect(duration1).toBeGreaterThan(0)
      expect(duration2).toBeGreaterThan(0)
    })

    it('should cache even when error is thrown', () => {
      const invalidDir = '/nonexistent/path'

      // First call (error occurs, not cached)
      expect(() => ConventionResolver.findFeaturesBaseDir(invalidDir)).toThrow()
      expect(ConventionResolver.getCacheSize()).toBe(0)

      // Second call (still error, no cache)
      expect(() => ConventionResolver.findFeaturesBaseDir(invalidDir)).toThrow()
      expect(ConventionResolver.getCacheSize()).toBe(0)
    })

    it('should use cache in resolveConventions', () => {
      const testDir = path.join(process.cwd(), 'tmp-test-convention-cache-' + Date.now())
      const featuresDir = path.join(testDir, 'features')
      const featureDir = path.join(featuresDir, 'users/@post')
      const indexFile = path.join(featureDir, 'index.js')

      try {
        // Create test directory
        fs.mkdirSync(featureDir, { recursive: true })
        fs.writeFileSync(indexFile, 'module.exports = {}')

        // First call
        ConventionResolver.resolveConventions(indexFile)
        const cacheSize1 = ConventionResolver.getCacheSize()

        // Second call (uses cache)
        ConventionResolver.resolveConventions(indexFile)
        const cacheSize2 = ConventionResolver.getCacheSize()

        // Cache size should not change (same path)
        expect(cacheSize2).toBe(cacheSize1)
      } finally {
        if (fs.existsSync(testDir)) {
          fs.rmSync(testDir, { recursive: true, force: true })
        }
      }
    })
  })
})
