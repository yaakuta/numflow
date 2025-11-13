/**
 * Async Task Scheduler Tests

 */

import { AsyncTaskScheduler } from '../src/feature/async-task-scheduler'
import { AsyncTaskInfo, Context } from '../src/feature/types'

describe('Async Task Scheduler', () => {
  describe('Async Task Scheduling', () => {
    it('should schedule async tasks', async () => {
      const executed: string[] = []

      const tasks: AsyncTaskInfo[] = [
        {
          name: 'send-email',
          path: '/path/to/send-email.js',
          fn: async (_ctx) => {
            executed.push('email')
          },
        },
      ]

      const ctx: Context = {}

      const scheduler = new AsyncTaskScheduler(tasks, ctx)
      scheduler.schedule()

      // Wait a bit since it runs in background
      await new Promise(resolve => setTimeout(resolve, 50))

      expect(executed).toContain('email')
    })

    it('should execute multiple async tasks sequentially', async () => {
      const executed: string[] = []

      const tasks: AsyncTaskInfo[] = [
        {
          name: 'send-email',
          path: '/path/to/send-email.js',
          fn: async (_ctx) => {
            executed.push('email')
          },
        },
        {
          name: 'send-sms',
          path: '/path/to/send-sms.js',
          fn: async (_ctx) => {
            executed.push('sms')
          },
        },
        {
          name: 'notify-slack',
          path: '/path/to/notify-slack.js',
          fn: async (_ctx) => {
            executed.push('slack')
          },
        },
      ]

      const ctx: Context = {}

      const scheduler = new AsyncTaskScheduler(tasks, ctx)
      scheduler.schedule()

      // Wait for background execution to complete
      await new Promise(resolve => setTimeout(resolve, 100))

      expect(executed).toEqual(['email', 'sms', 'slack'])
    })

    it('should not execute anything when there are no tasks', () => {
      const ctx: Context = {}

      const scheduler = new AsyncTaskScheduler([], ctx)

      // Should execute without error
      expect(() => scheduler.schedule()).not.toThrow()
    })
  })

  describe('Context Passing', () => {
    it('should pass Context to async tasks', async () => {
      const tasks: AsyncTaskInfo[] = [
        {
          name: 'send-email',
          path: '/path/to/send-email.js',
          fn: async (ctx) => {
            // Access Context
            expect(ctx.userId).toBe(123)
            expect(ctx.results.orderId).toBe(456)
          },
        },
      ]

      const ctx: Context = {
        userId: 123,
        results: {
          orderId: 456,
        },
      }

      const scheduler = new AsyncTaskScheduler(tasks, ctx)
      scheduler.schedule()

      await new Promise(resolve => setTimeout(resolve, 50))
    })

    it('should reflect Context modifications from async tasks in the original Context', async () => {
      const tasks: AsyncTaskInfo[] = [
        {
          name: 'update-ctx',
          path: '/path/to/update-ctx.js',
          fn: async (ctx) => {
            ctx.emailSent = true
          },
        },
      ]

      const ctx: Context = {}

      const scheduler = new AsyncTaskScheduler(tasks, ctx)
      scheduler.schedule()

      await new Promise(resolve => setTimeout(resolve, 50))

      // Context is modified
      expect(ctx.emailSent).toBe(true)
    })
  })

  describe('Background Execution', () => {
    it('schedule() should return immediately', () => {
      const tasks: AsyncTaskInfo[] = [
        {
          name: 'slow-task',
          path: '/path/to/slow-task.js',
          fn: async (_ctx) => {
            await new Promise(resolve => setTimeout(resolve, 100))
          },
        },
      ]

      const ctx: Context = {}

      const scheduler = new AsyncTaskScheduler(tasks, ctx)

      const startTime = Date.now()
      scheduler.schedule()
      const duration = Date.now() - startTime

      // Returns immediately (because it runs in background)
      expect(duration).toBeLessThan(50)
    })

    it('async task execution should not block main logic', async () => {
      let taskExecuted = false

      const tasks: AsyncTaskInfo[] = [
        {
          name: 'background-task',
          path: '/path/to/background-task.js',
          fn: async (_ctx) => {
            await new Promise(resolve => setTimeout(resolve, 100))
            taskExecuted = true
          },
        },
      ]

      const ctx: Context = {}

      const scheduler = new AsyncTaskScheduler(tasks, ctx)
      scheduler.schedule()

      // Not yet executed immediately after schedule()
      expect(taskExecuted).toBe(false)

      // Wait for background execution to complete
      await new Promise(resolve => setTimeout(resolve, 150))

      // Now executed
      expect(taskExecuted).toBe(true)
    })
  })

  describe('Error Isolation', () => {
    it('async task failure should not affect other tasks', async () => {
      const executed: string[] = []

      const tasks: AsyncTaskInfo[] = [
        {
          name: 'task1',
          path: '/path/to/task1.js',
          fn: async (_ctx) => {
            executed.push('task1')
          },
        },
        {
          name: 'task2-failing',
          path: '/path/to/task2-failing.js',
          fn: async (_ctx) => {
            executed.push('task2')
            throw new Error('Task 2 failed')
          },
        },
        {
          name: 'task3',
          path: '/path/to/task3.js',
          fn: async (_ctx) => {
            executed.push('task3')
          },
        },
      ]

      const ctx: Context = {}

      const scheduler = new AsyncTaskScheduler(tasks, ctx)
      scheduler.schedule()

      await new Promise(resolve => setTimeout(resolve, 100))

      // task3 is executed even though task2 failed
      expect(executed).toEqual(['task1', 'task2', 'task3'])
    })

    it('async task failure should not throw exceptions', async () => {
      const tasks: AsyncTaskInfo[] = [
        {
          name: 'failing-task',
          path: '/path/to/failing-task.js',
          fn: async (_ctx) => {
            throw new Error('Task failed')
          },
        },
      ]

      const ctx: Context = {}

      const scheduler = new AsyncTaskScheduler(tasks, ctx)

      // Should execute without error
      expect(() => scheduler.schedule()).not.toThrow()

      await new Promise(resolve => setTimeout(resolve, 50))
    })

    it('should handle synchronous errors correctly', async () => {
      const executed: string[] = []

      const tasks: AsyncTaskInfo[] = [
        {
          name: 'sync-error',
          path: '/path/to/sync-error.js',
          fn: (_ctx) => {
            executed.push('task1')
            throw new Error('Synchronous error')
          },
        },
        {
          name: 'task2',
          path: '/path/to/task2.js',
          fn: async (_ctx) => {
            executed.push('task2')
          },
        },
      ]

      const ctx: Context = {}

      const scheduler = new AsyncTaskScheduler(tasks, ctx)
      scheduler.schedule()

      await new Promise(resolve => setTimeout(resolve, 100))

      // task2 is executed even though synchronous error occurred
      expect(executed).toEqual(['task1', 'task2'])
    })
  })

  describe('Async Task Execution Order', () => {
    it('should execute async tasks in the defined order', async () => {
      const executionOrder: number[] = []

      const tasks: AsyncTaskInfo[] = [
        {
          name: 'task1',
          path: '/path/to/task1.js',
          fn: async (_ctx) => {
            executionOrder.push(1)
          },
        },
        {
          name: 'task2',
          path: '/path/to/task2.js',
          fn: async (_ctx) => {
            executionOrder.push(2)
          },
        },
        {
          name: 'task3',
          path: '/path/to/task3.js',
          fn: async (_ctx) => {
            executionOrder.push(3)
          },
        },
      ]

      const ctx: Context = {}

      const scheduler = new AsyncTaskScheduler(tasks, ctx)
      scheduler.schedule()

      await new Promise(resolve => setTimeout(resolve, 100))

      expect(executionOrder).toEqual([1, 2, 3])
    })

    it('should maintain order even with slow tasks', async () => {
      const executionOrder: string[] = []

      const tasks: AsyncTaskInfo[] = [
        {
          name: 'fast',
          path: '/path/to/fast.js',
          fn: async (_ctx) => {
            executionOrder.push('fast')
          },
        },
        {
          name: 'slow',
          path: '/path/to/slow.js',
          fn: async (_ctx) => {
            await new Promise(resolve => setTimeout(resolve, 50))
            executionOrder.push('slow')
          },
        },
        {
          name: 'medium',
          path: '/path/to/medium.js',
          fn: async (_ctx) => {
            executionOrder.push('medium')
          },
        },
      ]

      const ctx: Context = {}

      const scheduler = new AsyncTaskScheduler(tasks, ctx)
      scheduler.schedule()

      await new Promise(resolve => setTimeout(resolve, 150))

      // Sequential execution so medium runs after slow completes
      expect(executionOrder).toEqual(['fast', 'slow', 'medium'])
    })
  })

  describe('Bulk Async Task Processing', () => {
    it('should handle many async tasks', async () => {
      const executed: number[] = []

      const tasks: AsyncTaskInfo[] = []
      for (let i = 1; i <= 50; i++) {
        tasks.push({
          name: `task${i}`,
          path: `/path/to/task${i}.js`,
          fn: async (_ctx) => {
            executed.push(i)
          },
        })
      }

      const ctx: Context = {}

      const scheduler = new AsyncTaskScheduler(tasks, ctx)
      scheduler.schedule()

      await new Promise(resolve => setTimeout(resolve, 200))

      expect(executed).toHaveLength(50)
      expect(executed[0]).toBe(1)
      expect(executed[49]).toBe(50)
    })
  })

  describe('Context Data Utilization', () => {
    it('should be able to use step results in async tasks', async () => {
      let emailRecipient: string | undefined

      const tasks: AsyncTaskInfo[] = [
        {
          name: 'send-order-confirmation',
          path: '/path/to/send-order-confirmation.js',
          fn: async (ctx) => {
            // Use order data created in Step
            emailRecipient = ctx.results.customerEmail
          },
        },
      ]

      const ctx: Context = {
        results: {
          orderId: 12345,
          customerEmail: 'test@example.com',
          totalAmount: 99.99,
        },
      }

      const scheduler = new AsyncTaskScheduler(tasks, ctx)
      scheduler.schedule()

      await new Promise(resolve => setTimeout(resolve, 50))

      expect(emailRecipient).toBe('test@example.com')
    })

    it('should be able to reference transaction ID in async tasks', async () => {
      let capturedTxId: string | null | undefined

      const tasks: AsyncTaskInfo[] = [
        {
          name: 'log-transaction',
          path: '/path/to/log-transaction.js',
          fn: async (ctx) => {
            capturedTxId = ctx.txId
          },
        },
      ]

      const ctx: Context = {
        txId: 'tx_67890',
        results: {},
      }

      const scheduler = new AsyncTaskScheduler(tasks, ctx)
      scheduler.schedule()

      await new Promise(resolve => setTimeout(resolve, 50))

      expect(capturedTxId).toBe('tx_67890')
    })
  })

  describe('Mixed Sync/Async Tasks', () => {
    it('should support both synchronous and asynchronous tasks', async () => {
      const executed: string[] = []

      const tasks: AsyncTaskInfo[] = [
        {
          name: 'sync-task',
          path: '/path/to/sync-task.js',
          fn: (_ctx) => {
            executed.push('sync')
          },
        },
        {
          name: 'async-task',
          path: '/path/to/async-task.js',
          fn: async (_ctx) => {
            await new Promise(resolve => setTimeout(resolve, 10))
            executed.push('async')
          },
        },
        {
          name: 'sync-task2',
          path: '/path/to/sync-task2.js',
          fn: (_ctx) => {
            executed.push('sync2')
          },
        },
      ]

      const ctx: Context = {}

      const scheduler = new AsyncTaskScheduler(tasks, ctx)
      scheduler.schedule()

      await new Promise(resolve => setTimeout(resolve, 100))

      expect(executed).toEqual(['sync', 'async', 'sync2'])
    })
  })
})
