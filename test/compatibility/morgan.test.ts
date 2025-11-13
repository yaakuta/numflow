/**
 * Morgan Compatibility Tests
 * Tests logging middleware compatibility with Numflow framework
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import { Application } from '../../src/application.js'
import morgan from 'morgan'
import * as http from 'http'

describe('Morgan Compatibility', () => {
  let app: Application
  let server: http.Server
  let logOutput: string[] = []

  beforeEach(() => {
    app = new Application()
    logOutput = []
  })

  afterEach(async () => {
    if (server && server.listening) {
      if (typeof server.closeAllConnections === 'function') {
        server.closeAllConnections()
      }
      await new Promise<void>((resolve) => {
        const timeout = setTimeout(() => resolve(), 2000)
        server.close(() => {
          clearTimeout(timeout)
          resolve()
        })
      })
    }
    server = null as any
  })

  it('should log requests with dev format', (done) => {
    // Custom stream to capture log output
    const stream = {
      write: (message: string) => {
        logOutput.push(message)
      },
    }

    app.use(morgan('dev', { stream }))

    app.get('/test', (_req, res) => {
      res.json({ success: true })
    })

    server = app.listen(0)
    const address = server.address()
    if (!address || typeof address === 'string') {
      done(new Error('Invalid server address'))
      return
    }
    const port = address.port

    http.get(`http://localhost:${port}/test`, (res) => {
      let data = ''
      res.on('data', (chunk) => {
        data += chunk
      })
      res.on('end', () => {
        expect(res.statusCode).toBe(200)
        expect(logOutput.length).toBeGreaterThan(0)
        expect(logOutput[0]).toContain('GET')
        expect(logOutput[0]).toContain('/test')
        expect(logOutput[0]).toContain('200')
        done()
      })
    })
  })

  it('should log requests with combined format', (done) => {
    const stream = {
      write: (message: string) => {
        logOutput.push(message)
      },
    }

    app.use(morgan('combined', { stream }))

    app.post('/api/data', (_req, res) => {
      res.json({ message: 'Created' })
    })

    server = app.listen(0)
    const address = server.address()
    if (!address || typeof address === 'string') {
      done(new Error('Invalid server address'))
      return
    }
    const port = address.port

    const req = http.request(
      {
        hostname: 'localhost',
        port,
        path: '/api/data',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Test-Agent',
        },
      },
      (res) => {
        let data = ''
        res.on('data', (chunk) => {
          data += chunk
        })
        res.on('end', () => {
          expect(res.statusCode).toBe(200)
          expect(logOutput.length).toBeGreaterThan(0)
          expect(logOutput[0]).toContain('POST')
          expect(logOutput[0]).toContain('/api/data')
          expect(logOutput[0]).toContain('Test-Agent')
          done()
        })
      }
    )

    req.end()
  })

  it('should log requests with custom format', (done) => {
    const stream = {
      write: (message: string) => {
        logOutput.push(message)
      },
    }

    app.use(
      morgan(':method :url :status :response-time ms', {
        stream,
      })
    )

    app.get('/custom', (_req, res) => {
      res.send('OK')
    })

    server = app.listen(0)
    const address = server.address()
    if (!address || typeof address === 'string') {
      done(new Error('Invalid server address'))
      return
    }
    const port = address.port

    http.get(`http://localhost:${port}/custom`, (res) => {
      let data = ''
      res.on('data', (chunk) => {
        data += chunk
      })
      res.on('end', () => {
        expect(res.statusCode).toBe(200)
        expect(logOutput.length).toBeGreaterThan(0)
        expect(logOutput[0]).toContain('GET')
        expect(logOutput[0]).toContain('/custom')
        expect(logOutput[0]).toContain('200')
        expect(logOutput[0]).toMatch(/\d+\.\d+ ms/)
        done()
      })
    })
  })

  it('should skip logging for specific routes', (done) => {
    const stream = {
      write: (message: string) => {
        logOutput.push(message)
      },
    }

    app.use(
      morgan('dev', {
        stream,
        skip: (req) => req.url === '/health',
      })
    )

    app.get('/health', (_req, res) => {
      res.json({ status: 'ok' })
    })

    app.get('/api', (_req, res) => {
      res.json({ data: 'test' })
    })

    server = app.listen(0)
    const address = server.address()
    if (!address || typeof address === 'string') {
      done(new Error('Invalid server address'))
      return
    }
    const port = address.port

    // Request /health (should be skipped)
    http.get(`http://localhost:${port}/health`, (res1) => {
      let data1 = ''
      res1.on('data', (chunk) => {
        data1 += chunk
      })
      res1.on('end', () => {
        expect(res1.statusCode).toBe(200)
        expect(logOutput.length).toBe(0) // No log for /health

        // Request /api (should be logged)
        http.get(`http://localhost:${port}/api`, (res2) => {
          let data2 = ''
          res2.on('data', (chunk) => {
            data2 += chunk
          })
          res2.on('end', () => {
            expect(res2.statusCode).toBe(200)
            expect(logOutput.length).toBe(1) // Log for /api only
            expect(logOutput[0]).toContain('/api')
            done()
          })
        })
      })
    })
  })
})
