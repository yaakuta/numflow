/**
 * Router Advanced Features Tests
 * Improving uncovered code coverage in router.ts
 */

import numflow, { Application } from '../src/index'
import http from 'http'

describe('Router Advanced Features', () => {
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

  describe('Additional HTTP Methods', () => {
    it('should handle PUT method', (done) => {
      app = numflow()
      const port = 8100

      app.put('/users/:id', (req: any, res) => {
        res.json({ method: 'PUT', id: req.params.id })
      })

      server = app.listen(port, () => {
        const options = {
          method: 'PUT',
          hostname: 'localhost',
          port: port,
          path: '/users/123',
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
            const body = JSON.parse(data)
            expect(body.method).toBe('PUT')
            expect(body.id).toBe('123')
            done()
          })
        })

        req.end()
      })
    })

    it('should handle DELETE method', (done) => {
      app = numflow()
      const port = 7001

      app.delete('/users/:id', (req: any, res) => {
        res.json({ method: 'DELETE', id: req.params.id })
      })

      server = app.listen(port, () => {
        const options = {
          method: 'DELETE',
          hostname: 'localhost',
          port: port,
          path: '/users/456',
        }

        const req = http.request(options, (res) => {
          let data = ''
          res.on('data', (chunk) => {
            data += chunk
          })
          res.on('end', () => {
            const body = JSON.parse(data)
            expect(body.method).toBe('DELETE')
            expect(body.id).toBe('456')
            done()
          })
        })

        req.end()
      })
    })

    it('should handle PATCH method', (done) => {
      app = numflow()
      const port = 7002

      app.patch('/users/:id', (req: any, res) => {
        res.json({ method: 'PATCH', id: req.params.id })
      })

      server = app.listen(port, () => {
        const options = {
          method: 'PATCH',
          hostname: 'localhost',
          port: port,
          path: '/users/789',
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
            const body = JSON.parse(data)
            expect(body.method).toBe('PATCH')
            expect(body.id).toBe('789')
            done()
          })
        })

        req.end()
      })
    })

    it('should handle HEAD method', (done) => {
      app = numflow()
      const port = 7003

      app.head('/users/:id', (req: any, res) => {
        res.setHeader('X-User-Id', req.params.id)
        res.end()
      })

      server = app.listen(port, () => {
        const options = {
          method: 'HEAD',
          hostname: 'localhost',
          port: port,
          path: '/users/999',
        }

        const req = http.request(options, (res) => {
          expect(res.headers['x-user-id']).toBe('999')
          done()
        })

        req.end()
      })
    })

    it('should handle OPTIONS method', (done) => {
      app = numflow()
      const port = 7004

      app.options('/users', (_req, res) => {
        res.setHeader('Allow', 'GET, POST, OPTIONS')
        res.end()
      })

      server = app.listen(port, () => {
        const options = {
          method: 'OPTIONS',
          hostname: 'localhost',
          port: port,
          path: '/users',
        }

        const req = http.request(options, (res) => {
          expect(res.headers['allow']).toBe('GET, POST, OPTIONS')
          done()
        })

        req.end()
      })
    })
  })

  describe('RouteChain Methods', () => {
    it('should support route().put()', (done) => {
      app = numflow()
      const port = 7005

      app.route('/api/items/:id').put((req: any, res) => {
        res.json({ action: 'update', id: req.params.id })
      })

      server = app.listen(port, () => {
        const options = {
          method: 'PUT',
          hostname: 'localhost',
          port: port,
          path: '/api/items/100',
        }

        const req = http.request(options, (res) => {
          let data = ''
          res.on('data', (chunk) => {
            data += chunk
          })
          res.on('end', () => {
            const body = JSON.parse(data)
            expect(body.action).toBe('update')
            expect(body.id).toBe('100')
            done()
          })
        })

        req.end()
      })
    })

    it('should support route().delete()', (done) => {
      app = numflow()
      const port = 7006

      app.route('/api/items/:id').delete((req: any, res) => {
        res.json({ action: 'delete', id: req.params.id })
      })

      server = app.listen(port, () => {
        const options = {
          method: 'DELETE',
          hostname: 'localhost',
          port: port,
          path: '/api/items/200',
        }

        const req = http.request(options, (res) => {
          let data = ''
          res.on('data', (chunk) => {
            data += chunk
          })
          res.on('end', () => {
            const body = JSON.parse(data)
            expect(body.action).toBe('delete')
            expect(body.id).toBe('200')
            done()
          })
        })

        req.end()
      })
    })

    it('should support route().patch()', (done) => {
      app = numflow()
      const port = 7007

      app.route('/api/items/:id').patch((req: any, res) => {
        res.json({ action: 'patch', id: req.params.id })
      })

      server = app.listen(port, () => {
        const options = {
          method: 'PATCH',
          hostname: 'localhost',
          port: port,
          path: '/api/items/300',
        }

        const req = http.request(options, (res) => {
          let data = ''
          res.on('data', (chunk) => {
            data += chunk
          })
          res.on('end', () => {
            const body = JSON.parse(data)
            expect(body.action).toBe('patch')
            expect(body.id).toBe('300')
            done()
          })
        })

        req.end()
      })
    })

    it('should support route().all()', (done) => {
      app = numflow()
      const port = 7008

      app.route('/api/all/:id').all((req: any, res) => {
        res.json({ method: req.method, id: req.params.id })
      })

      server = app.listen(port, () => {
        const options = {
          method: 'PUT',
          hostname: 'localhost',
          port: port,
          path: '/api/all/400',
        }

        const req = http.request(options, (res) => {
          let data = ''
          res.on('data', (chunk) => {
            data += chunk
          })
          res.on('end', () => {
            const body = JSON.parse(data)
            expect(body.method).toBe('PUT')
            expect(body.id).toBe('400')
            done()
          })
        })

        req.end()
      })
    })

    it('should be able to register multiple methods with route() chaining', (done) => {
      app = numflow()
      const port = 7009

      let getCalled = false
      let putCalled = false
      let deleteCalled = false

      app
        .route('/api/resource/:id')
        .get((_req, res) => {
          getCalled = true
          res.json({ method: 'GET' })
        })
        .put((_req, res) => {
          putCalled = true
          res.json({ method: 'PUT' })
        })
        .delete((_req, res) => {
          deleteCalled = true
          res.json({ method: 'DELETE' })
        })

      server = app.listen(port, () => {
        // Test GET
        http.get(`http://localhost:${port}/api/resource/1`, (res) => {
          let data = ''
          res.on('data', (chunk) => {
            data += chunk
          })
          res.on('end', () => {
            expect(getCalled).toBe(true)

            // Test PUT
            const putReq = http.request(
              {
                method: 'PUT',
                hostname: 'localhost',
                port: port,
                path: '/api/resource/1',
              },
              (res) => {
                let putData = ''
                res.on('data', (chunk) => {
                  putData += chunk
                })
                res.on('end', () => {
                  expect(putCalled).toBe(true)

                  // Test DELETE
                  const deleteReq = http.request(
                    {
                      method: 'DELETE',
                      hostname: 'localhost',
                      port: port,
                      path: '/api/resource/1',
                    },
                    (res) => {
                      let deleteData = ''
                      res.on('data', (chunk) => {
                        deleteData += chunk
                      })
                      res.on('end', () => {
                        expect(deleteCalled).toBe(true)
                        done()
                      })
                    }
                  )
                  deleteReq.end()
                })
              }
            )
            putReq.end()
          })
        })
      })
    })
  })

  describe('Nested Router', () => {
    it('should be able to pass Router instance directly to use()', (done) => {
      app = numflow()
      const port = 7010

      const apiRouter = numflow.Router()
      apiRouter.get('/users', (_req: any, res: any) => {
        res.json({ message: 'Users list' })
      })

      // Pass Router directly (without path)
      app.use(apiRouter)

      server = app.listen(port, () => {
        http.get(`http://localhost:${port}/users`, (res) => {
          let data = ''
          res.on('data', (chunk) => {
            data += chunk
          })
          res.on('end', () => {
            const body = JSON.parse(data)
            expect(body.message).toBe('Users list')
            done()
          })
        })
      })
    })

    it('should be able to pass Router instance with path', (done) => {
      app = numflow()
      const port = 7011

      const apiRouter = numflow.Router()
      apiRouter.get('/users', (_req: any, res: any) => {
        res.json({ message: 'API Users' })
      })

      app.use('/api', apiRouter)

      server = app.listen(port, () => {
        http.get(`http://localhost:${port}/api/users`, (res) => {
          let data = ''
          res.on('data', (chunk) => {
            data += chunk
          })
          res.on('end', () => {
            const body = JSON.parse(data)
            expect(body.message).toBe('API Users')
            done()
          })
        })
      })
    })

    it('should be able to register path-specific middleware', (done) => {
      app = numflow()
      const port = 7012

      let middlewareCalled = false

      // Path-specific middleware
      app.use('/admin', (req: any, _res: any, next: any) => {
        middlewareCalled = true
        req.isAdmin = true
        next()
      })

      app.get('/admin/dashboard', (req: any, res) => {
        res.json({ isAdmin: req.isAdmin })
      })

      app.get('/public', (req: any, res) => {
        res.json({ isAdmin: req.isAdmin })
      })

      server = app.listen(port, () => {
        http.get(`http://localhost:${port}/admin/dashboard`, (res) => {
          let data = ''
          res.on('data', (chunk) => {
            data += chunk
          })
          res.on('end', () => {
            const body = JSON.parse(data)
            expect(middlewareCalled).toBe(true)
            expect(body.isAdmin).toBe(true)
            done()
          })
        })
      })
    })
  })

})
