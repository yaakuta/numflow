/**
 * Response Extensions Advanced Features Tests

 */

import numflow, { Application } from '../src/index'
import http from 'http'
import * as fs from 'fs'
import * as path from 'path'

describe('Response Advanced Features', () => {
  let app: Application
  let server: http.Server

  // Temporary file paths for testing
  const testFilesDir = path.join(__dirname, 'temp-files')
  const testTextFile = path.join(testFilesDir, 'test.txt')
  const testHtmlFile = path.join(testFilesDir, 'test.html')
  const testPdfFile = path.join(testFilesDir, 'test.pdf')

  beforeAll(() => {
    // Create test directory and files
    if (!fs.existsSync(testFilesDir)) {
      fs.mkdirSync(testFilesDir, { recursive: true })
    }

    fs.writeFileSync(testTextFile, 'Hello, World!')
    fs.writeFileSync(testHtmlFile, '<html><body>Test HTML</body></html>')
    fs.writeFileSync(testPdfFile, 'Fake PDF content') // Not a real PDF but for testing
  })

  afterAll(() => {
    // Clean up test files
    if (fs.existsSync(testFilesDir)) {
      fs.rmSync(testFilesDir, { recursive: true, force: true })
    }
  })

  afterEach(async () => {
    if (server && server.listening) {
      // Force close all active connections with closeAllConnections()
      if (typeof server.closeAllConnections === 'function') {
        server.closeAllConnections()
      }

      // Set timeout to force proceed if server does not close properly
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

  describe('res.jsonp()', () => {
    it('should send JSONP response when callback parameter exists', (done) => {
      app = numflow()
      const port = 10000

      app.get('/api/data', (_req, res) => {
        res.jsonp({ name: 'John', age: 30 })
      })

      server = app.listen(port, () => {
        http.get(`http://localhost:${port}/api/data?callback=myCallback`, (res) => {
          let data = ''
          res.on('data', (chunk) => {
            data += chunk
          })
          res.on('end', () => {
            expect(res.headers['content-type']).toBe('application/javascript; charset=utf-8')
            expect(res.headers['x-content-type-options']).toBe('nosniff')
            expect(data).toContain('myCallback')
            expect(data).toContain('{"name":"John","age":30}')
            done()
          })
        })
      })
    })

    it('should send regular JSON response when callback parameter is missing', (done) => {
      app = numflow()
      const port = 10001

      app.get('/api/data', (_req, res) => {
        res.jsonp({ name: 'John' })
      })

      server = app.listen(port, () => {
        http.get(`http://localhost:${port}/api/data`, (res) => {
          let data = ''
          res.on('data', (chunk) => {
            data += chunk
          })
          res.on('end', () => {
            expect(res.headers['content-type']).toBe('application/json; charset=utf-8')
            expect(JSON.parse(data)).toEqual({ name: 'John' })
            done()
          })
        })
      })
    })

    it('should reject invalid callback names', (done) => {
      app = numflow()
      const port = 10002

      app.get('/api/data', (_req, res) => {
        res.jsonp({ name: 'John' })
      })

      server = app.listen(port, () => {
        http.get(`http://localhost:${port}/api/data?callback=alert(1)`, (res) => {
          let data = ''
          res.on('data', (chunk) => {
            data += chunk
          })
          res.on('end', () => {
            expect(res.statusCode).toBe(400)
            expect(data).toBe('Invalid callback parameter')
            done()
          })
        })
      })
    })

    it('should allow valid callback names (nested object notation)', (done) => {
      app = numflow()
      const port = 10003

      app.get('/api/data', (_req, res) => {
        res.jsonp({ name: 'John' })
      })

      server = app.listen(port, () => {
        http.get(`http://localhost:${port}/api/data?callback=obj.method`, (res) => {
          let data = ''
          res.on('data', (chunk) => {
            data += chunk
          })
          res.on('end', () => {
            expect(res.statusCode).toBe(200)
            expect(data).toContain('obj.method')
            done()
          })
        })
      })
    })

    // XSS Protection Tests - Enhanced Security
    it('should reject callback with brackets (XSS attack)', (done) => {
      app = numflow()
      const port = 10010

      app.get('/api/data', (_req, res) => {
        res.jsonp({ name: 'John' })
      })

      server = app.listen(port, () => {
        http.get(`http://localhost:${port}/api/data?callback=evil[arbitrary]`, (res) => {
          let data = ''
          res.on('data', (chunk) => {
            data += chunk
          })
          res.on('end', () => {
            expect(res.statusCode).toBe(400)
            expect(data).toBe('Invalid callback parameter')
            done()
          })
        })
      })
    })

    it('should reject callback with array notation (XSS attack)', (done) => {
      app = numflow()
      const port = 10011

      app.get('/api/data', (_req, res) => {
        res.jsonp({ name: 'John' })
      })

      server = app.listen(port, () => {
        http.get(`http://localhost:${port}/api/data?callback=foo[bar][baz]`, (res) => {
          let data = ''
          res.on('data', (chunk) => {
            data += chunk
          })
          res.on('end', () => {
            expect(res.statusCode).toBe(400)
            expect(data).toBe('Invalid callback parameter')
            done()
          })
        })
      })
    })

    it('should allow deeply nested object notation (valid)', (done) => {
      app = numflow()
      const port = 10012

      app.get('/api/data', (_req, res) => {
        res.jsonp({ name: 'John' })
      })

      server = app.listen(port, () => {
        http.get(
          `http://localhost:${port}/api/data?callback=obj.nested.deep.method`,
          (res) => {
            let data = ''
            res.on('data', (chunk) => {
              data += chunk
            })
            res.on('end', () => {
              expect(res.statusCode).toBe(200)
              expect(data).toContain('obj.nested.deep.method')
              done()
            })
          },
        )
      })
    })
  })

  describe('res.sendFile()', () => {
    it('should send file', (done) => {
      app = numflow()
      const port = 10004

      app.get('/file', (_req, res) => {
        res.sendFile(testTextFile)
      })

      server = app.listen(port, () => {
        http.get(`http://localhost:${port}/file`, (res) => {
          let data = ''
          res.on('data', (chunk) => {
            data += chunk
          })
          res.on('end', () => {
            expect(res.statusCode).toBe(200)
            expect(res.headers['content-type']).toBe('text/plain')
            expect(data).toBe('Hello, World!')
            done()
          })
        })
      })
    })

    it('should send HTML file with correct Content-Type', (done) => {
      app = numflow()
      const port = 10005

      app.get('/file', (_req, res) => {
        res.sendFile(testHtmlFile)
      })

      server = app.listen(port, () => {
        http.get(`http://localhost:${port}/file`, (res) => {
          let data = ''
          res.on('data', (chunk) => {
            data += chunk
          })
          res.on('end', () => {
            expect(res.statusCode).toBe(200)
            expect(res.headers['content-type']).toBe('text/html')
            expect(data).toContain('Test HTML')
            done()
          })
        })
      })
    })

    it('should return 404 for non-existent file', (done) => {
      app = numflow()
      const port = 10006

      app.get('/file', (_req, res) => {
        res.sendFile(path.join(testFilesDir, 'nonexistent.txt'))
      })

      server = app.listen(port, () => {
        http.get(`http://localhost:${port}/file`, (res) => {
          expect(res.statusCode).toBe(404)
          done()
        })
      })
    })

    it('should convert relative path to absolute path', (done) => {
      app = numflow()
      const port = 10007

      app.get('/file', (_req, res) => {
        // Use relative path
        const relativePath = path.relative(process.cwd(), testTextFile)
        res.sendFile(relativePath)
      })

      server = app.listen(port, () => {
        http.get(`http://localhost:${port}/file`, (res) => {
          let data = ''
          res.on('data', (chunk) => {
            data += chunk
          })
          res.on('end', () => {
            expect(res.statusCode).toBe(200)
            expect(data).toBe('Hello, World!')
            done()
          })
        })
      })
    })

    it('should set Content-Length and Last-Modified headers', (done) => {
      app = numflow()
      const port = 10008

      app.get('/file', (_req, res) => {
        res.sendFile(testTextFile)
      })

      server = app.listen(port, () => {
        http.get(`http://localhost:${port}/file`, (res) => {
          let data = ''
          res.on('data', (chunk) => {
            data += chunk
          })
          res.on('end', () => {
            expect(res.headers['content-length']).toBe('13') // 'Hello, World!' = 13 bytes
            expect(res.headers['last-modified']).toBeDefined()
            done()
          })
        })
      })
    })
  })

  describe('res.download()', () => {
    it('should send file as download', (done) => {
      app = numflow()
      const port = 10009

      app.get('/download', (_req, res) => {
        res.download(testTextFile)
      })

      server = app.listen(port, () => {
        http.get(`http://localhost:${port}/download`, (res) => {
          let data = ''
          res.on('data', (chunk) => {
            data += chunk
          })
          res.on('end', () => {
            expect(res.statusCode).toBe(200)
            expect(res.headers['content-disposition']).toContain('attachment')
            expect(res.headers['content-disposition']).toContain('test.txt')
            expect(data).toBe('Hello, World!')
            done()
          })
        })
      })
    })

    it('should be able to specify custom filename', (done) => {
      app = numflow()
      const port = 10010

      app.get('/download', (_req, res) => {
        res.download(testTextFile, 'custom-filename.txt')
      })

      server = app.listen(port, () => {
        http.get(`http://localhost:${port}/download`, (res) => {
          let data = ''
          res.on('data', (chunk) => {
            data += chunk
          })
          res.on('end', () => {
            expect(res.headers['content-disposition']).toContain('custom-filename.txt')
            done()
          })
        })
      })
    })

    it('should download PDF file', (done) => {
      app = numflow()
      const port = 10011

      app.get('/download', (_req, res) => {
        res.download(testPdfFile)
      })

      server = app.listen(port, () => {
        http.get(`http://localhost:${port}/download`, (res) => {
          let data = ''
          res.on('data', (chunk) => {
            data += chunk
          })
          res.on('end', () => {
            expect(res.statusCode).toBe(200)
            expect(res.headers['content-type']).toBe('application/pdf')
            expect(res.headers['content-disposition']).toContain('test.pdf')
            done()
          })
        })
      })
    })

    it('should return 404 for non-existent file', (done) => {
      app = numflow()
      const port = 10012

      app.get('/download', (_req, res) => {
        res.download(path.join(testFilesDir, 'nonexistent.pdf'))
      })

      server = app.listen(port, () => {
        http.get(`http://localhost:${port}/download`, (res) => {
          expect(res.statusCode).toBe(404)
          done()
        })
      })
    })

    it('should URL encode Korean filename', (done) => {
      app = numflow()
      const port = 10013

      app.get('/download', (_req, res) => {
        res.download(testTextFile, '테스트파일.txt')
      })

      server = app.listen(port, () => {
        http.get(`http://localhost:${port}/download`, (res) => {
          const disposition = res.headers['content-disposition'] as string
          expect(disposition).toContain('attachment')
          expect(disposition).toContain(encodeURIComponent('테스트파일.txt'))
          done()
        })
      })
    })
  })

  describe('res.render()', () => {
    it('should return error when view engine is not configured', (done) => {
      app = numflow()
      const port = 10014

      app.get('/render', (_req, res) => {
        res.render('index', { title: 'Test' })
      })

      server = app.listen(port, () => {
        http.get(`http://localhost:${port}/render`, (res) => {
          let data = ''
          res.on('data', (chunk) => {
            data += chunk
          })
          res.on('end', () => {
            expect(res.statusCode).toBe(500)
            expect(data).toContain('No view engine configured')
            done()
          })
        })
      })
    })

    it('should return error when view file does not exist', (done) => {
      app = numflow()
      const port = 10015

      app.set('view engine', 'ejs')
      app.set('views', testFilesDir)

      app.get('/render', (_req, res) => {
        res.render('nonexistent', { title: 'Test' })
      })

      server = app.listen(port, () => {
        http.get(`http://localhost:${port}/render`, (res) => {
          let data = ''
          res.on('data', (chunk) => {
            data += chunk
          })
          res.on('end', () => {
            expect(res.statusCode).toBe(500)
            expect(data).toContain('View file not found')
            done()
          })
        })
      })
    })

    // EJS rendering test (only if EJS is installed)
    it('should render EJS template (if ejs installed)', (done) => {
      try {
        require('ejs')
      } catch (err) {
        // Skip test if EJS is not available
        done()
        return
      }

      app = numflow()
      const port = 10016

      // Create test EJS template
      const ejsTemplate = path.join(testFilesDir, 'test.ejs')
      fs.writeFileSync(ejsTemplate, '<h1><%= title %></h1><p><%= message %></p>')

      app.set('view engine', 'ejs')
      app.set('views', testFilesDir)

      app.get('/render', (_req, res) => {
        res.render('test', { title: 'Hello', message: 'World' })
      })

      server = app.listen(port, () => {
        http.get(`http://localhost:${port}/render`, (res) => {
          let data = ''
          res.on('data', (chunk) => {
            data += chunk
          })
          res.on('end', () => {
            expect(res.statusCode).toBe(200)
            expect(res.headers['content-type']).toContain('text/html')
            expect(data).toContain('<h1>Hello</h1>')
            expect(data).toContain('<p>World</p>')

            // Clean up template file
            fs.unlinkSync(ejsTemplate)
            done()
          })
        })
      })
    })

    it('should return error for unsupported template engine', (done) => {
      app = numflow()
      const port = 10017

      app.set('view engine', 'unsupported')
      app.set('views', testFilesDir)

      // Create test template file
      const templateFile = path.join(testFilesDir, 'test.unsupported')
      fs.writeFileSync(templateFile, '<h1>Test</h1>')

      app.get('/render', (_req, res) => {
        res.render('test', {})
      })

      server = app.listen(port, () => {
        http.get(`http://localhost:${port}/render`, (res) => {
          let data = ''
          res.on('data', (chunk) => {
            data += chunk
          })
          res.on('end', () => {
            expect(res.statusCode).toBe(500)
            expect(data).toContain('Unsupported view engine')

            // Clean up template file
            fs.unlinkSync(templateFile)
            done()
          })
        })
      })
    })
  })

  describe('MIME Type Detection', () => {
    it('should correctly detect MIME types for various file extensions', (done) => {
      app = numflow()
      const port = 10018

      // Create test files of various types
      const testFiles: Array<[string, string]> = [
        ['test.json', 'application/json'],
        ['test.css', 'text/css'],
        ['test.js', 'application/javascript'],
        ['test.png', 'image/png'],
        ['test.jpg', 'image/jpeg'],
        ['test.gif', 'image/gif'],
        ['test.svg', 'image/svg+xml'],
        ['test.pdf', 'application/pdf'],
        ['test.xml', 'application/xml'],
      ]

      let completedTests = 0
      const totalTests = testFiles.length

      testFiles.forEach(([filename]) => {
        const filePath = path.join(testFilesDir, filename)
        fs.writeFileSync(filePath, 'test content')
      })

      server = app.listen(port, () => {
        testFiles.forEach(([filename, expectedMime], index) => {
          const filePath = path.join(testFilesDir, filename)

          app.get(`/file${index}`, (_req, res) => {
            res.sendFile(filePath)
          })

          http.get(`http://localhost:${port}/file${index}`, (res) => {
            expect(res.headers['content-type']).toBe(expectedMime)

            completedTests++
            if (completedTests === totalTests) {
              // Clean up test files
              testFiles.forEach(([filename]) => {
                const filePath = path.join(testFilesDir, filename)
                if (fs.existsSync(filePath)) {
                  fs.unlinkSync(filePath)
                }
              })
              done()
            }
          })
        })
      })
    })
  })
})
