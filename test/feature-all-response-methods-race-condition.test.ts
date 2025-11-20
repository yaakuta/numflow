/**
 * Comprehensive race condition tests for ALL response methods
 *
 * Tests every response method in catch blocks without await to ensure
 * the _responsePending flag prevents next step execution.
 *
 * Tested methods:
 * - res.render()
 * - res.sendFile()
 * - res.download()
 * - res.redirect()
 * - res.json()
 * - res.send()
 */

import { AutoExecutor } from '../src/feature/auto-executor.js'
import { extendResponse } from '../src/response-extensions.js'
import { extendRequest } from '../src/request-extensions.js'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'

describe('Feature - All Response Methods Race Condition', () => {
  let tempDir: string
  let viewsDir: string
  let filesDir: string

  beforeEach(() => {
    // Create temp directories
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'numflow-test-'))
    viewsDir = path.join(tempDir, 'views')
    filesDir = path.join(tempDir, 'files')
    fs.mkdirSync(viewsDir, { recursive: true })
    fs.mkdirSync(filesDir, { recursive: true })

    // Create test files
    fs.writeFileSync(
      path.join(viewsDir, 'error.ejs'),
      '<html><body><h1>Error: <%= message %></h1></body></html>'
    )
    fs.writeFileSync(
      path.join(filesDir, 'test.txt'),
      'Test file content'
    )
  })

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true })
    }
  })

  // Helper to create mock app
  const createMockApp = () => ({
    get: (key: string) => {
      if (key === 'view engine') return 'ejs'
      if (key === 'views') return viewsDir
      return undefined
    },
    locals: {},
  })

  // Helper to create mock request
  const createMockReq = () => ({
    method: 'POST',
    url: '/test',
  } as any)

  // Helper to create mock response
  const createMockRes = (mockApp: any) => {
    let headersSentValue = false
    const eventListeners: Record<string, Function[]> = {}

    const mockRes = {
      app: mockApp,
      statusCode: 200,
      locals: {},

      setHeader: function(_name: string, _value: any) {
        return this
      },

      getHeader: () => undefined,

      end: function(_data?: any) {
        headersSentValue = true
        Object.defineProperty(this, 'headersSent', {
          get: () => headersSentValue,
          configurable: true,
        })
      },

      send: function(body: any) {
        this.end(body)
        return this
      },

      // Stream support for sendFile/download
      on: function(event: string, handler: Function) {
        if (!eventListeners[event]) {
          eventListeners[event] = []
        }
        eventListeners[event].push(handler)
        return this
      },

      once: function(event: string, handler: Function) {
        const onceWrapper = (...args: any[]) => {
          handler(...args)
          const idx = eventListeners[event]?.indexOf(onceWrapper)
          if (idx !== undefined && idx > -1) {
            eventListeners[event].splice(idx, 1)
          }
        }
        if (!eventListeners[event]) {
          eventListeners[event] = []
        }
        eventListeners[event].push(onceWrapper)
        return this
      },

      emit: function(event: string, ...args: any[]) {
        if (eventListeners[event]) {
          eventListeners[event].forEach(handler => handler(...args))
        }
        return this
      },

      // Writable stream methods
      write: function(_chunk: any) {
        return true
      },

      // For pipe() to work
      writable: true,
    } as any

    Object.defineProperty(mockRes, 'headersSent', {
      get: () => headersSentValue,
      configurable: true,
    })

    return mockRes
  }

  describe('res.render() in catch block', () => {
    it('should prevent next step when called without await', async () => {
      const mockApp = createMockApp()
      const mockReq = createMockReq()
      const mockRes = createMockRes(mockApp)

      extendRequest(mockReq)
      extendResponse(mockRes)

      const context = {
        step200Executed: false,
        step300Executed: false,
      }

      const step200 = async (ctx: any, _req: any, res: any) => {
        ctx.step200Executed = true
        try {
          const error: any = new Error('Prisma error')
          error.code = 'P2002'
          throw error
        } catch (error: any) {
          if (error.code === 'P2002') {
            // ❌ No await
            return res.status(400).render('error', { message: 'Duplicate' })
          }
        }
      }

      const step300 = async (ctx: any, _req: any, res: any) => {
        ctx.step300Executed = true
        res.json({ error: 'Should not execute' })
      }

      const steps = [
        { number: 200, name: '200-test.js', path: '/test/200-test.js', fn: step200 },
        { number: 300, name: '300-test.js', path: '/test/300-test.js', fn: step300 },
      ]

      const executor = new AutoExecutor({ steps, context, req: mockReq, res: mockRes })
      await executor.execute()

      expect(context.step200Executed).toBe(true)
      expect(context.step300Executed).toBe(false) // ✅ Should NOT execute
      expect(mockRes.statusCode).toBe(400)
      expect((mockRes as any)._responsePending).toBe(true)
    })

    it('should work correctly with await', async () => {
      const mockApp = createMockApp()
      const mockReq = createMockReq()
      const mockRes = createMockRes(mockApp)

      extendRequest(mockReq)
      extendResponse(mockRes)

      const context = {}

      const step200 = async (_ctx: any, _req: any, res: any) => {
        try {
          const error: any = new Error('Prisma error')
          error.code = 'P2002'
          throw error
        } catch (error: any) {
          if (error.code === 'P2002') {
            // ✅ With await
            return await res.status(400).render('error', { message: 'Duplicate' })
          }
        }
      }

      const step300 = async (_ctx: any, _req: any, _res: any) => {
        throw new Error('Should not execute')
      }

      const steps = [
        { number: 200, name: '200-test.js', path: '/test/200-test.js', fn: step200 },
        { number: 300, name: '300-test.js', path: '/test/300-test.js', fn: step300 },
      ]

      const executor = new AutoExecutor({ steps, context, req: mockReq, res: mockRes })
      await executor.execute()

      expect(mockRes.headersSent).toBe(true)
      expect(mockRes.statusCode).toBe(400)
    })
  })

  describe('res.sendFile() in catch block', () => {
    it('should set _responsePending flag immediately when called without await', async () => {
      const mockApp = createMockApp()
      const mockReq = createMockReq()
      const mockRes = createMockRes(mockApp)

      extendRequest(mockReq)
      extendResponse(mockRes)

      // Test that _responsePending is set synchronously
      expect((mockRes as any)._responsePending).toBe(false)

      // Call sendFile (will fail with mock, but flag should be set first)
      const promise = mockRes.sendFile(path.join(filesDir, 'test.txt'))

      // Flag should be set immediately (synchronously)
      expect((mockRes as any)._responsePending).toBe(true)

      // Wait for promise to complete (will error, but that's ok)
      await promise.catch(() => {})
    })
  })

  describe('res.download() in catch block', () => {
    it('should set _responsePending flag immediately when called without await', async () => {
      const mockApp = createMockApp()
      const mockReq = createMockReq()
      const mockRes = createMockRes(mockApp)

      extendRequest(mockReq)
      extendResponse(mockRes)

      // Test that _responsePending is set synchronously
      expect((mockRes as any)._responsePending).toBe(false)

      // Call download (will fail with mock, but flag should be set first)
      const promise = mockRes.download(path.join(filesDir, 'test.txt'), 'download.txt')

      // Flag should be set immediately (synchronously)
      expect((mockRes as any)._responsePending).toBe(true)

      // Wait for promise to complete (will error, but that's ok)
      await promise.catch(() => {})
    })
  })

  describe('res.redirect() in catch block', () => {
    it('should prevent next step when called without await', async () => {
      const mockApp = createMockApp()
      const mockReq = createMockReq()
      const mockRes = createMockRes(mockApp)

      extendRequest(mockReq)
      extendResponse(mockRes)

      const context = {
        step200Executed: false,
        step300Executed: false,
      }

      const step200 = async (ctx: any, _req: any, res: any) => {
        ctx.step200Executed = true
        try {
          const error: any = new Error('Auth error')
          error.code = 'UNAUTHORIZED'
          throw error
        } catch (error: any) {
          if (error.code === 'UNAUTHORIZED') {
            // ❌ No await (redirect is sync but we test the pattern)
            return res.status(401).redirect('/login')
          }
        }
      }

      const step300 = async (ctx: any, _req: any, res: any) => {
        ctx.step300Executed = true
        res.json({ error: 'Should not execute' })
      }

      const steps = [
        { number: 200, name: '200-test.js', path: '/test/200-test.js', fn: step200 },
        { number: 300, name: '300-test.js', path: '/test/300-test.js', fn: step300 },
      ]

      const executor = new AutoExecutor({ steps, context, req: mockReq, res: mockRes })
      await executor.execute()

      expect(context.step200Executed).toBe(true)
      expect(context.step300Executed).toBe(false) // ✅ Should NOT execute
      expect(mockRes.statusCode).toBe(302) // Default redirect status
      expect((mockRes as any)._responsePending).toBe(true)
    })
  })

  describe('res.json() in catch block', () => {
    it('should prevent next step when called without await', async () => {
      const mockApp = createMockApp()
      const mockReq = createMockReq()
      const mockRes = createMockRes(mockApp)

      extendRequest(mockReq)
      extendResponse(mockRes)

      const context = {
        step200Executed: false,
        step300Executed: false,
      }

      const step200 = async (ctx: any, _req: any, res: any) => {
        ctx.step200Executed = true
        try {
          const error: any = new Error('Validation error')
          error.code = 'VALIDATION_FAILED'
          throw error
        } catch (error: any) {
          if (error.code === 'VALIDATION_FAILED') {
            // ❌ No await (json is sync but we test the pattern)
            return res.status(400).json({ error: 'Validation failed' })
          }
        }
      }

      const step300 = async (ctx: any, _req: any, res: any) => {
        ctx.step300Executed = true
        res.json({ error: 'Should not execute' })
      }

      const steps = [
        { number: 200, name: '200-test.js', path: '/test/200-test.js', fn: step200 },
        { number: 300, name: '300-test.js', path: '/test/300-test.js', fn: step300 },
      ]

      const executor = new AutoExecutor({ steps, context, req: mockReq, res: mockRes })
      await executor.execute()

      expect(context.step200Executed).toBe(true)
      expect(context.step300Executed).toBe(false) // ✅ Should NOT execute
      expect(mockRes.statusCode).toBe(400)
      expect((mockRes as any)._responsePending).toBe(true)
    })
  })

  describe('res.send() in catch block', () => {
    it('should prevent next step when called without await', async () => {
      const mockApp = createMockApp()
      const mockReq = createMockReq()
      const mockRes = createMockRes(mockApp)

      extendRequest(mockReq)
      extendResponse(mockRes)

      const context = {
        step200Executed: false,
        step300Executed: false,
      }

      const step200 = async (ctx: any, _req: any, res: any) => {
        ctx.step200Executed = true
        try {
          const error: any = new Error('Generic error')
          error.code = 'ERROR'
          throw error
        } catch (error: any) {
          if (error.code === 'ERROR') {
            // ❌ No await (send is sync but we test the pattern)
            return res.status(500).send('Internal Server Error')
          }
        }
      }

      const step300 = async (ctx: any, _req: any, res: any) => {
        ctx.step300Executed = true
        res.json({ error: 'Should not execute' })
      }

      const steps = [
        { number: 200, name: '200-test.js', path: '/test/200-test.js', fn: step200 },
        { number: 300, name: '300-test.js', path: '/test/300-test.js', fn: step300 },
      ]

      const executor = new AutoExecutor({ steps, context, req: mockReq, res: mockRes })
      await executor.execute()

      expect(context.step200Executed).toBe(true)
      expect(context.step300Executed).toBe(false) // ✅ Should NOT execute
      expect(mockRes.statusCode).toBe(500)
      expect((mockRes as any)._responsePending).toBe(true)
    })
  })

  describe('Multiple response methods in sequence', () => {
    it('should detect when multiple response methods are called', async () => {
      const mockApp = createMockApp()
      const mockReq = createMockReq()
      const mockRes = createMockRes(mockApp)

      extendRequest(mockReq)
      extendResponse(mockRes)

      const context = {
        step200Executed: false,
      }

      const step200 = async (ctx: any, _req: any, res: any) => {
        ctx.step200Executed = true
        try {
          const error: any = new Error('Error')
          throw error
        } catch (_error: any) {
          // First response
          res.status(400).json({ error: 'First' })

          // Try second response (should be prevented)
          try {
            res.redirect('/home')
            throw new Error('Should have thrown an error!')
          } catch (err: any) {
            // Should catch the "another response in progress" error
            expect(err.message).toContain('Another response method')
          }
        }
      }

      const steps = [
        { number: 200, name: '200-test.js', path: '/test/200-test.js', fn: step200 },
      ]

      const executor = new AutoExecutor({ steps, context, req: mockReq, res: mockRes })
      await executor.execute()

      expect(context.step200Executed).toBe(true)
      expect((mockRes as any)._responsePending).toBe(true)
    })
  })
})
