/**
 * numflow.feature() API Tests

 */

import * as fs from 'fs'
import * as path from 'path'
import { IncomingMessage, ServerResponse } from 'http'
import { Feature, feature } from '../src/feature/index'
import { FeatureConfig } from '../src/feature/types'

describe('numflow.feature() API', () => {
  const testDir = path.join(__dirname, '__test-feature__')
  const stepsDir = path.join(testDir, 'steps')
  const asyncTasksDir = path.join(testDir, 'async-tasks')

  beforeEach(() => {
    // Clean up existing directory
    if (fs.existsSync(testDir)) {
      cleanDirectory(testDir)
    }

    // Create test directories
    fs.mkdirSync(testDir, { recursive: true })
    fs.mkdirSync(stepsDir, { recursive: true })
    fs.mkdirSync(asyncTasksDir, { recursive: true })

    // Create basic step files
    createStepFile(stepsDir, '100-validate.js', 'module.exports = async (ctx, req, res) => { ctx.step100 = true }')
    createStepFile(stepsDir, '200-process.js', 'module.exports = async (ctx, req, res) => { ctx.step200 = true }')
  })

  afterEach(() => {
    // Clean up test directories
    if (fs.existsSync(testDir)) {
      cleanDirectory(testDir)
    }
  })

  describe('Feature Definition Validation', () => {
    it('should create Feature when all required options are provided', () => {
      const config: FeatureConfig = {
        method: 'POST',
        path: '/api/orders',
        steps: stepsDir,
      }

      const featureInstance = feature(config)

      expect(featureInstance).toBeInstanceOf(Feature)
    })

    it('should set HTTP method correctly', () => {
      const config: FeatureConfig = {
        method: 'GET',
        path: '/api/users',
        steps: stepsDir,
      }

      const featureInstance = feature(config)

      expect(featureInstance.getInfo().method).toBe('GET')
    })

    it('should set path correctly', () => {
      const config: FeatureConfig = {
        method: 'POST',
        path: '/api/orders',
        steps: stepsDir,
      }

      const featureInstance = feature(config)

      expect(featureInstance.getInfo().path).toBe('/api/orders')
    })

    it('should be able to set asyncTasks option', () => {
      createAsyncTaskFile(asyncTasksDir, 'send-email.js', 'module.exports = async (ctx) => {}')

      const config: FeatureConfig = {
        method: 'POST',
        path: '/api/orders',
        steps: stepsDir,
        asyncTasks: asyncTasksDir,
      }

      feature(config)

      // asyncTasks is configured (can be confirmed after initialization)
      expect(config.asyncTasks).toBe(asyncTasksDir)
    })
  })

  describe('Feature Initialization', () => {
    it('should discover step files during initialization', async () => {
      const config: FeatureConfig = {
        method: 'POST',
        path: '/api/orders',
        steps: stepsDir,
      }

      const featureInstance = feature(config)
      await featureInstance.initialize()

      const info = featureInstance.getInfo()
      expect(info.steps).toBe(2) // 100-validate.js, 200-process.js
    })

    it('should discover async task files when asyncTasks is provided', async () => {
      createAsyncTaskFile(asyncTasksDir, 'send-email.js', 'module.exports = async (ctx) => {}')
      createAsyncTaskFile(asyncTasksDir, 'send-sms.js', 'module.exports = async (ctx) => {}')

      const config: FeatureConfig = {
        method: 'POST',
        path: '/api/orders',
        steps: stepsDir,
        asyncTasks: asyncTasksDir,
      }

      const featureInstance = feature(config)
      await featureInstance.initialize()

      const info = featureInstance.getInfo()
      expect(info.asyncTasks).toBe(2)
    })

    it('should prevent duplicate initialization', async () => {
      const config: FeatureConfig = {
        method: 'POST',
        path: '/api/orders',
        steps: stepsDir,
      }

      const featureInstance = feature(config)
      await featureInstance.initialize()
      await featureInstance.initialize() // second initialization

      // should run without errors
      const info = featureInstance.getInfo()
      expect(info.steps).toBe(2)
    })
  })

  describe('Handler Creation', () => {
    it('should return HTTP request handler from getHandler()', async () => {
      const config: FeatureConfig = {
        method: 'POST',
        path: '/api/orders',
        steps: stepsDir,
      }

      const featureInstance = feature(config)
      const handler = featureInstance.getHandler()

      expect(typeof handler).toBe('function')
    })

    it('should handle requests', async () => {
      // Add step that sends response
      createStepFile(stepsDir, '900-respond.js', `
        module.exports = async (ctx, req, res) => {
          res.statusCode = 200
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ success: true, step100: ctx.step100, step200: ctx.step200 }))
        }
      `)

      const config: FeatureConfig = {
        method: 'POST',
        path: '/api/orders',
        steps: stepsDir,
      }

      const featureInstance = feature(config)
      const handler = featureInstance.getHandler()

      const mockReq = {} as IncomingMessage
      const mockRes = {
        statusCode: 0,
        setHeader: jest.fn(),
        end: jest.fn(),
        _headersSent: false,
        get headersSent() { return this._headersSent },
      } as any as ServerResponse

      // Mock that changes headersSent to true
      ;(mockRes.end as jest.Mock).mockImplementation(function(this: any, data: string) {
        this._headersSent = true
        return data
      }.bind(mockRes))

      await handler(mockReq, mockRes)

      expect(mockRes.statusCode).toBe(200)
      expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Type', 'application/json')
      expect(mockRes.end).toHaveBeenCalled()

      const response = JSON.parse((mockRes.end as jest.Mock).mock.calls[0][0])
      expect(response.success).toBe(true)
      expect(response.step100).toBe(true)
      expect(response.step200).toBe(true)
    })
  })

  describe('contextInitializer', () => {
    it('should initialize Context when contextInitializer is provided', async () => {
      // Use separate test directory
      const customStepsDir = path.join(testDir, 'steps-ctx-init')
      fs.mkdirSync(customStepsDir, { recursive: true })

      // Create step file to validate Context
      createStepFile(customStepsDir, '100-validate.js', `
        module.exports = async (ctx, req, res) => {
          if (ctx.userId !== 12345) throw new Error('userId not set')
          if (ctx.customData !== 'test') throw new Error('customData not set')
          ctx.validated = true
        }
      `)
      createStepFile(customStepsDir, '900-respond.js', `
        module.exports = async (ctx, req, res) => {
          res.statusCode = 200
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ success: true, validated: ctx.validated }))
        }
      `)

      const config: FeatureConfig = {
        method: 'POST',
        path: '/api/orders',
        steps: customStepsDir,
        contextInitializer: (ctx, _req, _res) => {
          ctx.userId = 12345
          ctx.customData = 'test'
        },
      }

      const featureInstance = feature(config)
      const handler = featureInstance.getHandler()

      const mockReq = {} as IncomingMessage
      const mockRes = {
        statusCode: 0,
        setHeader: jest.fn(),
        end: jest.fn(),
        _headersSent: false,
        get headersSent() { return this._headersSent },
      } as any as ServerResponse

      // Mock that changes headersSent to true
      ;(mockRes.end as jest.Mock).mockImplementation(function(this: any, data: string) {
        this._headersSent = true
        return data
      }.bind(mockRes))

      await handler(mockReq, mockRes)

      expect(mockRes.statusCode).toBe(200)

      const response = JSON.parse((mockRes.end as jest.Mock).mock.calls[0][0])
      expect(response.success).toBe(true)
      expect(response.validated).toBe(true)
    })

    it('should work when contextInitializer is async function', async () => {
      // Use separate test directory
      const asyncStepsDir = path.join(testDir, 'steps-async-init')
      fs.mkdirSync(asyncStepsDir, { recursive: true })

      // Create files
      createStepFile(asyncStepsDir, '100-check-user.js', `
        module.exports = async (ctx, req, res) => {
          // userId is already set in contextInitializer
        }
      `)
      createStepFile(asyncStepsDir, '900-respond.js', `
        module.exports = async (ctx, req, res) => {
          res.statusCode = 200
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ success: true, userId: ctx.userId }))
        }
      `)

      const config: FeatureConfig = {
        method: 'POST',
        path: '/api/orders',
        steps: asyncStepsDir,
        contextInitializer: async (ctx, _req, _res) => {
          await new Promise(resolve => setTimeout(resolve, 10))
          ctx.userId = 99999
        },
      }

      const featureInstance = feature(config)
      const handler = featureInstance.getHandler()

      const mockReq = {} as IncomingMessage
      const mockRes = {
        statusCode: 0,
        setHeader: jest.fn(),
        end: jest.fn(),
        _headersSent: false,
        get headersSent() { return this._headersSent },
      } as any as ServerResponse

      // Mock that changes headersSent to true
      ;(mockRes.end as jest.Mock).mockImplementation(function(this: any, data: string) {
        this._headersSent = true
        return data
      }.bind(mockRes))

      await handler(mockReq, mockRes)

      expect(mockRes.statusCode).toBe(200)

      const response = JSON.parse((mockRes.end as jest.Mock).mock.calls[0][0])
      expect(response.userId).toBe(99999)
    })

    it('should be able to access req and res in contextInitializer', async () => {
      // Use separate test directory
      const reqResStepsDir = path.join(testDir, 'steps-req-res')
      fs.mkdirSync(reqResStepsDir, { recursive: true })

      // Create files
      createStepFile(reqResStepsDir, '100-check.js', `
        module.exports = async (ctx, req, res) => {
          // hasReq and hasRes are already set in contextInitializer
        }
      `)
      createStepFile(reqResStepsDir, '900-respond.js', `
        module.exports = async (ctx, req, res) => {
          res.statusCode = 200
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ success: true, hasReq: ctx.hasReq, hasRes: ctx.hasRes }))
        }
      `)

      const config: FeatureConfig = {
        method: 'POST',
        path: '/api/orders',
        steps: reqResStepsDir,
        contextInitializer: (ctx, req, res) => {
          // req and res are passed
          ctx.hasReq = !!req
          ctx.hasRes = !!res
        },
      }

      const featureInstance = feature(config)
      const handler = featureInstance.getHandler()

      const mockReq = {} as IncomingMessage
      const mockRes = {
        statusCode: 0,
        setHeader: jest.fn(),
        end: jest.fn(),
        _headersSent: false,
        get headersSent() { return this._headersSent },
      } as any as ServerResponse

      // Mock that changes headersSent to true
      ;(mockRes.end as jest.Mock).mockImplementation(function(this: any, data: string) {
        this._headersSent = true
        return data
      }.bind(mockRes))

      await handler(mockReq, mockRes)

      const response = JSON.parse((mockRes.end as jest.Mock).mock.calls[0][0])
      expect(response.hasReq).toBe(true)
      expect(response.hasRes).toBe(true)
    })
  })

  describe('Error Handling', () => {
    it('should throw FeatureExecutionError when Step errors', async () => {
      // Delete existing files
      fs.unlinkSync(path.join(stepsDir, '100-validate.js'))
      fs.unlinkSync(path.join(stepsDir, '200-process.js'))

      createStepFile(stepsDir, '100-failing.js', `
        module.exports = async (ctx, req, res) => {
          throw new Error('Step failed')
        }
      `)

      const config: FeatureConfig = {
        method: 'POST',
        path: '/api/orders',
        steps: stepsDir,
      }

      const featureInstance = feature(config)
      const handler = featureInstance.getHandler()

      const mockReq = {} as IncomingMessage
      const mockRes = {
        statusCode: 0,
        setHeader: jest.fn(),
        end: jest.fn(),
      } as any as ServerResponse

      // Feature throws FeatureExecutionError,
      // which is handled by Application's Global Error Handler
      await expect(handler(mockReq, mockRes)).rejects.toThrow('Step failed')
    })

    it('should be called when onError handler is provided', async () => {
      // Delete existing files
      cleanDirectory(stepsDir)
      fs.mkdirSync(stepsDir, { recursive: true })

      createStepFile(stepsDir, '110-failing.js', `
        module.exports = async (ctx, req, res) => {
          throw new Error('Custom error')
        }
      `)

      const onErrorMock = jest.fn()

      const config: FeatureConfig = {
        method: 'POST',
        path: '/api/orders',
        steps: stepsDir,
        onError: onErrorMock,
      }

      const featureInstance = feature(config)
      const handler = featureInstance.getHandler()

      const mockReq = {} as IncomingMessage
      const mockRes = {
        statusCode: 0,
        setHeader: jest.fn(),
        end: jest.fn(),
      } as any as ServerResponse

      await handler(mockReq, mockRes)

      expect(onErrorMock).toHaveBeenCalled()
      const [error, ctx, req, res] = onErrorMock.mock.calls[0]
      expect(error.message).toBe('Custom error')
      expect(ctx).toBeDefined()
      expect(req).toBe(mockReq)
      expect(res).toBe(mockRes)
    })

    it('should allow user to send response directly in onError handler', async () => {
      // Delete existing files
      cleanDirectory(stepsDir)
      fs.mkdirSync(stepsDir, { recursive: true })

      createStepFile(stepsDir, '120-failing.js', `
        module.exports = async (ctx, req, res) => {
          throw new Error('Validation failed')
        }
      `)

      const config: FeatureConfig = {
        method: 'POST',
        path: '/api/orders',
        steps: stepsDir,
        onError: async (error, _context, _req, res) => {
          res.statusCode = 400
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: error.message, customField: 'handled' }))
        },
      }

      const featureInstance = feature(config)
      const handler = featureInstance.getHandler()

      const mockReq = {} as IncomingMessage
      const mockRes = {
        statusCode: 0,
        setHeader: jest.fn(),
        end: jest.fn(),
      } as any as ServerResponse

      await handler(mockReq, mockRes)

      expect(mockRes.statusCode).toBe(400)
      expect(mockRes.end).toHaveBeenCalled()
      const response = JSON.parse((mockRes.end as jest.Mock).mock.calls[0][0])
      expect(response.error).toBe('Validation failed')
      expect(response.customField).toBe('handled')
    })
  })

  describe('Feature Information Retrieval', () => {
    it('should return Feature information from getInfo()', async () => {
      const config: FeatureConfig = {
        method: 'PUT',
        path: '/api/users/:id',
        steps: stepsDir,
        onError: async () => {},
      }

      const featureInstance = feature(config)
      await featureInstance.initialize()

      const info = featureInstance.getInfo()

      expect(info.method).toBe('PUT')
      expect(info.path).toBe('/api/users/:id')
      expect(info.steps).toBe(2)
      expect(info.asyncTasks).toBe(0)
      expect(info.hasErrorHandler).toBe(true)
    })
  })

  // Helper functions
  function createStepFile(dir: string, filename: string, content: string) {
    fs.writeFileSync(path.join(dir, filename), content)
  }

  function createAsyncTaskFile(dir: string, filename: string, content: string) {
    fs.writeFileSync(path.join(dir, filename), content)
  }

  function cleanDirectory(dir: string) {
    if (!fs.existsSync(dir)) return

    try {
      const files = fs.readdirSync(dir)
      for (const file of files) {
        const filePath = path.join(dir, file)

        try {
          const stat = fs.statSync(filePath)

          if (stat.isDirectory()) {
            cleanDirectory(filePath)
            if (fs.existsSync(filePath)) {
              fs.rmdirSync(filePath)
            }
          } else {
            fs.unlinkSync(filePath)
          }
        } catch (err) {
          // Ignore if file is already deleted or inaccessible
          console.warn(`Failed to delete ${filePath}:`, err)
        }
      }

      // Delete if directory is empty
      if (fs.existsSync(dir) && fs.readdirSync(dir).length === 0) {
        fs.rmdirSync(dir)
      }
    } catch (err) {
      console.warn(`Failed to clean directory ${dir}:`, err)
    }
  }
})
