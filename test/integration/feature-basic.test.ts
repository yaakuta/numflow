/**
 * Basic Feature integration test
 * Basic Feature functionality tests
 */

import numflow from '../../src/index'
import { Application } from '../../src/application'
import http from 'http'

jest.setTimeout(10000)

describe('Feature Basic Integration', () => {
  let app: Application
  let server: http.Server | null = null
  let portCounter = 8000

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

  it('Feature should respond with basic step execution', async () => {
    app = numflow()
    const port = portCounter

    // Simple Feature without middlewares
    app.use(numflow.feature({
      method: 'GET',
      path: '/api/test',
      steps: './test/__fixtures__/feature-integration/basic-steps',
    }))

    return new Promise<void>((resolve, reject) => {
      server = app.listen(port, () => {
        const options = {
          hostname: 'localhost',
          port,
          path: '/api/test',
          method: 'GET',
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
              const body = JSON.parse(data)
              expect(body.success).toBe(true)
              resolve()
            } catch (error) {
              reject(error)
            }
          })
        })

        req.on('error', reject)
        req.end()
      })

      // Timeout handling
      setTimeout(() => {
        reject(new Error('Test timeout'))
      }, 5000).unref()
    })
  })
})
