/**
 * Feature Scanner Tests
 *
 * Tests recursive Feature scanning and Convention over Configuration support
 */

import { describe, it, expect } from '@jest/globals'
import { FeatureScanner, scanFeatures } from '../src/feature/feature-scanner.js'
import * as path from 'path'

describe('Feature Scanner Tests', () => {
  const fixturesDir = path.join(__dirname, 'fixtures/scanner-test')

  describe('FeatureScanner Class', () => {
    it('should recursively scan all Features', async () => {
      const scanner = new FeatureScanner({
        directory: fixturesDir,
      })

      const features = await scanner.scan()

      // Should find 3 features
      expect(features.length).toBe(3)

      // All features should have Feature methods
      features.forEach(({ feature }) => {
        expect(typeof feature.getInfo).toBe('function')
        expect(typeof feature.getHandler).toBe('function')
      })
    })

    it('should have accurate path information for discovered Features', async () => {
      const scanner = new FeatureScanner({
        directory: fixturesDir,
      })

      const features = await scanner.scan()

      const relativePaths = features.map((f) => f.relativePath).sort()

      expect(relativePaths).toEqual([
        'api/v1/orders/[id]/get/index.js',
        'api/v1/orders/post/index.js',
        'api/v1/users/get/index.js',
      ])
    })

    it('should automatically infer method and path according to Convention', async () => {
      const scanner = new FeatureScanner({
        directory: fixturesDir,
      })

      const features = await scanner.scan()

      // Verify information of each Feature
      const featureInfos = features
        .map(({ feature }) => {
          const info = feature.getInfo()
          return { method: info.method, path: info.path }
        })
        .sort((a, b) => `${a.method}:${a.path}`.localeCompare(`${b.method}:${b.path}`))

      expect(featureInfos).toEqual([
        { method: 'GET', path: '/api/v1/orders/:id' },
        { method: 'GET', path: '/api/v1/users' },
        { method: 'POST', path: '/api/v1/orders' },
      ])
    })

    it('should ignore excluded directories', async () => {
      const scanner = new FeatureScanner({
        directory: fixturesDir,
        excludeDirs: ['orders'], // Exclude orders directory
      })

      const features = await scanner.scan()

      // Only users should be scanned
      expect(features.length).toBe(1)

      const info = features[0].feature.getInfo()
      expect(info.path).toBe('/api/v1/users')
    })

    it('should support custom index patterns', async () => {
      const scanner = new FeatureScanner({
        directory: fixturesDir,
        indexPatterns: ['feature.js', 'handler.js'], // Exclude index.js
      })

      const features = await scanner.scan()

      // index.js files should not be scanned
      expect(features.length).toBe(0)
    })

    it('should throw error for non-existent directory', async () => {
      const scanner = new FeatureScanner({
        directory: './non-existent-dir',
      })

      await expect(scanner.scan()).rejects.toThrow('Features directory not found')
    })
  })

  describe('scanFeatures Helper Function', () => {
    it('should scan and return all Features', async () => {
      const features = await scanFeatures(fixturesDir)

      expect(features.length).toBe(3)

      features.forEach(({ feature }) => {
        expect(typeof feature.getInfo).toBe('function')
        expect(typeof feature.getHandler).toBe('function')
      })
    })

    it('should support options', async () => {
      const features = await scanFeatures(fixturesDir, {
        excludeDirs: ['users'], // Exclude users directory
        debug: false,
      })

      // Only orders should be scanned (2 features)
      expect(features.length).toBe(2)

      const paths = features.map((f) => f.feature.getInfo().path).sort()
      expect(paths).toEqual(['/api/v1/orders', '/api/v1/orders/:id'])
    })
  })

  // TODO: Integration tests replaced with examples
  // describe('Application.registerFeatures() Integration Tests', () => {
  //   it('app.registerFeatures() should automatically register all features', async () => {
  //     const numflow = require('../dist/cjs/index.js')
  //     const app = numflow()
  //
  //     // Scan and register Features (async)
  //     app.registerFeatures(fixturesDir)
  //
  //     // Wait for registration to complete
  //     await new Promise((resolve) => setTimeout(resolve, 500))
  //
  //     // Start server
  //     const server = app.listen(4567)
  //
  //     // Test each feature endpoint
  //     const testRequests = [
  //       { method: 'POST', path: '/api/v1/orders', expectedKey: 'order' },
  //       { method: 'GET', path: '/api/v1/orders/123', expectedKey: 'order' },
  //       { method: 'GET', path: '/api/v1/users', expectedKey: 'users' },
  //     ]
  //
  //     for (const { method, path: reqPath, expectedKey } of testRequests) {
  //       const res = await fetch(`http://localhost:4567${reqPath}`, {
  //         method,
  //         headers: { 'Content-Type': 'application/json' },
  //         body: method === 'POST' ? JSON.stringify({ test: 'data' }) : undefined,
  //       })
  //
  //       const data = (await res.json()) as any
  //       expect(data.success).toBe(true)
  //       expect(data.data).toHaveProperty(expectedKey)
  //     }
  //
  //     // Close server
  //     server.close()
  //   })
  // })
})
