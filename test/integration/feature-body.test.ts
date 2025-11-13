/**
 * Feature body parsing integration test
 * Body parser behavior verification
 */

import numflow from '../../src/index'
import { Application } from '../../src/application'
import http from 'http'

jest.setTimeout(10000)

describe('Feature Body Parsing Integration', () => {
  let app: Application
  let server: http.Server | null = null
  let portCounter = 8300

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

  it('Feature should receive parsed JSON body', async () => {
    app = numflow()
    const port = portCounter

    // Body parser is auto-enabled
    // app.use(numflow.json()) is optional

    app.use(numflow.feature({
      method: 'POST',
      path: '/api/test',
      steps: './test/__fixtures__/feature-integration/body-steps',
      contextInitializer: (ctx: any, req: any) => {
        ctx.requestBody = req.body
      },
    }))

    return new Promise<void>((resolve, reject) => {
      server = app.listen(port, () => {
        const postData = JSON.stringify({
          username: 'testuser',
          password: 'testpass',
        })

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
              const body = JSON.parse(data)
              expect(body.success).toBe(true)
              expect(body.data.bodyParsed).toBe(true)
              expect(body.data.username).toBe('testuser')
              resolve()
            } catch (error) {
              reject(error)
            }
          })
        })

        req.on('error', (err) => {
          console.error('Request error:', err)
          reject(err)
        })
        req.write(postData)
        req.end()
      })

      setTimeout(() => {
        reject(new Error('Test timeout'))
      }, 5000).unref()
    })
  })
})
