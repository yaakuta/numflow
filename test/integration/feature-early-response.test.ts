/**
 * Feature Early Response Tests
 * Tests for early response handling in Feature steps
 */

import numflow from '../../src/index'

describe('Feature Early Response', () => {
  beforeEach(() => {
    // Reset execution log before each test
    ;(global as any).executionLog = []
  })

  describe('Normal Flow (response in step 300)', () => {
    it('should execute all steps and async-tasks', async () => {
      const app = numflow()

      app.use(
        numflow.feature({
          method: 'GET',
          path: '/api/normal',
          steps: './test/__fixtures__/feature-early-response/normal-steps',
          asyncTasks: './test/__fixtures__/feature-early-response/normal-async-tasks',
        })
      )

      const response = await app.inject({
        method: 'GET',
        url: '/api/normal',
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.payload)
      expect(body.result).toBe('normal')
      expect(body.data).toEqual({
        step100: 'executed',
        step200: 'executed',
        step300: 'executed',
      })

      // Wait for async tasks
      await new Promise((resolve) => setTimeout(resolve, 100))

      const log = (global as any).executionLog
      expect(log).toContain('normal-100-first')
      expect(log).toContain('normal-200-second')
      expect(log).toContain('normal-300-response')
      expect(log).toContain('normal-async-task')
    })
  })

  describe('Early Response in Step 100', () => {
    it('should stop execution after step 100 but still run async-tasks', async () => {
      const app = numflow()

      app.use(
        numflow.feature({
          method: 'GET',
          path: '/api/early',
          steps: './test/__fixtures__/feature-early-response/early-steps',
          asyncTasks: './test/__fixtures__/feature-early-response/early-async-tasks',
        })
      )

      const response = await app.inject({
        method: 'GET',
        url: '/api/early',
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.payload)
      expect(body.result).toBe('early')
      expect(body.step).toBe(100)

      // Wait for async tasks
      await new Promise((resolve) => setTimeout(resolve, 100))

      const log = (global as any).executionLog

      // Step 100 should execute
      expect(log).toContain('early-100-response')

      // Steps 200 and 300 should NOT execute
      expect(log).not.toContain('early-200-SHOULD-NOT-EXECUTE')
      expect(log).not.toContain('early-300-SHOULD-NOT-EXECUTE')

      // Async task SHOULD execute (정상 종료로 인지)
      expect(log).toContain('early-async-task')
    })
  })

  describe('Early Response in Step 200 (Middle)', () => {
    it('should execute step 100, stop at step 200, skip step 300, but run async-tasks', async () => {
      const app = numflow()

      app.use(
        numflow.feature({
          method: 'GET',
          path: '/api/middle',
          steps: './test/__fixtures__/feature-early-response/middle-steps',
          asyncTasks: './test/__fixtures__/feature-early-response/middle-async-tasks',
        })
      )

      const response = await app.inject({
        method: 'GET',
        url: '/api/middle',
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.payload)
      expect(body.result).toBe('middle')
      expect(body.step).toBe(200)
      expect(body.data).toEqual({
        step100: 'executed',
        step200: 'executed',
      })

      // Wait for async tasks
      await new Promise((resolve) => setTimeout(resolve, 100))

      const log = (global as any).executionLog

      // Steps 100 and 200 should execute
      expect(log).toContain('middle-100-first')
      expect(log).toContain('middle-200-response')

      // Step 300 should NOT execute
      expect(log).not.toContain('middle-300-SHOULD-NOT-EXECUTE')

      // Async task SHOULD execute (정상 종료로 인지)
      expect(log).toContain('middle-async-task')
    })
  })

  describe('Execution Order Verification', () => {
    it('should maintain correct execution order', async () => {
      const app1 = numflow()

      app1.use(
        numflow.feature({
          method: 'GET',
          path: '/api/normal',
          steps: './test/__fixtures__/feature-early-response/normal-steps',
          asyncTasks: './test/__fixtures__/feature-early-response/normal-async-tasks',
        })
      )

      // Test normal flow
      await app1.inject({ method: 'GET', url: '/api/normal' })
      await new Promise((resolve) => setTimeout(resolve, 100))

      const normalLog = (global as any).executionLog
      const normalStepIndex = normalLog.indexOf('normal-100-first')
      const normalResponseIndex = normalLog.indexOf('normal-300-response')
      const normalAsyncIndex = normalLog.indexOf('normal-async-task')

      expect(normalStepIndex).toBeLessThan(normalResponseIndex)
      expect(normalResponseIndex).toBeLessThan(normalAsyncIndex)

      // Reset and test early flow
      ;(global as any).executionLog = []

      const app2 = numflow()

      app2.use(
        numflow.feature({
          method: 'GET',
          path: '/api/early',
          steps: './test/__fixtures__/feature-early-response/early-steps',
          asyncTasks: './test/__fixtures__/feature-early-response/early-async-tasks',
        })
      )

      await app2.inject({ method: 'GET', url: '/api/early' })
      await new Promise((resolve) => setTimeout(resolve, 100))

      const earlyLog = (global as any).executionLog
      const earlyStepIndex = earlyLog.indexOf('early-100-response')
      const earlyAsyncIndex = earlyLog.indexOf('early-async-task')

      expect(earlyStepIndex).toBeLessThan(earlyAsyncIndex)
    })
  })
})
