/**
 * Compression Middleware Tests

 */

import numflow, { Application, compression } from '../src/index'
import http from 'http'
import * as zlib from 'zlib'

describe('Compression Middleware', () => {
  let app: Application
  let server: http.Server

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

  describe('Basic Behavior', () => {
    it('should not compress when Accept-Encoding header is absent', (done) => {
      app = numflow()
      const port = 4000

      app.use(compression())
      app.get('/test', (_req, res) => {
        res.send('Hello World')
      })

      server = app.listen(port, () => {
        http.get(`http://localhost:${port}/test`, (res) => {
          expect(res.headers['content-encoding']).toBeUndefined()
          done()
        })
      })
    })

    it('should use gzip compression when gzip is in Accept-Encoding', (done) => {
      app = numflow()
      const port = 4001

      app.use(compression())
      app.get('/test', (_req, res) => {
        res.send('a'.repeat(2000)) // exceeds threshold
      })

      server = app.listen(port, () => {
        const options = {
          hostname: 'localhost',
          port: port,
          path: '/test',
          headers: {
            'Accept-Encoding': 'gzip, deflate',
          },
        }

        http.get(options, (res) => {
          expect(res.headers['content-encoding']).toBe('gzip')
          expect(res.headers['vary']).toBe('Accept-Encoding')
          done()
        })
      })
    })

    it('should use deflate compression when only deflate is in Accept-Encoding', (done) => {
      app = numflow()
      const port = 4002

      app.use(compression())
      app.get('/test', (_req, res) => {
        res.send('a'.repeat(2000))
      })

      server = app.listen(port, () => {
        const options = {
          hostname: 'localhost',
          port: port,
          path: '/test',
          headers: {
            'Accept-Encoding': 'deflate',
          },
        }

        http.get(options, (res) => {
          expect(res.headers['content-encoding']).toBe('deflate')
          done()
        })
      })
    })

    it('should be able to correctly decode compressed data', (done) => {
      app = numflow()
      const port = 4003

      app.use(compression())
      app.get('/test', (_req, res) => {
        res.send('a'.repeat(2000))
      })

      server = app.listen(port, () => {
        const options = {
          hostname: 'localhost',
          port: port,
          path: '/test',
          headers: {
            'Accept-Encoding': 'gzip',
          },
        }

        http.get(options, (res) => {
          const gunzip = zlib.createGunzip()
          let decompressed = ''

          res.pipe(gunzip)
          gunzip.on('data', (chunk) => {
            decompressed += chunk.toString()
          })
          gunzip.on('end', () => {
            expect(decompressed).toBe('a'.repeat(2000))
            done()
          })
        })
      })
    })
  })

  describe('Threshold (Minimum Size)', () => {
    it('should not compress when below default threshold (1024)', (done) => {
      app = numflow()
      const port = 4004

      app.use(compression())
      app.get('/test', (_req, res) => {
        res.send('small') // < 1024 bytes
      })

      server = app.listen(port, () => {
        const options = {
          hostname: 'localhost',
          port: port,
          path: '/test',
          headers: {
            'Accept-Encoding': 'gzip',
          },
        }

        http.get(options, (res) => {
          expect(res.headers['content-encoding']).toBeUndefined()
          done()
        })
      })
    })

    it('should compress when above threshold', (done) => {
      app = numflow()
      const port = 4005

      app.use(compression())
      app.get('/test', (_req, res) => {
        res.send('a'.repeat(2000)) // > 1024 bytes
      })

      server = app.listen(port, () => {
        const options = {
          hostname: 'localhost',
          port: port,
          path: '/test',
          headers: {
            'Accept-Encoding': 'gzip',
          },
        }

        http.get(options, (res) => {
          expect(res.headers['content-encoding']).toBe('gzip')
          done()
        })
      })
    })

    it('should be able to set custom threshold', (done) => {
      app = numflow()
      const port = 4006

      app.use(compression({ threshold: 500 }))
      app.get('/test', (_req, res) => {
        res.send('a'.repeat(600)) // > 500, < 1024
      })

      server = app.listen(port, () => {
        const options = {
          hostname: 'localhost',
          port: port,
          path: '/test',
          headers: {
            'Accept-Encoding': 'gzip',
          },
        }

        http.get(options, (res) => {
          expect(res.headers['content-encoding']).toBe('gzip')
          done()
        })
      })
    })
  })

  describe('Filter Function', () => {
    it('should compress text/* content type', (done) => {
      app = numflow()
      const port = 4007

      app.use(compression())
      app.get('/test', (_req, res) => {
        res.setHeader('Content-Type', 'text/html')
        res.send('<html>' + 'a'.repeat(2000) + '</html>')
      })

      server = app.listen(port, () => {
        const options = {
          hostname: 'localhost',
          port: port,
          path: '/test',
          headers: {
            'Accept-Encoding': 'gzip',
          },
        }

        http.get(options, (res) => {
          expect(res.headers['content-encoding']).toBe('gzip')
          done()
        })
      })
    })

    it('should compress application/json', (done) => {
      app = numflow()
      const port = 4008

      app.use(compression())
      app.get('/test', (_req, res) => {
        res.json({ data: 'a'.repeat(2000) })
      })

      server = app.listen(port, () => {
        const options = {
          hostname: 'localhost',
          port: port,
          path: '/test',
          headers: {
            'Accept-Encoding': 'gzip',
          },
        }

        http.get(options, (res) => {
          expect(res.headers['content-encoding']).toBe('gzip')
          done()
        })
      })
    })

    it('should be able to use custom filter function', (done) => {
      app = numflow()
      const port = 4009

      // filter that never compresses
      app.use(compression({ filter: () => false }))
      app.get('/test', (_req, res) => {
        res.send('a'.repeat(2000))
      })

      server = app.listen(port, () => {
        const options = {
          hostname: 'localhost',
          port: port,
          path: '/test',
          headers: {
            'Accept-Encoding': 'gzip',
          },
        }

        http.get(options, (res) => {
          expect(res.headers['content-encoding']).toBeUndefined()
          done()
        })
      })
    })
  })

  describe('Content-Encoding Header Handling', () => {
    it('should not compress when Content-Encoding is already set', (done) => {
      app = numflow()
      const port = 4010

      app.use(compression())
      app.get('/test', (_req, res) => {
        res.setHeader('Content-Encoding', 'identity')
        res.send('a'.repeat(2000))
      })

      server = app.listen(port, () => {
        const options = {
          hostname: 'localhost',
          port: port,
          path: '/test',
          headers: {
            'Accept-Encoding': 'gzip',
          },
        }

        http.get(options, (res) => {
          expect(res.headers['content-encoding']).toBe('identity')
          done()
        })
      })
    })

    it('should set Vary header', (done) => {
      app = numflow()
      const port = 4011

      app.use(compression())
      app.get('/test', (_req, res) => {
        res.send('a'.repeat(2000))
      })

      server = app.listen(port, () => {
        const options = {
          hostname: 'localhost',
          port: port,
          path: '/test',
          headers: {
            'Accept-Encoding': 'gzip',
          },
        }

        http.get(options, (res) => {
          expect(res.headers['vary']).toBe('Accept-Encoding')
          done()
        })
      })
    })
  })

  describe('Compression Level', () => {
    it('should be able to set custom compression level', (done) => {
      app = numflow()
      const port = 4012

      app.use(compression({ level: 9 })) // maximum compression
      app.get('/test', (_req, res) => {
        res.send('a'.repeat(2000))
      })

      server = app.listen(port, () => {
        const options = {
          hostname: 'localhost',
          port: port,
          path: '/test',
          headers: {
            'Accept-Encoding': 'gzip',
          },
        }

        http.get(options, (res) => {
          expect(res.headers['content-encoding']).toBe('gzip')
          done()
        })
      })
    })
  })
})
