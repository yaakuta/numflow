/**
 * Auto-Error Handler Test

 */

import { ServerResponse } from 'http'
import { AutoErrorHandler } from '../src/feature/auto-error-handler'
import { FeatureError, ValidationError, StepInfo } from '../src/feature/types'

describe('Auto-Error Handler', () => {
  let mockRes: ServerResponse

  beforeEach(() => {
    // Mock ServerResponse
    mockRes = {
      statusCode: 0,
      setHeader: jest.fn(),
      end: jest.fn(),
    } as any
  })

  describe('Error catching and HTTP response', () => {
    it('should convert FeatureError to correct HTTP response', () => {
      const step: StepInfo = {
        number: 200,
        name: '200-process.js',
        path: '/path/to/200-process.js',
        fn: async () => {},
      }

      const error = new FeatureError('Feature execution failed', step, undefined, 500)

      AutoErrorHandler.handle(error, mockRes)

      expect(mockRes.statusCode).toBe(500)
      expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Type', 'application/json')
      expect(mockRes.end).toHaveBeenCalled()

      const response = JSON.parse((mockRes.end as jest.Mock).mock.calls[0][0])
      expect(response.success).toBe(false)
      expect(response.error).toBe('FeatureError')
      expect(response.message).toBe('Feature execution failed')
      expect(response.details.step.number).toBe(200)
      expect(response.details.step.name).toBe('200-process.js')
    })

    it('ValidationError should return 400 response', () => {
      const error = new ValidationError('Invalid input data')

      AutoErrorHandler.handle(error, mockRes)

      expect(mockRes.statusCode).toBe(400)

      const response = JSON.parse((mockRes.end as jest.Mock).mock.calls[0][0])
      expect(response.error).toBe('ValidationError')
      expect(response.message).toBe('Invalid input data')
    })

    it('Generic Error should return 500 response', () => {
      const error = new Error('Unexpected error')

      AutoErrorHandler.handle(error, mockRes)

      expect(mockRes.statusCode).toBe(500)

      const response = JSON.parse((mockRes.end as jest.Mock).mock.calls[0][0])
      expect(response.error).toBe('Error')
      expect(response.message).toBe('Unexpected error')
    })
  })

  describe('statusCode mapping by error type', () => {
    it('should use FeatureError statusCode correctly', () => {
      const error = new FeatureError('Custom error', undefined, undefined, 403)

      AutoErrorHandler.handle(error, mockRes)

      expect(mockRes.statusCode).toBe(403)
    })

    it('ValidationError should always return 400', () => {
      const error = new ValidationError('Validation failed')

      AutoErrorHandler.handle(error, mockRes)

      expect(mockRes.statusCode).toBe(400)
    })
  })

  describe('Step information inclusion', () => {
    it('should include step information in response if FeatureError has step info', () => {
      const step: StepInfo = {
        number: 300,
        name: '300-validate.js',
        path: '/path/to/300-validate.js',
        fn: async () => {},
      }

      const error = new FeatureError('Step failed', step)

      AutoErrorHandler.handle(error, mockRes)

      const response = JSON.parse((mockRes.end as jest.Mock).mock.calls[0][0])
      expect(response.details).toBeDefined()
      expect(response.details.step.number).toBe(300)
      expect(response.details.step.name).toBe('300-validate.js')
    })

    it('should not include details if FeatureError has no step info', () => {
      const error = new FeatureError('General error')

      AutoErrorHandler.handle(error, mockRes)

      const response = JSON.parse((mockRes.end as jest.Mock).mock.calls[0][0])
      expect(response.details).toBeUndefined()
    })
  })

  describe('Development vs Production environment', () => {
    const originalEnv = process.env.NODE_ENV

    afterEach(() => {
      process.env.NODE_ENV = originalEnv
    })

    it('should include stack trace in development environment', () => {
      process.env.NODE_ENV = 'development'

      const error = new Error('Test error')

      AutoErrorHandler.handle(error, mockRes)

      const response = JSON.parse((mockRes.end as jest.Mock).mock.calls[0][0])
      expect(response.stack).toBeDefined()
      expect(response.stack).toContain('Error: Test error')
    })

    it('should not include stack trace in production environment', () => {
      process.env.NODE_ENV = 'production'

      const error = new Error('Test error')

      AutoErrorHandler.handle(error, mockRes)

      const response = JSON.parse((mockRes.end as jest.Mock).mock.calls[0][0])
      expect(response.stack).toBeUndefined()
    })
  })

  describe('Response format', () => {
    it('all error responses should include success: false', () => {
      const error = new Error('Test error')

      AutoErrorHandler.handle(error, mockRes)

      const response = JSON.parse((mockRes.end as jest.Mock).mock.calls[0][0])
      expect(response.success).toBe(false)
    })

    it('error response should have Content-Type as application/json', () => {
      const error = new Error('Test error')

      AutoErrorHandler.handle(error, mockRes)

      expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Type', 'application/json')
    })

    it('error response should be valid JSON', () => {
      const error = new FeatureError('Test error')

      AutoErrorHandler.handle(error, mockRes)

      const responseStr = (mockRes.end as jest.Mock).mock.calls[0][0]
      expect(() => JSON.parse(responseStr)).not.toThrow()
    })
  })

  describe('Error message handling', () => {
    it('should use default message if error message is missing', () => {
      const error = new Error()
      error.message = ''

      AutoErrorHandler.handle(error, mockRes)

      const response = JSON.parse((mockRes.end as jest.Mock).mock.calls[0][0])
      expect(response.message).toBe('An unexpected error occurred')
    })

    it('should handle long error messages correctly', () => {
      const longMessage = 'A'.repeat(1000)
      const error = new Error(longMessage)

      AutoErrorHandler.handle(error, mockRes)

      const response = JSON.parse((mockRes.end as jest.Mock).mock.calls[0][0])
      expect(response.message).toBe(longMessage)
    })

    it('should handle error messages with special characters correctly', () => {
      const specialMessage = 'Error: "test" failed with \\ and \n newline'
      const error = new Error(specialMessage)

      AutoErrorHandler.handle(error, mockRes)

      const response = JSON.parse((mockRes.end as jest.Mock).mock.calls[0][0])
      expect(response.message).toBe(specialMessage)
    })
  })

  describe('Custom FeatureError', () => {
    it('should handle FeatureError with custom statusCode', () => {
      const error = new FeatureError('Not found', undefined, undefined, 404)

      AutoErrorHandler.handle(error, mockRes)

      expect(mockRes.statusCode).toBe(404)

      const response = JSON.parse((mockRes.end as jest.Mock).mock.calls[0][0])
      expect(response.message).toBe('Not found')
    })

    it('should handle 401 Unauthorized error', () => {
      const error = new FeatureError('Unauthorized', undefined, undefined, 401)

      AutoErrorHandler.handle(error, mockRes)

      expect(mockRes.statusCode).toBe(401)
    })

    it('should handle 403 Forbidden error', () => {
      const error = new FeatureError('Forbidden', undefined, undefined, 403)

      AutoErrorHandler.handle(error, mockRes)

      expect(mockRes.statusCode).toBe(403)
    })
  })
})
