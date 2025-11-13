/**
 * Auto-Execution Engine Tests

 */

import { AutoExecutor } from '../src/feature/auto-executor'
import { StepInfo, Context, FeatureError } from '../src/feature/types'
import { IncomingMessage, ServerResponse } from 'http'

// Mock req/res for testing
function createMockReqRes(options: { headersSent?: boolean } = {}): { req: IncomingMessage; res: ServerResponse } {
  const req = {} as IncomingMessage
  const res = {
    statusCode: 200,
    setHeader: jest.fn(),
    end: jest.fn(),
    json: jest.fn(),
  } as any

  // Only set if headersSent is explicitly specified
  // If not specified, remove property itself to bypass line 83-88 check
  if (options.headersSent !== undefined) {
    res.headersSent = options.headersSent
  }

  return { req, res: res as ServerResponse }
}

describe('Auto-Execution Engine', () => {
  describe('Step Sequential Execution', () => {
    it('should execute Steps in exact order', async () => {
      const executionOrder: number[] = []

      const steps: StepInfo[] = [
        {
          number: 100,
          name: '100-first.js',
          path: '/path/to/100-first.js',
          fn: async (_ctx) => {
            executionOrder.push(100)
          },
        },
        {
          number: 200,
          name: '200-second.js',
          path: '/path/to/200-second.js',
          fn: async (_ctx) => {
            executionOrder.push(200)
          },
        },
        {
          number: 300,
          name: '300-third.js',
          path: '/path/to/300-third.js',
          fn: async (_ctx) => {
            executionOrder.push(300)
          },
        },
      ]

      const context: Context = {}

      const { req, res } = createMockReqRes()
      const executor = new AutoExecutor({
        steps,
        context,
        req,
        res,
      })

      await executor.execute()

      expect(executionOrder).toEqual([100, 200, 300])
    })

    it('should not skip any Steps', async () => {
      const executed: string[] = []

      const steps: StepInfo[] = [
        {
          number: 100,
          name: '100-step1.js',
          path: '/path/to/100-step1.js',
          fn: async (_ctx) => {
            executed.push('step1')
          },
        },
        {
          number: 200,
          name: '200-step2.js',
          path: '/path/to/200-step2.js',
          fn: async (_ctx) => {
            executed.push('step2')
          },
        },
        {
          number: 300,
          name: '300-step3.js',
          path: '/path/to/300-step3.js',
          fn: async (_ctx) => {
            executed.push('step3')
          },
        },
      ]

      const context: Context = {}

      const { req, res } = createMockReqRes()
      const executor = new AutoExecutor({
        steps,
        context,
        req,
        res,
      })

      await executor.execute()

      expect(executed).toHaveLength(3)
      expect(executed).toEqual(['step1', 'step2', 'step3'])
    })

    it('should throw error when no Steps exist', async () => {
      const context: Context = {}

      const { req, res } = createMockReqRes()
      const executor = new AutoExecutor({
        steps: [],
        context,
        req,
        res,
      })

      await expect(executor.execute()).rejects.toThrow('No steps to execute')
    })

    it('should stop when any Step fails during execution', async () => {
      const executed: number[] = []

      const steps: StepInfo[] = [
        {
          number: 100,
          name: '100-step1.js',
          path: '/path/to/100-step1.js',
          fn: async (_ctx) => {
            executed.push(100)
          },
        },
        {
          number: 200,
          name: '200-step2.js',
          path: '/path/to/200-step2.js',
          fn: async (_ctx) => {
            executed.push(200)
            throw new Error('Step 2 failed')
          },
        },
        {
          number: 300,
          name: '300-step3.js',
          path: '/path/to/300-step3.js',
          fn: async (_ctx) => {
            executed.push(300)
          },
        },
      ]

      const context: Context = {}

      const { req, res } = createMockReqRes()
      const executor = new AutoExecutor({
        steps,
        context,
        req,
        res,
      })

      await expect(executor.execute()).rejects.toThrow('Step 2 failed')

      // Step 3 is not executed
      expect(executed).toEqual([100, 200])
    })

  })

  describe('Context Passing', () => {
    it('should share same Context across all Steps', async () => {
      const steps: StepInfo[] = [
        {
          number: 100,
          name: '100-step1.js',
          path: '/path/to/100-step1.js',
          fn: async (ctx) => {
            ctx.step1 = 'data from step1'
          },
        },
        {
          number: 200,
          name: '200-step2.js',
          path: '/path/to/200-step2.js',
          fn: async (ctx) => {
            // Should be able to read data from step1
            expect(ctx.step1).toBe('data from step1')
            ctx.step2 = 'data from step2'
          },
        },
        {
          number: 300,
          name: '300-step3.js',
          path: '/path/to/300-step3.js',
          fn: async (ctx) => {
            // Should be able to read all data from previous steps
            expect(ctx.step1).toBe('data from step1')
            expect(ctx.step2).toBe('data from step2')
            ctx.step3 = 'data from step3'
          },
        },
      ]

      const context: Context = {}

      const { req, res } = createMockReqRes()
      const executor = new AutoExecutor({
        steps,
        context,
        req,
        res,
      })

      const finalContext = await executor.execute()

      expect(finalContext.step1).toBe('data from step1')
      expect(finalContext.step2).toBe('data from step2')
      expect(finalContext.step3).toBe('data from step3')
    })

    it('should be able to verify accumulated data in Context', async () => {
      const steps: StepInfo[] = [
        {
          number: 100,
          name: '100-add-user.js',
          path: '/path/to/100-add-user.js',
          fn: async (ctx) => {
            ctx.userId = 12345
          },
        },
        {
          number: 200,
          name: '200-add-order.js',
          path: '/path/to/200-add-order.js',
          fn: async (ctx) => {
            ctx.orderId = 67890
          },
        },
      ]

      const context: Context = {}

      const { req, res } = createMockReqRes()
      const executor = new AutoExecutor({
        steps,
        context,
        req,
        res,
      })

      const finalContext = await executor.execute()

      expect(finalContext.userId).toBe(12345)
      expect(finalContext.orderId).toBe(67890)
    })

    it('should be able to access initial Context data in Steps', async () => {
      const steps: StepInfo[] = [
        {
          number: 100,
          name: '100-validate.js',
          path: '/path/to/100-validate.js',
          fn: async (ctx) => {
            // Read userId from initial Context
            expect(ctx.userId).toBe(999)
            expect(ctx.customData).toBe('test')
          },
        },
      ]

      const context: Context = {
        userId: 999,
        customData: 'test',
      }

      const { req, res } = createMockReqRes()
      const executor = new AutoExecutor({
        steps,
        context,
        req,
        res,
      })

      await executor.execute()
    })
  })

  describe('Async Step Support', () => {
    it('should correctly execute async/await Steps', async () => {
      const steps: StepInfo[] = [
        {
          number: 100,
          name: '100-async-step.js',
          path: '/path/to/100-async-step.js',
          fn: async (ctx) => {
            // Simulate async operation
            await new Promise<void>(resolve => setTimeout(resolve, 10))
            ctx.asyncData = 'completed'
          },
        },
      ]

      const context: Context = {}

      const { req, res } = createMockReqRes()
      const executor = new AutoExecutor({
        steps,
        context,
        req,
        res,
      })

      const finalContext = await executor.execute()

      expect(finalContext.asyncData).toBe('completed')
    })

    it('should support Steps that return Promise', async () => {
      const steps: StepInfo[] = [
        {
          number: 100,
          name: '100-promise-step.js',
          path: '/path/to/100-promise-step.js',
          fn: (ctx) => {
            return new Promise<void>((resolve) => {
              setTimeout(() => {
                ctx.promiseData = 'resolved'
                resolve()
              }, 10)
            })
          },
        },
      ]

      const context: Context = {}

      const { req, res } = createMockReqRes()
      const executor = new AutoExecutor({
        steps,
        context,
        req,
        res,
      })

      const finalContext = await executor.execute()

      expect(finalContext.promiseData).toBe('resolved')
    })

    it('should correctly handle Promise rejection', async () => {
      const steps: StepInfo[] = [
        {
          number: 100,
          name: '100-rejected-step.js',
          path: '/path/to/100-rejected-step.js',
          fn: (_ctx) => {
            return Promise.reject(new Error('Promise rejected'))
          },
        },
      ]

      const context: Context = {}

      const { req, res } = createMockReqRes()
      const executor = new AutoExecutor({
        steps,
        context,
        req,
        res,
      })

      await expect(executor.execute()).rejects.toThrow('Promise rejected')
    })

    it('should support synchronous Steps', async () => {
      const steps: StepInfo[] = [
        {
          number: 100,
          name: '100-sync-step.js',
          path: '/path/to/100-sync-step.js',
          fn: (ctx) => {
            ctx.syncData = 'immediate'
          },
        },
      ]

      const context: Context = {}

      const { req, res } = createMockReqRes()
      const executor = new AutoExecutor({
        steps,
        context,
        req,
        res,
      })

      const finalContext = await executor.execute()

      expect(finalContext.syncData).toBe('immediate')
    })

    it('should be able to mix async and sync Steps', async () => {
      const executionOrder: string[] = []

      const steps: StepInfo[] = [
        {
          number: 100,
          name: '100-sync.js',
          path: '/path/to/100-sync.js',
          fn: (_ctx) => {
            executionOrder.push('sync1')
          },
        },
        {
          number: 200,
          name: '200-async.js',
          path: '/path/to/200-async.js',
          fn: async (_ctx) => {
            await new Promise(resolve => setTimeout(resolve, 10))
            executionOrder.push('async')
          },
        },
        {
          number: 300,
          name: '300-sync.js',
          path: '/path/to/300-sync.js',
          fn: (_ctx) => {
            executionOrder.push('sync2')
          },
        },
      ]

      const context: Context = {}

      const { req, res } = createMockReqRes()
      const executor = new AutoExecutor({
        steps,
        context,
        req,
        res,
      })

      await executor.execute()

      expect(executionOrder).toEqual(['sync1', 'async', 'sync2'])
    })
  })

  describe('Error Handling', () => {
    it('should wrap errors from Steps into FeatureError with step information', async () => {
      const steps: StepInfo[] = [
        {
          number: 200,
          name: '200-failing-step.js',
          path: '/path/to/200-failing-step.js',
          fn: async (_ctx) => {
            throw new Error('Original error')
          },
        },
      ]

      const context: Context = {}

      const { req, res } = createMockReqRes()
      const executor = new AutoExecutor({
        steps,
        context,
        req,
        res,
      })

      try {
        await executor.execute()
        fail('Should have thrown an error')
      } catch (error) {
        // Regular Error is wrapped into FeatureError with step information
        expect(error).toBeInstanceOf(FeatureError)
        if (error instanceof FeatureError) {
          expect(error.message).toBe('Original error')
          expect(error.step).toBeDefined()
          expect(error.step?.number).toBe(200)
          expect(error.step?.name).toBe('200-failing-step.js')
        }
      }
    })

    it('should propagate FeatureError as is', async () => {
      const steps: StepInfo[] = [
        {
          number: 100,
          name: '100-step.js',
          path: '/path/to/100-step.js',
          fn: async (_ctx) => {
            throw new FeatureError('Custom feature error')
          },
        },
      ]

      const context: Context = {}

      const { req, res } = createMockReqRes()
      const executor = new AutoExecutor({
        steps,
        context,
        req,
        res,
      })

      try {
        await executor.execute()
        fail('Should have thrown an error')
      } catch (error) {
        expect(error).toBeInstanceOf(FeatureError)
        if (error instanceof FeatureError) {
          expect(error.message).toBe('Custom feature error')
        }
      }
    })
  })

  describe('Execution Performance', () => {
    it('should execute many Steps quickly', async () => {
      const steps: StepInfo[] = []

      // Create 100 steps
      for (let i = 1; i <= 100; i++) {
        steps.push({
          number: i * 10,
          name: `${i * 10}-step.js`,
          path: `/path/to/${i * 10}-step.js`,
          fn: async (ctx) => {
            ctx[`step${i}`] = i
          },
        })
      }

      const context: Context = {}

      const { req, res } = createMockReqRes()
      const executor = new AutoExecutor({
        steps,
        context,
        req,
        res,
      })

      const startTime = Date.now()
      await executor.execute()
      const duration = Date.now() - startTime

      // 100 steps execution within 1 second
      expect(duration).toBeLessThan(1000)

      // Extract data (excluding req, res)
      const { req: _, res: __, ...data } = context
      expect(Object.keys(data)).toHaveLength(100)
    })
  })
})
