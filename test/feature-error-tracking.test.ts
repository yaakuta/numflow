/**
 * Feature Error Tracking Tests
 *
 * 철저한 런타임 에러 추적 테스트
 *
 * 테스트 범위:
 * 1. Step Functions 에러 추적 - FeatureError 래핑 및 정보 포함 여부
 * 2. Async Tasks 에러 추적 - 에러 로그에 파일 경로 포함 여부
 * 3. 통합 테스트 - 실제 Feature 실행 중 에러 추적
 * 4. 에러 메시지 명확성 - 디버깅에 필요한 정보 충분성
 */

import { AutoExecutor } from '../src/feature/auto-executor.js'
import { AsyncTaskScheduler } from '../src/feature/async-task-scheduler.js'
import { StepInfo, AsyncTaskInfo, Context, FeatureError } from '../src/feature/types.js'
import { IncomingMessage, ServerResponse } from 'http'
import { ValidationError, NotFoundError } from '../src/errors/index.js'

// Mock req/res for testing
function createMockReqRes(): { req: IncomingMessage; res: ServerResponse } {
  const req = {} as IncomingMessage
  const res = {
    statusCode: 200,
    setHeader: jest.fn(),
    end: jest.fn(),
    json: jest.fn(),
  } as any

  return { req, res: res as ServerResponse }
}

describe('Feature Error Tracking', () => {
  describe('Step Function Error Tracking', () => {
    describe('Error Wrapping', () => {
      it('should wrap generic Error in FeatureError with step information', async () => {
        const steps: StepInfo[] = [
          {
            number: 100,
            name: '100-validate.js',
            path: '/features/orders/@post/steps/100-validate.js',
            fn: async (_ctx) => {
              throw new Error('Validation failed')
            },
          },
        ]

        const context: Context = {}
        const { req, res } = createMockReqRes()
        const executor = new AutoExecutor({ steps, context, req, res })

        try {
          await executor.execute()
          fail('Should have thrown FeatureError')
        } catch (error) {
          // Must be FeatureError
          expect(error).toBeInstanceOf(FeatureError)

          const featureError = error as FeatureError

          // Must include step information
          expect(featureError.step).toBeDefined()
          expect(featureError.step?.number).toBe(100)
          expect(featureError.step?.name).toBe('100-validate.js')
          expect(featureError.step?.path).toBe('/features/orders/@post/steps/100-validate.js')

          // Must preserve error message
          expect(featureError.message).toBe('Validation failed')

          // Default status code should be 500
          expect(featureError.statusCode).toBe(500)
        }
      })

      it('should preserve HttpError status code when wrapping HttpError', async () => {
        const steps: StepInfo[] = [
          {
            number: 200,
            name: '200-check-user.js',
            path: '/features/users/@get/steps/200-check-user.js',
            fn: async (_ctx) => {
              throw new NotFoundError('User not found')
            },
          },
        ]

        const context: Context = {}
        const { req, res } = createMockReqRes()
        const executor = new AutoExecutor({ steps, context, req, res })

        try {
          await executor.execute()
          fail('Should have thrown FeatureError')
        } catch (error) {
          expect(error).toBeInstanceOf(FeatureError)

          const featureError = error as FeatureError

          // Must preserve 404 status code
          expect(featureError.statusCode).toBe(404)
          expect(featureError.message).toBe('User not found')

          // Must include step information
          expect(featureError.step?.number).toBe(200)
          expect(featureError.step?.name).toBe('200-check-user.js')
        }
      })

      it('should preserve ValidationError status code (400)', async () => {
        const steps: StepInfo[] = [
          {
            number: 100,
            name: '100-validate-input.js',
            path: '/features/orders/@post/steps/100-validate-input.js',
            fn: async (_ctx) => {
              throw new ValidationError('Invalid email format')
            },
          },
        ]

        const context: Context = {}
        const { req, res } = createMockReqRes()
        const executor = new AutoExecutor({ steps, context, req, res })

        try {
          await executor.execute()
          fail('Should have thrown FeatureError')
        } catch (error) {
          const featureError = error as FeatureError

          // Must preserve 400 status code
          expect(featureError.statusCode).toBe(400)
          expect(featureError.message).toBe('Invalid email format')
        }
      })
    })

    describe('Error Information Completeness', () => {
      it('should include all debugging information: step number, name, path', async () => {
        const steps: StepInfo[] = [
          {
            number: 300,
            name: '300-process-payment.js',
            path: '/features/payments/@post/steps/300-process-payment.js',
            fn: async (_ctx) => {
              throw new Error('Payment gateway timeout')
            },
          },
        ]

        const context: Context = {}
        const { req, res } = createMockReqRes()
        const executor = new AutoExecutor({ steps, context, req, res })

        try {
          await executor.execute()
          fail('Should have thrown FeatureError')
        } catch (error) {
          const featureError = error as FeatureError

          // All step information must be present
          expect(featureError.step).toBeDefined()
          expect(featureError.step?.number).toBe(300)
          expect(featureError.step?.name).toBe('300-process-payment.js')
          expect(featureError.step?.path).toBe('/features/payments/@post/steps/300-process-payment.js')

          // Context must be included
          expect(featureError.context).toBeDefined()
          expect(featureError.context).toBe(context)
        }
      })

      it('should preserve stack trace from original error', async () => {
        const steps: StepInfo[] = [
          {
            number: 100,
            name: '100-step.js',
            path: '/path/to/100-step.js',
            fn: async (_ctx) => {
              const originalError = new Error('Original error')
              throw originalError
            },
          },
        ]

        const context: Context = {}
        const { req, res } = createMockReqRes()
        const executor = new AutoExecutor({ steps, context, req, res })

        try {
          await executor.execute()
          fail('Should have thrown FeatureError')
        } catch (error) {
          const featureError = error as FeatureError

          // Stack trace must exist
          expect(featureError.stack).toBeDefined()
          expect(featureError.stack).toContain('Original error')
        }
      })
    })

    describe('Error Identification by Step', () => {
      it('should clearly identify which step failed when multiple steps exist', async () => {
        const executedSteps: number[] = []

        const steps: StepInfo[] = [
          {
            number: 100,
            name: '100-first.js',
            path: '/path/to/100-first.js',
            fn: async (_ctx) => {
              executedSteps.push(100)
            },
          },
          {
            number: 200,
            name: '200-second.js',
            path: '/path/to/200-second.js',
            fn: async (_ctx) => {
              executedSteps.push(200)
              throw new Error('Error in step 200')
            },
          },
          {
            number: 300,
            name: '300-third.js',
            path: '/path/to/300-third.js',
            fn: async (_ctx) => {
              executedSteps.push(300) // Should not be executed
            },
          },
        ]

        const context: Context = {}
        const { req, res } = createMockReqRes()
        const executor = new AutoExecutor({ steps, context, req, res })

        try {
          await executor.execute()
          fail('Should have thrown FeatureError')
        } catch (error) {
          const featureError = error as FeatureError

          // Must identify step 200 as the failed step
          expect(featureError.step?.number).toBe(200)
          expect(featureError.step?.name).toBe('200-second.js')

          // Only steps 100 and 200 should be executed
          expect(executedSteps).toEqual([100, 200])
        }
      })

      it('should identify first step if error occurs in first step', async () => {
        const steps: StepInfo[] = [
          {
            number: 100,
            name: '100-first-step.js',
            path: '/features/test/@post/steps/100-first-step.js',
            fn: async (_ctx) => {
              throw new Error('Error in first step')
            },
          },
          {
            number: 200,
            name: '200-second-step.js',
            path: '/features/test/@post/steps/200-second-step.js',
            fn: async (_ctx) => {
              // Should not be executed
            },
          },
        ]

        const context: Context = {}
        const { req, res } = createMockReqRes()
        const executor = new AutoExecutor({ steps, context, req, res })

        try {
          await executor.execute()
          fail('Should have thrown FeatureError')
        } catch (error) {
          const featureError = error as FeatureError

          // Must identify step 100
          expect(featureError.step?.number).toBe(100)
          expect(featureError.step?.name).toBe('100-first-step.js')
        }
      })

      it('should identify last step if error occurs in last step', async () => {
        const executedSteps: number[] = []

        const steps: StepInfo[] = [
          {
            number: 100,
            name: '100-step.js',
            path: '/path/to/100-step.js',
            fn: async (_ctx) => {
              executedSteps.push(100)
            },
          },
          {
            number: 900,
            name: '900-respond.js',
            path: '/path/to/900-respond.js',
            fn: async (_ctx) => {
              executedSteps.push(900)
              throw new Error('Error in last step')
            },
          },
        ]

        const context: Context = {}
        const { req, res } = createMockReqRes()
        const executor = new AutoExecutor({ steps, context, req, res })

        try {
          await executor.execute()
          fail('Should have thrown FeatureError')
        } catch (error) {
          const featureError = error as FeatureError

          // Must identify step 900
          expect(featureError.step?.number).toBe(900)
          expect(featureError.step?.name).toBe('900-respond.js')

          // All steps before error should be executed
          expect(executedSteps).toEqual([100, 900])
        }
      })
    })

    describe('Error Message Clarity', () => {
      it('should provide clear error message with file path for debugging', async () => {
        const steps: StepInfo[] = [
          {
            number: 200,
            name: '200-database-query.js',
            path: '/features/users/@get/steps/200-database-query.js',
            fn: async (_ctx) => {
              throw new Error('Database connection timeout')
            },
          },
        ]

        const context: Context = {}
        const { req, res } = createMockReqRes()
        const executor = new AutoExecutor({ steps, context, req, res })

        try {
          await executor.execute()
          fail('Should have thrown FeatureError')
        } catch (error) {
          const featureError = error as FeatureError

          // Error message should be clear
          expect(featureError.message).toBe('Database connection timeout')

          // File path should be available for debugging
          expect(featureError.step?.path).toContain('200-database-query.js')
          expect(featureError.step?.path).toContain('features/users/@get/steps')
        }
      })
    })
  })

  describe('Async Task Error Tracking', () => {
    describe('Error Logging with File Path', () => {
      it('should log task name and file path when async task fails', async () => {
        const originalEnv = process.env.NODE_ENV
        process.env.NODE_ENV = 'development'

        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()

        const tasks: AsyncTaskInfo[] = [
          {
            name: 'send-notification.js',
            path: '/features/orders/@post/async-tasks/send-notification.js',
            fn: async (_ctx) => {
              throw new Error('Notification service unavailable')
            },
          },
        ]

        const ctx: Context = {}
        const scheduler = new AsyncTaskScheduler(tasks, ctx)
        scheduler.schedule()

        await new Promise(resolve => setTimeout(resolve, 100))

        // Error log must include both name and path
        const errorCalls = consoleErrorSpy.mock.calls
        expect(errorCalls.length).toBeGreaterThan(0)

        const errorLog = errorCalls[0][0] as string
        expect(errorLog).toContain('send-notification.js')
        expect(errorLog).toContain('/features/orders/@post/async-tasks/send-notification.js')
        expect(errorLog).toContain('Notification service unavailable')

        consoleErrorSpy.mockRestore()
        process.env.NODE_ENV = originalEnv
      })

      it('should differentiate between tasks with same name but different paths', async () => {
        const originalEnv = process.env.NODE_ENV
        process.env.NODE_ENV = 'development'

        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()

        const tasks: AsyncTaskInfo[] = [
          {
            name: 'send-email.js',
            path: '/features/orders/@post/async-tasks/send-email.js',
            fn: async (_ctx) => {
              throw new Error('Order confirmation email failed')
            },
          },
          {
            name: 'send-email.js',
            path: '/features/users/@post/async-tasks/send-email.js',
            fn: async (_ctx) => {
              throw new Error('Welcome email failed')
            },
          },
        ]

        const ctx: Context = {}
        const scheduler = new AsyncTaskScheduler(tasks, ctx)
        scheduler.schedule()

        await new Promise(resolve => setTimeout(resolve, 100))

        const errorCalls = consoleErrorSpy.mock.calls
        expect(errorCalls.length).toBe(2)

        // First error should contain orders path
        const firstError = errorCalls[0][0] as string
        expect(firstError).toContain('/features/orders/@post/async-tasks/send-email.js')
        expect(firstError).toContain('Order confirmation email failed')

        // Second error should contain users path
        const secondError = errorCalls[1][0] as string
        expect(secondError).toContain('/features/users/@post/async-tasks/send-email.js')
        expect(secondError).toContain('Welcome email failed')

        consoleErrorSpy.mockRestore()
        process.env.NODE_ENV = originalEnv
      })
    })

    describe('Error Isolation', () => {
      it('should continue executing other async tasks when one fails', async () => {
        const executedTasks: string[] = []

        const tasks: AsyncTaskInfo[] = [
          {
            name: 'task1.js',
            path: '/path/to/task1.js',
            fn: async (_ctx) => {
              executedTasks.push('task1')
            },
          },
          {
            name: 'failing-task.js',
            path: '/path/to/failing-task.js',
            fn: async (_ctx) => {
              executedTasks.push('failing-task')
              throw new Error('This task failed')
            },
          },
          {
            name: 'task3.js',
            path: '/path/to/task3.js',
            fn: async (_ctx) => {
              executedTasks.push('task3')
            },
          },
        ]

        const ctx: Context = {}
        const scheduler = new AsyncTaskScheduler(tasks, ctx)
        scheduler.schedule()

        await new Promise(resolve => setTimeout(resolve, 100))

        // All tasks should be executed despite failure
        expect(executedTasks).toEqual(['task1', 'failing-task', 'task3'])
      })
    })
  })

  describe('Integration Tests - Real Feature Error Tracking', () => {
    describe('Step Error in Real Feature Flow', () => {
      it('should track error through entire feature execution flow', async () => {
        const steps: StepInfo[] = [
          {
            number: 100,
            name: '100-validate-request.js',
            path: '/features/api/orders/@post/steps/100-validate-request.js',
            fn: async (ctx) => {
              ctx.validated = true
            },
          },
          {
            number: 200,
            name: '200-check-inventory.js',
            path: '/features/api/orders/@post/steps/200-check-inventory.js',
            fn: async (_ctx) => {
              // Simulate inventory check failure
              throw new Error('Product out of stock')
            },
          },
          {
            number: 300,
            name: '300-create-order.js',
            path: '/features/api/orders/@post/steps/300-create-order.js',
            fn: async (_ctx) => {
              // Should not be executed
              throw new Error('This should not run')
            },
          },
        ]

        const context: Context = {}
        const { req, res } = createMockReqRes()
        const executor = new AutoExecutor({ steps, context, req, res })

        try {
          await executor.execute()
          fail('Should have thrown FeatureError')
        } catch (error) {
          const featureError = error as FeatureError

          // Must pinpoint exact step
          expect(featureError.step?.number).toBe(200)
          expect(featureError.step?.name).toBe('200-check-inventory.js')
          expect(featureError.step?.path).toContain('features/api/orders/@post/steps/200-check-inventory.js')

          // Error message must be preserved
          expect(featureError.message).toBe('Product out of stock')

          // Context should show partial execution
          expect(context.validated).toBe(true)
        }
      })
    })

    describe('Multiple Errors in Same Feature', () => {
      it('should report only the first error that occurs', async () => {
        const steps: StepInfo[] = [
          {
            number: 100,
            name: '100-first-error.js',
            path: '/path/to/100-first-error.js',
            fn: async (_ctx) => {
              throw new Error('First error')
            },
          },
          {
            number: 200,
            name: '200-second-error.js',
            path: '/path/to/200-second-error.js',
            fn: async (_ctx) => {
              throw new Error('Second error - should not be thrown')
            },
          },
        ]

        const context: Context = {}
        const { req, res } = createMockReqRes()
        const executor = new AutoExecutor({ steps, context, req, res })

        try {
          await executor.execute()
          fail('Should have thrown FeatureError')
        } catch (error) {
          const featureError = error as FeatureError

          // Should report first error only
          expect(featureError.step?.number).toBe(100)
          expect(featureError.message).toBe('First error')
        }
      })
    })
  })

  describe('Error Tracking Quality Metrics', () => {
    it('should provide sufficient information for production debugging', async () => {
      const steps: StepInfo[] = [
        {
          number: 300,
          name: '300-external-api-call.js',
          path: '/features/integrations/external-service/@post/steps/300-external-api-call.js',
          fn: async (_ctx) => {
            throw new Error('External API returned 503')
          },
        },
      ]

      const context: Context = { requestId: 'req_12345', userId: 'user_67890' }
      const { req, res } = createMockReqRes()
      const executor = new AutoExecutor({ steps, context, req, res })

      try {
        await executor.execute()
        fail('Should have thrown FeatureError')
      } catch (error) {
        const featureError = error as FeatureError

        // Information checklist for production debugging:
        // ✅ 1. Error message
        expect(featureError.message).toBeDefined()
        expect(featureError.message).toBe('External API returned 503')

        // ✅ 2. Step number (which step failed)
        expect(featureError.step?.number).toBeDefined()
        expect(featureError.step?.number).toBe(300)

        // ✅ 3. Step filename
        expect(featureError.step?.name).toBeDefined()
        expect(featureError.step?.name).toBe('300-external-api-call.js')

        // ✅ 4. Full file path (for finding the exact file)
        expect(featureError.step?.path).toBeDefined()
        expect(featureError.step?.path).toContain('features/integrations/external-service/@post/steps')

        // ✅ 5. Status code (for HTTP response)
        expect(featureError.statusCode).toBeDefined()

        // ✅ 6. Context (request state at time of error)
        expect(featureError.context).toBeDefined()
        expect(featureError.context?.requestId).toBe('req_12345')

        // ✅ 7. Stack trace
        expect(featureError.stack).toBeDefined()
      }
    })
  })

  describe('Edge Cases and Real-World Scenarios', () => {
    describe('Complex File Paths', () => {
      it('should handle deeply nested feature paths', async () => {
        const steps: StepInfo[] = [
          {
            number: 100,
            name: '100-validate.js',
            path: '/features/api/v1/admin/organizations/[orgId]/users/[userId]/permissions/@patch/steps/100-validate.js',
            fn: async (_ctx) => {
              throw new Error('Permission validation failed')
            },
          },
        ]

        const context: Context = {}
        const { req, res } = createMockReqRes()
        const executor = new AutoExecutor({ steps, context, req, res })

        try {
          await executor.execute()
          fail('Should have thrown FeatureError')
        } catch (error) {
          const featureError = error as FeatureError

          // Must preserve full path even when deeply nested
          expect(featureError.step?.path).toContain('api/v1/admin/organizations')
          expect(featureError.step?.path).toContain('[orgId]/users/[userId]/permissions/@patch')
          expect(featureError.step?.name).toBe('100-validate.js')
        }
      })

      it('should handle special characters in file paths', async () => {
        const steps: StepInfo[] = [
          {
            number: 200,
            name: '200-process-data.js',
            path: '/features/api/special-chars/@post/steps/200-process-data.js',
            fn: async (_ctx) => {
              throw new Error('Processing failed')
            },
          },
        ]

        const context: Context = {}
        const { req, res } = createMockReqRes()
        const executor = new AutoExecutor({ steps, context, req, res })

        try {
          await executor.execute()
          fail('Should have thrown FeatureError')
        } catch (error) {
          const featureError = error as FeatureError

          // Path with special chars should be preserved
          expect(featureError.step?.path).toContain('special-chars/@post')
          expect(featureError.step?.name).toBe('200-process-data.js')
        }
      })
    })

    describe('Complex Error Messages', () => {
      it('should handle very long error messages', async () => {
        const longMessage = 'Database query failed: ' + 'x'.repeat(500) + ' - timeout after 30 seconds'

        const steps: StepInfo[] = [
          {
            number: 100,
            name: '100-query.js',
            path: '/path/to/100-query.js',
            fn: async (_ctx) => {
              throw new Error(longMessage)
            },
          },
        ]

        const context: Context = {}
        const { req, res } = createMockReqRes()
        const executor = new AutoExecutor({ steps, context, req, res })

        try {
          await executor.execute()
          fail('Should have thrown FeatureError')
        } catch (error) {
          const featureError = error as FeatureError

          // Long message should be preserved
          expect(featureError.message).toBe(longMessage)
          expect(featureError.message.length).toBeGreaterThan(500)
        }
      })

      it('should handle multiline error messages', async () => {
        const multilineMessage = 'Error occurred:\n  Line 1: Validation failed\n  Line 2: Field "email" is invalid\n  Line 3: Field "age" must be >= 18'

        const steps: StepInfo[] = [
          {
            number: 100,
            name: '100-validate.js',
            path: '/path/to/100-validate.js',
            fn: async (_ctx) => {
              throw new Error(multilineMessage)
            },
          },
        ]

        const context: Context = {}
        const { req, res } = createMockReqRes()
        const executor = new AutoExecutor({ steps, context, req, res })

        try {
          await executor.execute()
          fail('Should have thrown FeatureError')
        } catch (error) {
          const featureError = error as FeatureError

          // Multiline message should be preserved
          expect(featureError.message).toBe(multilineMessage)
          expect(featureError.message).toContain('\n')
        }
      })

      it('should handle error messages with special characters', async () => {
        const specialMessage = 'JSON parse error: Unexpected token } in position 42 at line 10:5'

        const steps: StepInfo[] = [
          {
            number: 100,
            name: '100-parse.js',
            path: '/path/to/100-parse.js',
            fn: async (_ctx) => {
              throw new Error(specialMessage)
            },
          },
        ]

        const context: Context = {}
        const { req, res } = createMockReqRes()
        const executor = new AutoExecutor({ steps, context, req, res })

        try {
          await executor.execute()
          fail('Should have thrown FeatureError')
        } catch (error) {
          const featureError = error as FeatureError

          // Special characters should be preserved
          expect(featureError.message).toBe(specialMessage)
          expect(featureError.message).toContain('}')
          expect(featureError.message).toContain(':')
        }
      })
    })

    describe('Stack Trace Preservation', () => {
      it('should preserve stack trace through async function calls', async () => {
        const steps: StepInfo[] = [
          {
            number: 100,
            name: '100-async-error.js',
            path: '/path/to/100-async-error.js',
            fn: async (_ctx) => {
              // Nested async function to test stack trace depth
              const deepFunction = async () => {
                throw new Error('Deep async error')
              }
              await deepFunction()
            },
          },
        ]

        const context: Context = {}
        const { req, res } = createMockReqRes()
        const executor = new AutoExecutor({ steps, context, req, res })

        try {
          await executor.execute()
          fail('Should have thrown FeatureError')
        } catch (error) {
          const featureError = error as FeatureError

          // Stack trace must exist and contain useful info
          expect(featureError.stack).toBeDefined()
          expect(featureError.stack).toContain('Deep async error')
        }
      })

      it('should preserve original error type information in stack', async () => {
        const steps: StepInfo[] = [
          {
            number: 100,
            name: '100-type-error.js',
            path: '/path/to/100-type-error.js',
            fn: async (_ctx) => {
              // Intentionally cause TypeError
              const obj: any = null
              obj.property.access() // Will throw TypeError
            },
          },
        ]

        const context: Context = {}
        const { req, res } = createMockReqRes()
        const executor = new AutoExecutor({ steps, context, req, res })

        try {
          await executor.execute()
          fail('Should have thrown FeatureError')
        } catch (error) {
          const featureError = error as FeatureError

          // Stack trace should preserve TypeError info
          expect(featureError.stack).toBeDefined()
          expect(featureError.message).toContain('null')
        }
      })
    })

    describe('Async Task Error Log Format', () => {
      it('should provide easily parseable error log format', async () => {
        const originalEnv = process.env.NODE_ENV
        process.env.NODE_ENV = 'development'

        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()

        const tasks: AsyncTaskInfo[] = [
          {
            name: 'process-payment.js',
            path: '/features/orders/@post/async-tasks/process-payment.js',
            fn: async (_ctx) => {
              throw new Error('Payment gateway timeout')
            },
          },
        ]

        const ctx: Context = {}
        const scheduler = new AsyncTaskScheduler(tasks, ctx)
        scheduler.schedule()

        await new Promise(resolve => setTimeout(resolve, 100))

        const errorLog = consoleErrorSpy.mock.calls[0][0] as string

        // Log format should include:
        // 1. Async task identifier
        expect(errorLog).toContain('Async task')

        // 2. Task name
        expect(errorLog).toContain('process-payment.js')

        // 3. File path (for quick file navigation)
        expect(errorLog).toContain('/features/orders/@post/async-tasks/process-payment.js')

        // 4. Error message
        expect(errorLog).toContain('Payment gateway timeout')

        // Log should be on single line (easier to grep/search)
        const logLines = errorLog.split('\n')
        expect(logLines.length).toBe(1)

        consoleErrorSpy.mockRestore()
        process.env.NODE_ENV = originalEnv
      })
    })

    describe('Context State Capture', () => {
      it('should capture context state at time of error', async () => {
        const steps: StepInfo[] = [
          {
            number: 100,
            name: '100-modify-context.js',
            path: '/path/to/100-modify-context.js',
            fn: async (ctx) => {
              ctx.step100 = 'completed'
              ctx.timestamp = Date.now()
            },
          },
          {
            number: 200,
            name: '200-error.js',
            path: '/path/to/200-error.js',
            fn: async (ctx) => {
              ctx.step200 = 'started'
              throw new Error('Error in step 200')
            },
          },
        ]

        const context: Context = { initialValue: 'test' }
        const { req, res } = createMockReqRes()
        const executor = new AutoExecutor({ steps, context, req, res })

        try {
          await executor.execute()
          fail('Should have thrown FeatureError')
        } catch (error) {
          const featureError = error as FeatureError

          // Context should show state at time of error
          expect(featureError.context?.initialValue).toBe('test')
          expect(featureError.context?.step100).toBe('completed')
          expect(featureError.context?.step200).toBe('started')
          expect(featureError.context?.timestamp).toBeDefined()
        }
      })

      it('should capture complex context objects', async () => {
        const steps: StepInfo[] = [
          {
            number: 100,
            name: '100-complex.js',
            path: '/path/to/100-complex.js',
            fn: async (ctx) => {
              ctx.user = { id: 123, name: 'John', roles: ['admin', 'user'] }
              ctx.order = { items: [{ id: 1, qty: 2 }, { id: 2, qty: 1 }], total: 99.99 }
              throw new Error('Complex context error')
            },
          },
        ]

        const context: Context = {}
        const { req, res } = createMockReqRes()
        const executor = new AutoExecutor({ steps, context, req, res })

        try {
          await executor.execute()
          fail('Should have thrown FeatureError')
        } catch (error) {
          const featureError = error as FeatureError

          // Complex objects should be preserved
          expect(featureError.context?.user).toBeDefined()
          expect(featureError.context?.user.id).toBe(123)
          expect(featureError.context?.user.roles).toEqual(['admin', 'user'])
          expect(featureError.context?.order.items).toHaveLength(2)
          expect(featureError.context?.order.total).toBe(99.99)
        }
      })
    })

    describe('Error Isolation Verification', () => {
      it('should throw FeatureError when step fails', async () => {
        const steps: StepInfo[] = [
          {
            number: 100,
            name: '100-error.js',
            path: '/path/to/100-error.js',
            fn: async (_ctx) => {
              throw new Error('Step error')
            },
          },
        ]

        const context: Context = {}
        const { req, res } = createMockReqRes()
        const executor = new AutoExecutor({ steps, context, req, res })

        try {
          await executor.execute()
          fail('Should have thrown FeatureError')
        } catch (error) {
          // Step error should throw FeatureError with proper tracking
          expect(error).toBeInstanceOf(FeatureError)
          const featureError = error as FeatureError
          expect(featureError.step?.number).toBe(100)
          expect(featureError.step?.name).toBe('100-error.js')
        }
      })

      it('should ensure async task errors do not affect other async tasks', async () => {
        const executedTasks: string[] = []

        const tasks: AsyncTaskInfo[] = [
          {
            name: 'task1.js',
            path: '/path/to/task1.js',
            fn: async (_ctx) => {
              executedTasks.push('task1')
            },
          },
          {
            name: 'error-task.js',
            path: '/path/to/error-task.js',
            fn: async (_ctx) => {
              executedTasks.push('error-task')
              throw new Error('Async task error')
            },
          },
          {
            name: 'task3.js',
            path: '/path/to/task3.js',
            fn: async (_ctx) => {
              executedTasks.push('task3')
            },
          },
        ]

        const ctx: Context = {}
        const scheduler = new AsyncTaskScheduler(tasks, ctx)
        scheduler.schedule()

        await new Promise(resolve => setTimeout(resolve, 100))

        // All tasks should execute despite error in middle
        expect(executedTasks).toEqual(['task1', 'error-task', 'task3'])
      })
    })
  })
})
