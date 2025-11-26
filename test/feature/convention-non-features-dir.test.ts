/**
 * Tests for convention resolution in non-features directories
 *
 * This tests the scenario where Features are placed in a directory
 * that is NOT named "features" (e.g., test-fixtures/non-features-dir)
 *
 * The problem: ConventionResolver.findFeaturesBaseDir() fails when
 * there's no "features" directory in the path, and the fallback
 * inferFeaturesBase() returns incorrect path.
 *
 * Expected behavior: FeatureScanner should update the Feature's
 * method and path using its knowledge of the baseDir.
 */
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import * as path from 'path'
import { FeatureScanner } from '../../src/feature/feature-scanner.js'
import { ConventionResolver } from '../../src/feature/convention.js'

describe('Convention Resolution in Non-Features Directory', () => {
  beforeEach(() => {
    // Clear convention cache before each test
    ConventionResolver.clearCache()
  })

  afterEach(() => {
    ConventionResolver.clearCache()
  })

  describe('FeatureScanner with non-features directory', () => {
    it('should correctly resolve method and path for features in non-features directory', async () => {
      // Given: A features directory that is NOT named "features"
      const fixturesDir = path.resolve(__dirname, '../../test-fixtures/non-features-dir')

      // When: Scanning the directory
      const scanner = new FeatureScanner({
        directory: fixturesDir,
        debug: false,
      })
      const features = await scanner.scan()

      // Then: Should find the feature
      expect(features.length).toBe(1)

      // And: The feature should have correct method and path
      const feature = features[0].feature
      const info = feature.getInfo()

      // This is the critical assertion:
      // Without the fix, method would be 'POST' but path would be '/' (incorrect)
      // With the fix, path should be '/api/users' (correct)
      expect(info.method).toBe('POST')
      expect(info.path).toBe('/api/users')
    })

    it('should correctly resolve path for nested features', async () => {
      // This test ensures that the path resolution works for deeper nesting
      const fixturesDir = path.resolve(__dirname, '../../test-fixtures/non-features-dir')

      const scanner = new FeatureScanner({
        directory: fixturesDir,
        debug: false,
      })
      const features = await scanner.scan()

      const feature = features[0].feature
      const info = feature.getInfo()

      // The path should include the full API path, not just '/'
      expect(info.path).not.toBe('/')
      expect(info.path).toContain('/api')
      expect(info.path).toContain('/users')
    })
  })

  describe('ConventionResolver.inferFeaturesBase', () => {
    it('should find parent directory of @{method} folder', () => {
      // Given: A path with @post folder
      const featureDir = '/path/to/my-features/api/users/@post'

      // When: Calling inferFeaturesBase
      const base = ConventionResolver.inferFeaturesBase(featureDir)

      // Then: Should return the parent of the @post folder's parent
      // (i.e., /path/to/my-features)
      // Actually, inferFeaturesBase returns @method's parent, so:
      expect(base).toBe('/path/to/my-features/api/users')
    })

    it('should handle deeply nested paths', () => {
      const featureDir = '/root/app/custom-features/api/v1/users/@get'

      const base = ConventionResolver.inferFeaturesBase(featureDir)

      // Should return the parent of @get
      expect(base).toBe('/root/app/custom-features/api/v1/users')
    })
  })

  describe('ConventionResolver.resolveConventions with custom base', () => {
    it('should correctly resolve path when featuresBase is provided', () => {
      // Given: A feature path and custom base directory
      const featurePath = '/my-app/custom-features/api/users/@post/index.js'
      const customBase = '/my-app/custom-features'

      // When: Resolving conventions with custom base
      const conventions = ConventionResolver.resolveConventions(featurePath, customBase)

      // Then: Should correctly infer method and path
      expect(conventions.method).toBe('POST')
      expect(conventions.path).toBe('/api/users')
    })
  })
})
