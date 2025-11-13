/**
 * Feature Scanner - Multiple Directories Test
 *
 * Tests support for multiple features directory names.
 * app.registerFeatures() should support directory names other than 'features'.
 */

import { describe, it, expect, afterEach, beforeEach } from '@jest/globals'
import * as fs from 'fs'
import * as path from 'path'
import { Application } from '../src/application.js'
import http from 'http'

jest.setTimeout(10000)

describe('Feature Scanner - Multiple Directory Names', () => {
  let testDir: string
  let app: Application
  let server: http.Server | null = null
  let portCounter = 9000

  beforeEach(() => {
    // Create temporary test directory
    testDir = path.join(process.cwd(), 'test-features-temp')
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true })
    }
    portCounter++
  })

  afterEach(async () => {
    // Close server
    if (server && server.listening) {
      server.closeAllConnections?.()
      await new Promise<void>((resolve) => {
        const timeout = setTimeout(() => resolve(), 2000)
        server!.close(() => {
          clearTimeout(timeout)
          resolve()
        })
      })
    }
    server = null
    app = null as any

    // Clean up test directory
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true })
    }

    await new Promise(resolve => setTimeout(resolve, 100))
  })

  /**
   * Helper function: Create Feature directory
   */
  function createFeature(baseDir: string, featurePath: string, method: string) {
    const fullPath = path.join(baseDir, ...featurePath.split('/'), `@${method}`)
    const stepsDir = path.join(fullPath, 'steps')

    fs.mkdirSync(stepsDir, { recursive: true })

    // Create step file
    const stepFile = path.join(stepsDir, '100-handler.js')
    fs.writeFileSync(
      stepFile,
      `
      module.exports = async (ctx, req, res, next) => {
        res.json({ message: '${featurePath} ${method}' })
      }
    `
    )
  }

  /**
   * Helper function: HTTP GET request
   */
  function makeRequest(port: number, path: string, method: string = 'GET'): Promise<{ status: number, body: any }> {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'localhost',
        port,
        path,
        method,
      }

      const req = http.request(options, (res) => {
        let data = ''
        res.on('data', (chunk) => {
          data += chunk
        })

        res.on('end', () => {
          try {
            const body = data ? JSON.parse(data) : {}
            resolve({ status: res.statusCode || 500, body })
          } catch (error) {
            reject(error)
          }
        })
      })

      req.on('error', reject)
      req.end()
    })
  }

  it('should support features directory (default)', async () => {
    const featuresDir = path.join(testDir, 'features')
    const port = portCounter

    // Create features/users/@get
    createFeature(featuresDir, 'users', 'get')

    // Create and register Application
    app = new Application()
    await app.registerFeatures(featuresDir)

    return new Promise<void>((resolve, reject) => {
      server = app.listen(port, async () => {
        try {
          const { status, body } = await makeRequest(port, '/users', 'GET')
          expect(status).toBe(200)
          expect(body.message).toBe('users get')
          resolve()
        } catch (error) {
          reject(error)
        }
      })

      setTimeout(() => reject(new Error('Test timeout')), 5000).unref()
    })
  })

  it('should support custom directory name: "features-dir"', async () => {
    const customDir = path.join(testDir, 'features-dir')
    const port = portCounter

    // Create features-dir/products/@get
    createFeature(customDir, 'products', 'get')

    // Create and register Application
    app = new Application()
    await app.registerFeatures(customDir)

    return new Promise<void>((resolve, reject) => {
      server = app.listen(port, async () => {
        try {
          const { status, body } = await makeRequest(port, '/products', 'GET')
          expect(status).toBe(200)
          expect(body.message).toBe('products get')
          resolve()
        } catch (error) {
          reject(error)
        }
      })

      setTimeout(() => reject(new Error('Test timeout')), 5000).unref()
    })
  })

  it('should support custom directory name: "api"', async () => {
    const apiDir = path.join(testDir, 'api')
    const port = portCounter

    // Create api/orders/@post
    createFeature(apiDir, 'orders', 'post')

    // Create and register Application
    app = new Application()
    await app.registerFeatures(apiDir)

    return new Promise<void>((resolve, reject) => {
      server = app.listen(port, async () => {
        try {
          const { status, body } = await makeRequest(port, '/orders', 'POST')
          expect(status).toBe(200)
          expect(body.message).toBe('orders post')
          resolve()
        } catch (error) {
          reject(error)
        }
      })

      setTimeout(() => reject(new Error('Test timeout')), 5000).unref()
    })
  })

  it('should support multiple feature directories registration', async () => {
    const dir1 = path.join(testDir, 'features1')
    const dir2 = path.join(testDir, 'features2')
    const port = portCounter

    // Create features1/users/@get
    createFeature(dir1, 'users', 'get')

    // Create features2/products/@get
    createFeature(dir2, 'products', 'get')

    // Create Application and register multiple directories
    app = new Application()
    await app.registerFeatures(dir1)
    await app.registerFeatures(dir2)

    return new Promise<void>((resolve, reject) => {
      server = app.listen(port, async () => {
        try {
          // Check that both Features are registered
          const users = await makeRequest(port, '/users', 'GET')
          expect(users.status).toBe(200)
          expect(users.body.message).toBe('users get')

          const products = await makeRequest(port, '/products', 'GET')
          expect(products.status).toBe(200)
          expect(products.body.message).toBe('products get')

          resolve()
        } catch (error) {
          reject(error)
        }
      })

      setTimeout(() => reject(new Error('Test timeout')), 5000).unref()
    })
  })

  it('should infer correct path from nested directory structure', async () => {
    const customDir = path.join(testDir, 'my-api')
    const port = portCounter

    // Create my-api/v1/users/@get
    createFeature(customDir, 'v1/users', 'get')

    // Create and register Application
    app = new Application()
    await app.registerFeatures(customDir)

    return new Promise<void>((resolve, reject) => {
      server = app.listen(port, async () => {
        try {
          const { status, body } = await makeRequest(port, '/v1/users', 'GET')
          expect(status).toBe(200)
          expect(body.message).toBe('v1/users get')
          resolve()
        } catch (error) {
          reject(error)
        }
      })

      setTimeout(() => reject(new Error('Test timeout')), 5000).unref()
    })
  })

  it('should support deeply nested features in custom directory', async () => {
    const customDir = path.join(testDir, 'backend-features')
    const port = portCounter

    // Create backend-features/api/v2/admin/users/@get
    createFeature(customDir, 'api/v2/admin/users', 'get')

    // Create and register Application
    app = new Application()
    await app.registerFeatures(customDir)

    return new Promise<void>((resolve, reject) => {
      server = app.listen(port, async () => {
        try {
          const { status, body } = await makeRequest(port, '/api/v2/admin/users', 'GET')
          expect(status).toBe(200)
          expect(body.message).toBe('api/v2/admin/users get')
          resolve()
        } catch (error) {
          reject(error)
        }
      })

      setTimeout(() => reject(new Error('Test timeout')), 5000).unref()
    })
  })
})
