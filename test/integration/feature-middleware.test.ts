/**
 * Feature middleware integration test
 * Feature-level middleware functionality tests
 */

import numflow from '../../src/index'
import { Application } from '../../src/application'
import http from 'http'

jest.setTimeout(10000)

describe('Feature Middleware Integration', () => {
  let app: Application
  let server: http.Server | null = null
  let portCounter = 8100

  beforeEach(() => {
    portCounter++
  })

  afterEach(async () => {
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
    await new Promise(resolve => setTimeout(resolve, 100))
  })

  it('Feature-level middleware should execute before steps', async () => {
    app = numflow()
    const port = portCounter

    let middlewareExecuted = false

    app.use(numflow.feature({
      method: 'POST',
      path: '/api/test',
      steps: './test/__fixtures__/feature-integration/basic-steps',
      middlewares: [
        (req: any, _res: any, next: any) => {
          middlewareExecuted = true
          // Add custom property
          req.customData = 'from-middleware'
          next()
        },
      ],
      contextInitializer: (ctx: any, req: any) => {
        ctx.customData = req.customData
      },
    }))

    return new Promise<void>((resolve, reject) => {
      server = app.listen(port, () => {
        const postData = JSON.stringify({ test: 'data' })
        const options = {
          hostname: 'localhost',
          port,
          path: '/api/test',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData),
          },
        }

        const req = http.request(options, (res) => {
          let data = ''
          res.on('data', (chunk) => {
            data += chunk
          })

          res.on('end', () => {
            try {
              console.log('Response status:', res.statusCode)
              console.log('Response data:', data)
              expect(res.statusCode).toBe(200)
              expect(middlewareExecuted).toBe(true)
              const body = JSON.parse(data)
              expect(body.success).toBe(true)
              resolve()
            } catch (error) {
              reject(error)
            }
          })
        })

        req.on('error', reject)
        req.write(postData)
        req.end()
      })

      setTimeout(() => {
        reject(new Error('Test timeout'))
      }, 5000).unref()
    })
  })

  it('Feature middleware can block request', async () => {
    app = numflow()
    const port = portCounter

    app.use(numflow.feature({
      method: 'POST',
      path: '/api/protected',
      steps: './test/__fixtures__/feature-integration/basic-steps',
      middlewares: [
        (_req: any, res: any, _next: any) => {
          // Block request
          res.statusCode = 403
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'Forbidden' }))
        },
      ],
    }))

    return new Promise<void>((resolve, reject) => {
      server = app.listen(port, () => {
        const options = {
          hostname: 'localhost',
          port,
          path: '/api/protected',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        }

        const req = http.request(options, (res) => {
          let data = ''
          res.on('data', (chunk) => {
            data += chunk
          })

          res.on('end', () => {
            try {
              console.log('Response status:', res.statusCode)
              console.log('Response data:', data)
              expect(res.statusCode).toBe(403)
              const body = JSON.parse(data)
              expect(body.error).toBe('Forbidden')
              resolve()
            } catch (error) {
              reject(error)
            }
          })
        })

        req.on('error', reject)
        req.end()
      })

      setTimeout(() => {
        reject(new Error('Test timeout'))
      }, 5000).unref()
    })
  })
})
