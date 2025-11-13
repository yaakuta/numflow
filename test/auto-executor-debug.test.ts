/**
 * Auto-Executor Debug Mode Tests
 *
 * NOTE: This test verifies logging functionality that only runs in Debug mode.
 * To satisfy FEATURE_DEBUG='true' and NODE_ENV!='test' conditions,
 * we manipulate environment variables and reload modules.
 */

import * as path from 'path'
import * as fs from 'fs'

// Set environment variables (before module loading)
const originalEnv = process.env.NODE_ENV
process.env.FEATURE_DEBUG = 'true'
process.env.NODE_ENV = 'development'

// Clear module cache and reload
const autoExecutorPath = require.resolve('../src/feature/auto-executor')
delete require.cache[autoExecutorPath]
const { AutoExecutor } = require('../src/feature/auto-executor')

describe('Auto-Executor Debug Mode', () => {
  const fixturesDir = path.join(__dirname, 'fixtures', 'debug-test')
  let consoleLogSpy: jest.SpyInstance
  let consoleErrorSpy: jest.SpyInstance

  beforeAll(() => {
    // Create debug fixtures directory
    if (!fs.existsSync(fixturesDir)) {
      fs.mkdirSync(fixturesDir, { recursive: true })
    }

    // Create step files
    const step100Path = path.join(fixturesDir, '100-validate.js')
    const step200Path = path.join(fixturesDir, '200-process.js')
    const step300Path = path.join(fixturesDir, '300-complete.js')
    const step400ErrorPath = path.join(fixturesDir, '400-error.js')

    fs.writeFileSync(step100Path, `
module.exports = async (context, req, res) => {
  context.validated = true
  context.results = context.results || {}
  context.results.step100 = 'validated'
}
`)

    fs.writeFileSync(step200Path, `
module.exports = async (context, req, res) => {
  context.processed = true
  context.results = context.results || {}
  context.results.step200 = 'processed'
}
`)

    fs.writeFileSync(step300Path, `
module.exports = async (context, req, res) => {
  context.completed = true
  context.results = context.results || {}
  context.results.step300 = 'completed'
  // Send response only in last step (Feature completion condition)
  if (res && res.end) {
    res.end()
  }
}
`)

    fs.writeFileSync(step400ErrorPath, `
module.exports = async (context) => {
  throw new Error('Step error for testing')
}
`)
  })

  beforeEach(() => {
    // Set up console.log and console.error spies
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation()
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
  })

  afterEach(() => {
    // Restore spies
    consoleLogSpy.mockRestore()
    consoleErrorSpy.mockRestore()
  })

  afterAll(() => {
    // Restore environment variables
    process.env.NODE_ENV = originalEnv
    delete process.env.FEATURE_DEBUG

    // Clean up fixtures
    if (fs.existsSync(fixturesDir)) {
      fs.rmSync(fixturesDir, { recursive: true, force: true })
    }

    // Reinitialize module cache (to not affect other tests)
    delete require.cache[autoExecutorPath]
  })

  describe('Debug Logging Features', () => {
    it('should output Feature start header', async () => {
      const steps = [
        {
          number: 300,
          name: '300-complete.js',
          path: path.join(fixturesDir, '300-complete.js'),
          fn: require(path.join(fixturesDir, '300-complete.js'))
        }
      ]

      const mockReq = { method: 'POST', url: '/api/users' }
      const mockRes = {
        headersSent: false,
        end: function() {
          this.headersSent = true
        }
      }
      const context = {}

      const executor = new AutoExecutor({
        steps,
        context,
        req: mockReq,
        res: mockRes
      })

      await executor.execute()

      // Check Feature header log
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Feature] POST /api/users')
      )
    })

    it('should output execution log for each Step', async () => {
      const steps = [
        {
          number: 100,
          name: '100-validate.js',
          path: path.join(fixturesDir, '100-validate.js'),
          fn: require(path.join(fixturesDir, '100-validate.js'))
        },
        {
          number: 300,
          name: '300-complete.js',
          path: path.join(fixturesDir, '300-complete.js'),
          fn: require(path.join(fixturesDir, '300-complete.js'))
        }
      ]

      const mockReq = { method: 'POST', url: '/api/test' }
      const mockRes = {
        headersSent: false,
        end: function() {
          this.headersSent = true
        }
      }
      const context = {}

      const executor = new AutoExecutor({
        steps,
        context,
        req: mockReq,
        res: mockRes
      })

      await executor.execute()

      // Check Step logs
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringMatching(/\[Step 100\] validate.*✓/)
      )
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringMatching(/\[Step 300\] complete.*✓/)
      )
    })

    it('should include Context changes in logs', async () => {
      const steps = [
        {
          number: 300,
          name: '300-complete.js',
          path: path.join(fixturesDir, '300-complete.js'),
          fn: require(path.join(fixturesDir, '300-complete.js'))
        }
      ]

      const mockReq = { method: 'POST', url: '/api/test' }
      const mockRes = {
        headersSent: false,
        end: function() {
          this.headersSent = true
        }
      }
      const context = {}

      const executor = new AutoExecutor({
        steps,
        context,
        req: mockReq,
        res: mockRes
      })

      await executor.execute()

      // Check Context changes log
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Context:')
      )
    })

    it('should output Summary (success case)', async () => {
      const steps = [
        {
          number: 100,
          name: '100-validate.js',
          path: path.join(fixturesDir, '100-validate.js'),
          fn: require(path.join(fixturesDir, '100-validate.js'))
        },
        {
          number: 300,
          name: '300-complete.js',
          path: path.join(fixturesDir, '300-complete.js'),
          fn: require(path.join(fixturesDir, '300-complete.js'))
        }
      ]

      const mockReq = { method: 'POST', url: '/api/test' }
      const mockRes = {
        headersSent: false,
        end: function() {
          this.headersSent = true
        }
      }
      const context = {}

      const executor = new AutoExecutor({
        steps,
        context,
        req: mockReq,
        res: mockRes
      })

      await executor.execute()

      // Check Summary log
      expect(consoleLogSpy).toHaveBeenCalledWith('  [Summary]')
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringMatching(/Total: \d+ms/)
      )
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Steps: 2/2 passed')
      )
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Status: ✓ Success')
      )
    })

    it('should output Summary (error case)', async () => {
      const steps = [
        {
          number: 100,
          name: '100-validate.js',
          path: path.join(fixturesDir, '100-validate.js'),
          fn: require(path.join(fixturesDir, '100-validate.js'))
        },
        {
          number: 400,
          name: '400-error.js',
          path: path.join(fixturesDir, '400-error.js'),
          fn: require(path.join(fixturesDir, '400-error.js'))
        }
      ]

      const mockReq = { method: 'POST', url: '/api/test' }
      const mockRes = {
        headersSent: false,
        end: function() {
          this.headersSent = true
        }
      }
      const context = {}

      const executor = new AutoExecutor({
        steps,
        context,
        req: mockReq,
        res: mockRes
      })

      try {
        await executor.execute()
      } catch (error) {
        // Error expected
      }

      // Check error Summary
      expect(consoleLogSpy).toHaveBeenCalledWith('  [Summary]')
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Status: ✗ Failed')
      )
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error: Step error for testing')
      )
    })

    it('should include Step execution errors in logs', async () => {
      const steps = [
        {
          number: 400,
          name: '400-error.js',
          path: path.join(fixturesDir, '400-error.js'),
          fn: require(path.join(fixturesDir, '400-error.js'))
        }
      ]

      const mockReq = { method: 'POST', url: '/api/test' }
      const mockRes = {
        headersSent: false,
        end: function() {
          this.headersSent = true
        }
      }
      const context = {}

      const executor = new AutoExecutor({
        steps,
        context,
        req: mockReq,
        res: mockRes
      })

      try {
        await executor.execute()
      } catch (error) {
        // Error expected
      }

      // Check Step error log
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringMatching(/\[Step 400\] error.*✗/)
      )
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error: Step error for testing')
      )
    })

    it('should measure execution time and include in logs', async () => {
      const steps = [
        {
          number: 300,
          name: '300-complete.js',
          path: path.join(fixturesDir, '300-complete.js'),
          fn: require(path.join(fixturesDir, '300-complete.js'))
        }
      ]

      const mockReq = { method: 'POST', url: '/api/test' }
      const mockRes = {
        headersSent: false,
        end: function() {
          this.headersSent = true
        }
      }
      const context = {}

      const executor = new AutoExecutor({
        steps,
        context,
        req: mockReq,
        res: mockRes
      })

      await executor.execute()

      // Check execution time log (format: numbersms)
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringMatching(/\d+ms/)
      )
    })
  })

  describe('Context Management', () => {
    it('should track Context changes before and after', async () => {
      const steps = [
        {
          number: 100,
          name: '100-validate.js',
          path: path.join(fixturesDir, '100-validate.js'),
          fn: require(path.join(fixturesDir, '100-validate.js'))
        },
        {
          number: 200,
          name: '200-process.js',
          path: path.join(fixturesDir, '200-process.js'),
          fn: require(path.join(fixturesDir, '200-process.js'))
        },
        {
          number: 300,
          name: '300-complete.js',
          path: path.join(fixturesDir, '300-complete.js'),
          fn: require(path.join(fixturesDir, '300-complete.js'))
        }
      ]

      const mockReq = { method: 'POST', url: '/api/test' }
      const mockRes = {
        headersSent: false,
        end: function() {
          this.headersSent = true
        }
      }
      const context = {}

      const executor = new AutoExecutor({
        steps,
        context,
        req: mockReq,
        res: mockRes
      })

      const result = await executor.execute()

      // Check if each step modified context
      expect(result.validated).toBe(true)
      expect(result.processed).toBe(true)
      expect(result.completed).toBe(true)
      expect(result.results).toEqual({
        step100: 'validated',
        step200: 'processed',
        step300: 'completed'
      })

      // Check if Context changes are included in logs
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringMatching(/Context:.*step100/)
      )
    })
  })
})
