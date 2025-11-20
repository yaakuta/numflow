/**
 * Feature catch block race condition tests
 *
 * Tests for race conditions when using res.render() in catch blocks without await.
 * This is a critical bug report: catch 블록 안에서 return res.render() 사용 시 다음 step 실행됨
 */

import { AutoExecutor } from '../src/feature/auto-executor.js'
import { extendResponse } from '../src/response-extensions.js'
import { extendRequest } from '../src/request-extensions.js'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'

describe('Feature - catch block race condition', () => {
  let tempDir: string
  let viewsDir: string

  beforeEach(() => {
    // Create temp directory for views
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'numflow-test-'))
    viewsDir = path.join(tempDir, 'views')
    fs.mkdirSync(viewsDir, { recursive: true })

    // Create a simple EJS template
    fs.writeFileSync(
      path.join(viewsDir, 'error.ejs'),
      '<html><body><h1>Error: <%= message %></h1></body></html>'
    )
  })

  afterEach(() => {
    // Clean up temp directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true })
    }
  })

  it('should prevent next step execution when res.render() is called in catch block without await', async () => {
    // Create mock app with view engine
    const mockApp = {
      get: (key: string) => {
        if (key === 'view engine') return 'ejs'
        if (key === 'views') return viewsDir
        return undefined
      },
      locals: {},
    }

    // Create mock req
    const mockReq = {
      method: 'POST',
      url: '/test',
    } as any

    // Create mock res
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

    // Extend request and response
    extendRequest(mockReq)
    extendResponse(mockRes)

    // Create context
    const context = {
      step200Executed: false,
      step200CatchEntered: false,
      step300Executed: false,
    }

    // Step 200: Simulate Prisma error in try-catch, call res.render() in catch WITHOUT await
    const step200 = async (ctx: any, _req: any, res: any) => {
      ctx.step200Executed = true

      try {
        // Simulate Prisma unique constraint error
        const error: any = new Error('Unique constraint failed')
        error.code = 'P2002'
        throw error
      } catch (error: any) {
        ctx.step200CatchEntered = true

        if (error.code === 'P2002') {
          // ❌ BAD: Not awaiting res.render() in catch block!
          // This is the critical bug: catch 블록 안에서 return res.render() 사용 시
          return res.status(400).render('error', { message: 'Duplicate entry' })
        }
      }
    }

    // Step 300: This should NOT execute!
    const step300 = async (ctx: any, _req: any, res: any) => {
      ctx.step300Executed = true
      res.json({ error: 'Step 300 should not have executed!' })
    }

    const steps = [
      { number: 200, name: '200-create.js', path: '/test/200-create.js', fn: step200 },
      { number: 300, name: '300-should-not-run.js', path: '/test/300-should-not-run.js', fn: step300 },
    ]

    // Execute steps with AutoExecutor
    const executor = new AutoExecutor({
      steps,
      context,
      req: mockReq,
      res: mockRes,
    })

    await executor.execute()

    // Verify that step 200 executed
    expect(context.step200Executed).toBe(true)
    expect(context.step200CatchEntered).toBe(true)

    // CRITICAL: Step 300 should NOT have executed!
    // This is the fix working correctly!
    expect(context.step300Executed).toBe(false)

    // Response should be 400 with error template, NOT JSON from step 300
    // Use mockRes.statusCode instead of statusCodeValue (which is overridden by extendResponse)
    expect(mockRes.statusCode).toBe(400)

    // _responsePending should be true to prevent next step execution
    expect((mockRes as any)._responsePending).toBe(true)
  })

  it('should work correctly when res.render() in catch block is awaited', async () => {
    // Create mock app with view engine
    const mockApp = {
      get: (key: string) => {
        if (key === 'view engine') return 'ejs'
        if (key === 'views') return viewsDir
        return undefined
      },
      locals: {},
    }

    const mockReq = {
      method: 'POST',
      url: '/test',
    } as any

    let headersSentValue = false
    let responseBody = ''

    const mockRes = {
      app: mockApp,
      statusCode: 200,
      locals: {},

      setHeader: function() { return this },
      getHeader: () => undefined,

      end: function(data?: any) {
        headersSentValue = true
        responseBody = data || ''
        Object.defineProperty(this, 'headersSent', {
          get: () => headersSentValue,
          configurable: true,
        })
      },

      send: function(body: any) {
        this.end(body)
        return this
      },

      status: function(code: number) {
        this.statusCode = code
        return this
      },
    } as any

    Object.defineProperty(mockRes, 'headersSent', {
      get: () => headersSentValue,
      configurable: true,
    })

    extendRequest(mockReq)
    extendResponse(mockRes)

    const context = {}

    // Step 200: Properly await res.render() in catch block
    const step200 = async (_ctx: any, _req: any, res: any) => {
      try {
        const error: any = new Error('Unique constraint failed')
        error.code = 'P2002'
        throw error
      } catch (error: any) {
        if (error.code === 'P2002') {
          // ✅ GOOD: Awaiting res.render() in catch block
          return await res.status(400).render('error', { message: 'Duplicate entry' })
        }
      }
    }

    // Step 300: This should NOT execute (headersSent will be true)
    const step300 = async (_ctx: any, _req: any, _res: any) => {
      throw new Error('Step 300 should not execute!')
    }

    const steps = [
      { number: 200, name: '200-create.js', path: '/test/200-create.js', fn: step200 },
      { number: 300, name: '300-should-not-run.js', path: '/test/300-should-not-run.js', fn: step300 },
    ]

    const executor = new AutoExecutor({
      steps,
      context,
      req: mockReq,
      res: mockRes,
    })

    await executor.execute()

    // Response should be sent with error template
    expect(headersSentValue).toBe(true)
    expect(responseBody).toContain('Duplicate entry')
  })
})
