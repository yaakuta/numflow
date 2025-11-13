/**
 * Multer Compatibility Tests
 * Tests file upload middleware compatibility with Numflow framework
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import { Application } from '../../src/application.js'
import multer from 'multer'
import * as http from 'http'
import * as fs from 'fs'
import * as path from 'path'

const UPLOAD_DIR = path.join(__dirname, '../fixtures/uploads')

describe('Multer Compatibility', () => {
  let app: Application
  let server: http.Server

  beforeEach(() => {
    app = new Application()
    // Create upload directory
    if (!fs.existsSync(UPLOAD_DIR)) {
      fs.mkdirSync(UPLOAD_DIR, { recursive: true })
    }
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

    // Clean up uploaded files
    if (fs.existsSync(UPLOAD_DIR)) {
      fs.rmSync(UPLOAD_DIR, { recursive: true, force: true })
    }
  })

  it('should handle single file upload', (done) => {
    const upload = multer({ dest: UPLOAD_DIR })

    app.post('/upload', upload.single('file') as any, (req: any, res) => {
      expect(req.file).toBeDefined()
      expect(req.file.fieldname).toBe('file')
      expect(req.file.originalname).toBeDefined()
      expect(req.file.size).toBeGreaterThan(0)
      res.json({ success: true, file: req.file })
    })

    server = app.listen(0)
    const address = server.address()
    if (!address || typeof address === 'string') {
      done(new Error('Invalid server address'))
      return
    }
    const port = address.port

    // Create multipart form data
    const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW'
    const body = [
      `--${boundary}`,
      'Content-Disposition: form-data; name="file"; filename="test.txt"',
      'Content-Type: text/plain',
      '',
      'Hello World',
      `--${boundary}--`,
    ].join('\r\n')

    const options = {
      hostname: 'localhost',
      port,
      path: '/upload',
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': Buffer.byteLength(body),
      },
    }

    const req = http.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => {
        data += chunk
      })
      res.on('end', () => {
        expect(res.statusCode).toBe(200)
        const json = JSON.parse(data)
        expect(json.success).toBe(true)
        expect(json.file).toBeDefined()
        expect(json.file.fieldname).toBe('file')
        done()
      })
    })

    req.on('error', (err) => {
      done(err)
    })

    req.write(body)
    req.end()
  })

  it('should handle multiple files upload', (done) => {
    const upload = multer({ dest: UPLOAD_DIR })

    app.post('/upload-multiple', upload.array('files', 3) as any, (req: any, res) => {
      expect(req.files).toBeDefined()
      expect(Array.isArray(req.files)).toBe(true)
      expect(req.files.length).toBeGreaterThan(0)
      res.json({ success: true, count: req.files.length })
    })

    server = app.listen(0)
    const address = server.address()
    if (!address || typeof address === 'string') {
      done(new Error('Invalid server address'))
      return
    }
    const port = address.port

    // Create multipart form data with multiple files
    const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW'
    const body = [
      `--${boundary}`,
      'Content-Disposition: form-data; name="files"; filename="test1.txt"',
      'Content-Type: text/plain',
      '',
      'File 1 content',
      `--${boundary}`,
      'Content-Disposition: form-data; name="files"; filename="test2.txt"',
      'Content-Type: text/plain',
      '',
      'File 2 content',
      `--${boundary}--`,
    ].join('\r\n')

    const options = {
      hostname: 'localhost',
      port,
      path: '/upload-multiple',
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': Buffer.byteLength(body),
      },
    }

    const req = http.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => {
        data += chunk
      })
      res.on('end', () => {
        expect(res.statusCode).toBe(200)
        const json = JSON.parse(data)
        expect(json.success).toBe(true)
        expect(json.count).toBeGreaterThanOrEqual(1)
        done()
      })
    })

    req.on('error', (err) => {
      done(err)
    })

    req.write(body)
    req.end()
  })

  it('should handle fields with files', (done) => {
    const upload = multer({ dest: UPLOAD_DIR })

    app.post(
      '/upload-fields',
      upload.fields([
        { name: 'avatar', maxCount: 1 },
        { name: 'gallery', maxCount: 2 },
      ]) as any,
      (req: any, res) => {
        expect(req.files).toBeDefined()
        expect(typeof req.files).toBe('object')
        res.json({ success: true, files: req.files })
      }
    )

    server = app.listen(0)
    const address = server.address()
    if (!address || typeof address === 'string') {
      done(new Error('Invalid server address'))
      return
    }
    const port = address.port

    // Create multipart form data with different field names
    const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW'
    const body = [
      `--${boundary}`,
      'Content-Disposition: form-data; name="avatar"; filename="avatar.png"',
      'Content-Type: image/png',
      '',
      'Avatar image data',
      `--${boundary}`,
      'Content-Disposition: form-data; name="gallery"; filename="photo1.jpg"',
      'Content-Type: image/jpeg',
      '',
      'Photo 1 data',
      `--${boundary}--`,
    ].join('\r\n')

    const options = {
      hostname: 'localhost',
      port,
      path: '/upload-fields',
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': Buffer.byteLength(body),
      },
    }

    const req = http.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => {
        data += chunk
      })
      res.on('end', () => {
        expect(res.statusCode).toBe(200)
        const json = JSON.parse(data)
        expect(json.success).toBe(true)
        done()
      })
    })

    req.on('error', (err) => {
      done(err)
    })

    req.write(body)
    req.end()
  })

  it('should handle file size limit', (done) => {
    const upload = multer({
      dest: UPLOAD_DIR,
      limits: { fileSize: 10 }, // 10 bytes limit
    })

    app.post('/upload-limit', upload.single('file') as any, (_req: any, res) => {
      res.json({ success: true })
    })

    app.use((err: any, _req: any, res: any, _next: any) => {
      if (err.code === 'LIMIT_FILE_SIZE') {
        res.status(413).json({ error: 'File too large' })
      } else {
        _next(err)
      }
    })

    server = app.listen(0)
    const address = server.address()
    if (!address || typeof address === 'string') {
      done(new Error('Invalid server address'))
      return
    }
    const port = address.port

    // Create multipart form data with large file
    const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW'
    const body = [
      `--${boundary}`,
      'Content-Disposition: form-data; name="file"; filename="large.txt"',
      'Content-Type: text/plain',
      '',
      'This content is larger than 10 bytes',
      `--${boundary}--`,
    ].join('\r\n')

    const options = {
      hostname: 'localhost',
      port,
      path: '/upload-limit',
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': Buffer.byteLength(body),
      },
    }

    const req = http.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => {
        data += chunk
      })
      res.on('end', () => {
        expect(res.statusCode).toBe(413)
        const json = JSON.parse(data)
        expect(json.error).toBe('File too large')
        done()
      })
    })

    req.on('error', (err) => {
      done(err)
    })

    req.write(body)
    req.end()
  })

  it('should work with req.body for text fields', (done) => {
    const upload = multer({ dest: UPLOAD_DIR })

    app.post('/upload-with-fields', upload.single('file') as any, (req: any, res) => {
      expect(req.file).toBeDefined()
      expect(req.body).toBeDefined()
      expect(req.body.username).toBeDefined()
      res.json({
        success: true,
        username: req.body.username,
        filename: req.file.originalname,
      })
    })

    server = app.listen(0)
    const address = server.address()
    if (!address || typeof address === 'string') {
      done(new Error('Invalid server address'))
      return
    }
    const port = address.port

    // Create multipart form data with file and text fields
    const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW'
    const body = [
      `--${boundary}`,
      'Content-Disposition: form-data; name="username"',
      '',
      'john_doe',
      `--${boundary}`,
      'Content-Disposition: form-data; name="file"; filename="document.pdf"',
      'Content-Type: application/pdf',
      '',
      'PDF content here',
      `--${boundary}--`,
    ].join('\r\n')

    const options = {
      hostname: 'localhost',
      port,
      path: '/upload-with-fields',
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': Buffer.byteLength(body),
      },
    }

    const req = http.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => {
        data += chunk
      })
      res.on('end', () => {
        expect(res.statusCode).toBe(200)
        const json = JSON.parse(data)
        expect(json.success).toBe(true)
        expect(json.username).toBe('john_doe')
        expect(json.filename).toBe('document.pdf')
        done()
      })
    })

    req.on('error', (err) => {
      done(err)
    })

    req.write(body)
    req.end()
  })
})
