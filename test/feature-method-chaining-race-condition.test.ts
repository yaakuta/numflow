/**
 * Method chaining race condition tests
 *
 * Tests specifically for chained response methods like:
 * - res.status(400).render()
 * - res.status(400).json()
 * - res.status(400).send()
 * - res.status(302).redirect()
 *
 * These patterns are commonly used and must be safe!
 */

import { AutoExecutor } from '../src/feature/auto-executor.js'
import { extendResponse } from '../src/response-extensions.js'
import { extendRequest } from '../src/request-extensions.js'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'

describe('Feature - Method Chaining Race Condition', () => {
  let tempDir: string
  let viewsDir: string

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'numflow-test-'))
    viewsDir = path.join(tempDir, 'views')
    fs.mkdirSync(viewsDir, { recursive: true })

    fs.writeFileSync(
      path.join(viewsDir, 'error.ejs'),
      '<html><body><h1>Error: <%= message %></h1></body></html>'
    )
  })

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true })
    }
  })

  const createMockApp = () => ({
    get: (key: string) => {
      if (key === 'view engine') return 'ejs'
      if (key === 'views') return viewsDir
      return undefined
    },
    locals: {},
  })

  const createMockReq = () => ({
    method: 'POST',
    url: '/test',
  } as any)

  const createMockRes = (mockApp: any) => {
    let headersSentValue = false

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
    } as any

    Object.defineProperty(mockRes, 'headersSent', {
      get: () => headersSentValue,
      configurable: true,
    })

    return mockRes
  }

  describe('res.status().render() chaining', () => {
    it('should prevent next step when chained without await in catch block', async () => {
      const mockApp = createMockApp()
      const mockReq = createMockReq()
      const mockRes = createMockRes(mockApp)

      extendRequest(mockReq)
      extendResponse(mockRes)

      const context = {
        step200Executed: false,
        step200CatchEntered: false,
        step300Executed: false,
      }

      const step200 = async (ctx: any, _req: any, res: any) => {
        ctx.step200Executed = true
        try {
          const error: any = new Error('Prisma error')
          error.code = 'P2002'
          throw error
        } catch (error: any) {
          ctx.step200CatchEntered = true
          if (error.code === 'P2002') {
            // ✅ CRITICAL TEST: res.status().render() chaining without await
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

      // Verify execution
      expect(context.step200Executed).toBe(true)
      expect(context.step200CatchEntered).toBe(true)
      expect(context.step300Executed).toBe(false) // ✅ Must NOT execute!

      // Verify response state
      expect(mockRes.statusCode).toBe(400) // ✅ Status code from chaining
      expect((mockRes as any)._responsePending).toBe(true) // ✅ Flag set
    })

    it('should work correctly when chained with await', async () => {
      const mockApp = createMockApp()
      const mockReq = createMockReq()
      const mockRes = createMockRes(mockApp)

      extendRequest(mockReq)
      extendResponse(mockRes)

      const context = {}

      const step200 = async (_ctx: any, _req: any, res: any) => {
        try {
          const error: any = new Error('Error')
          throw error
        } catch (_error: any) {
          // ✅ With await
          return await res.status(400).render('error', { message: 'Error' })
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

  describe('res.status().json() chaining', () => {
    it('should prevent next step when chained without await in catch block', async () => {
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
          throw new Error('Validation error')
        } catch (_error: any) {
          // ✅ CRITICAL TEST: res.status().json() chaining
          return res.status(400).json({ error: 'Validation failed' })
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
      expect(context.step300Executed).toBe(false) // ✅ Must NOT execute!
      expect(mockRes.statusCode).toBe(400)
      expect((mockRes as any)._responsePending).toBe(true)
    })
  })

  describe('res.status().send() chaining', () => {
    it('should prevent next step when chained without await in catch block', async () => {
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
          throw new Error('Server error')
        } catch (_error: any) {
          // ✅ CRITICAL TEST: res.status().send() chaining
          return res.status(500).send('Internal Server Error')
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
      expect(context.step300Executed).toBe(false) // ✅ Must NOT execute!
      expect(mockRes.statusCode).toBe(500)
      expect((mockRes as any)._responsePending).toBe(true)
    })
  })

  describe('res.status().redirect() chaining', () => {
    it('should prevent next step when chained without await in catch block', async () => {
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
          throw new Error('Auth error')
        } catch (_error: any) {
          // ✅ CRITICAL TEST: res.status().redirect() chaining
          // Note: redirect() doesn't use custom status, but test the pattern
          return res.status(401).redirect('/login')
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
      expect(context.step300Executed).toBe(false) // ✅ Must NOT execute!
      expect((mockRes as any)._responsePending).toBe(true)
    })
  })

  describe('Multiple chained calls in try-catch', () => {
    it('should handle try block with chaining', async () => {
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
          // ✅ Success case with chaining
          return res.status(200).json({ success: true })
        } catch (_error: any) {
          return res.status(500).json({ error: 'Failed' })
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
      expect(context.step300Executed).toBe(false) // ✅ Must NOT execute!
      expect(mockRes.statusCode).toBe(200)
      expect((mockRes as any)._responsePending).toBe(true)
    })
  })

  describe('Real-world Prisma error pattern', () => {
    it('should handle typical Prisma unique constraint error with chaining', async () => {
      const mockApp = createMockApp()
      const mockReq = createMockReq()
      const mockRes = createMockRes(mockApp)

      extendRequest(mockReq)
      extendResponse(mockRes)

      const context = {
        tryBlockEntered: false,
        catchBlockEntered: false,
        step300Executed: false,
      }

      const step200 = async (ctx: any, _req: any, res: any) => {
        try {
          ctx.tryBlockEntered = true

          // Simulate Prisma unique constraint error
          const error: any = new Error('Unique constraint failed on the fields: (`email`)')
          error.code = 'P2002'
          error.meta = { target: ['email'] }
          throw error

        } catch (error: any) {
          ctx.catchBlockEntered = true

          // ✅ REAL-WORLD PATTERN: Handle Prisma errors with chaining
          if (error.code === 'P2002') {
            return res.status(400).render('error', {
              message: 'Email already exists'
            })
          }

          // Other errors
          return res.status(500).json({ error: 'Internal server error' })
        }
      }

      const step300 = async (ctx: any, _req: any, res: any) => {
        ctx.step300Executed = true
        res.redirect('/success')
      }

      const steps = [
        { number: 200, name: '200-create-user.js', path: '/test/200-create-user.js', fn: step200 },
        { number: 300, name: '300-redirect.js', path: '/test/300-redirect.js', fn: step300 },
      ]

      const executor = new AutoExecutor({ steps, context, req: mockReq, res: mockRes })
      await executor.execute()

      // Verify execution flow
      expect(context.tryBlockEntered).toBe(true)
      expect(context.catchBlockEntered).toBe(true)
      expect(context.step300Executed).toBe(false) // ✅ CRITICAL: Must NOT execute!

      // Verify response
      expect(mockRes.statusCode).toBe(400)
      expect((mockRes as any)._responsePending).toBe(true)
    })
  })
})
