/**
 * Errors Test
 *

 * Custom error class tests
 */

import { describe, it, expect } from '@jest/globals'
import {
  HttpError,
  ValidationError,
  BusinessError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  PayloadTooLargeError,
  TooManyRequestsError,
  InternalServerError,
  NotImplementedError,
  ServiceUnavailableError,
  FeatureExecutionError,
  isHttpError,
  isOperationalError,
} from '../src/errors/index.js'

describe('Errors - HttpError', () => {
  it('should create HttpError with correct properties', () => {
    const error = new HttpError('Test error', 500)

    expect(error).toBeInstanceOf(Error)
    expect(error).toBeInstanceOf(HttpError)
    expect(error.message).toBe('Test error')
    expect(error.statusCode).toBe(500)
    expect(error.isOperational).toBe(true)
    expect(error.name).toBe('HttpError')
  })

  it('should have proper stack trace', () => {
    const error = new HttpError('Test error', 500)

    expect(error.stack).toBeDefined()
    expect(error.stack).toContain('Test error')
  })
})

describe('Errors - ValidationError', () => {
  it('should create ValidationError with default message', () => {
    const error = new ValidationError()

    expect(error).toBeInstanceOf(HttpError)
    expect(error.message).toBe('Validation failed')
    expect(error.statusCode).toBe(400)
    expect(error.validationErrors).toBeUndefined()
  })

  it('should create ValidationError with custom message', () => {
    const error = new ValidationError('Custom validation error')

    expect(error.message).toBe('Custom validation error')
    expect(error.statusCode).toBe(400)
  })

  it('should create ValidationError with validation errors', () => {
    const validationErrors = {
      email: ['Email is required', 'Email must be valid'],
      password: ['Password is required'],
    }
    const error = new ValidationError('Validation failed', validationErrors)

    expect(error.message).toBe('Validation failed')
    expect(error.statusCode).toBe(400)
    expect(error.validationErrors).toEqual(validationErrors)
  })
})

describe('Errors - BusinessError', () => {
  it('should create BusinessError with message only', () => {
    const error = new BusinessError('Insufficient balance')

    expect(error).toBeInstanceOf(HttpError)
    expect(error.message).toBe('Insufficient balance')
    expect(error.statusCode).toBe(400)
    expect(error.code).toBeUndefined()
  })

  it('should create BusinessError with code', () => {
    const error = new BusinessError('Insufficient balance', 'INSUFFICIENT_BALANCE')

    expect(error.message).toBe('Insufficient balance')
    expect(error.statusCode).toBe(400)
    expect(error.code).toBe('INSUFFICIENT_BALANCE')
  })
})

describe('Errors - UnauthorizedError', () => {
  it('should create UnauthorizedError with default message', () => {
    const error = new UnauthorizedError()

    expect(error).toBeInstanceOf(HttpError)
    expect(error.message).toBe('Unauthorized')
    expect(error.statusCode).toBe(401)
  })

  it('should create UnauthorizedError with custom message', () => {
    const error = new UnauthorizedError('Invalid token')

    expect(error.message).toBe('Invalid token')
    expect(error.statusCode).toBe(401)
  })
})

describe('Errors - ForbiddenError', () => {
  it('should create ForbiddenError with default message', () => {
    const error = new ForbiddenError()

    expect(error.message).toBe('Forbidden')
    expect(error.statusCode).toBe(403)
  })

  it('should create ForbiddenError with custom message', () => {
    const error = new ForbiddenError('Access denied')

    expect(error.message).toBe('Access denied')
    expect(error.statusCode).toBe(403)
  })
})

describe('Errors - NotFoundError', () => {
  it('should create NotFoundError with default message', () => {
    const error = new NotFoundError()

    expect(error.message).toBe('Not found')
    expect(error.statusCode).toBe(404)
  })

  it('should create NotFoundError with custom message', () => {
    const error = new NotFoundError('User not found')

    expect(error.message).toBe('User not found')
    expect(error.statusCode).toBe(404)
  })
})

describe('Errors - ConflictError', () => {
  it('should create ConflictError with default message', () => {
    const error = new ConflictError()

    expect(error.message).toBe('Conflict')
    expect(error.statusCode).toBe(409)
  })

  it('should create ConflictError with custom message', () => {
    const error = new ConflictError('Email already exists')

    expect(error.message).toBe('Email already exists')
    expect(error.statusCode).toBe(409)
  })
})

describe('Errors - PayloadTooLargeError', () => {
  it('should create PayloadTooLargeError with default message', () => {
    const error = new PayloadTooLargeError()

    expect(error.message).toBe('Payload too large')
    expect(error.statusCode).toBe(413)
  })

  it('should create PayloadTooLargeError with custom message', () => {
    const error = new PayloadTooLargeError('Request body exceeds limit')

    expect(error.message).toBe('Request body exceeds limit')
    expect(error.statusCode).toBe(413)
  })
})

describe('Errors - TooManyRequestsError', () => {
  it('should create TooManyRequestsError with default message', () => {
    const error = new TooManyRequestsError()

    expect(error.message).toBe('Too many requests')
    expect(error.statusCode).toBe(429)
    expect(error.retryAfter).toBeUndefined()
  })

  it('should create TooManyRequestsError with retryAfter', () => {
    const error = new TooManyRequestsError('Rate limit exceeded', 60)

    expect(error.message).toBe('Rate limit exceeded')
    expect(error.statusCode).toBe(429)
    expect(error.retryAfter).toBe(60)
  })
})

describe('Errors - InternalServerError', () => {
  it('should create InternalServerError with default message', () => {
    const error = new InternalServerError()

    expect(error.message).toBe('Internal server error')
    expect(error.statusCode).toBe(500)
  })

  it('should create InternalServerError with custom message', () => {
    const error = new InternalServerError('Database connection failed')

    expect(error.message).toBe('Database connection failed')
    expect(error.statusCode).toBe(500)
  })
})

describe('Errors - NotImplementedError', () => {
  it('should create NotImplementedError with default message', () => {
    const error = new NotImplementedError()

    expect(error.message).toBe('Not implemented')
    expect(error.statusCode).toBe(501)
  })

  it('should create NotImplementedError with custom message', () => {
    const error = new NotImplementedError('Feature not implemented')

    expect(error.message).toBe('Feature not implemented')
    expect(error.statusCode).toBe(501)
  })
})

describe('Errors - ServiceUnavailableError', () => {
  it('should create ServiceUnavailableError with default message', () => {
    const error = new ServiceUnavailableError()

    expect(error.message).toBe('Service unavailable')
    expect(error.statusCode).toBe(503)
  })

  it('should create ServiceUnavailableError with custom message', () => {
    const error = new ServiceUnavailableError('Server is under maintenance')

    expect(error.message).toBe('Server is under maintenance')
    expect(error.statusCode).toBe(503)
  })
})

describe('Errors - FeatureExecutionError', () => {
  it('should wrap HttpError and preserve status code', () => {
    const originalError = new ValidationError('Invalid input')
    const error = new FeatureExecutionError(originalError)

    expect(error).toBeInstanceOf(HttpError)
    expect(error).toBeInstanceOf(FeatureExecutionError)
    expect(error.message).toBe('Invalid input')
    expect(error.statusCode).toBe(400)
    expect(error.originalError).toBe(originalError)
    expect(error.step).toBeUndefined()
  })

  it('should wrap regular Error with 500 status', () => {
    const originalError = new Error('Unexpected error')
    const error = new FeatureExecutionError(originalError)

    expect(error.message).toBe('Unexpected error')
    expect(error.statusCode).toBe(500)
    expect(error.originalError).toBe(originalError)
  })

  it('should include step information', () => {
    const originalError = new Error('Step failed')
    const step = { number: 300, name: '300-process-payment.js' }
    const error = new FeatureExecutionError(originalError, step)

    expect(error.message).toBe('Step failed')
    expect(error.step).toEqual(step)
  })

  it('should handle step information from FeatureError', () => {
    const originalError = new Error('Step returned false')
    const step = { number: 200, name: '200-validate-input.js' }
    const error = new FeatureExecutionError(originalError, step)

    expect(error.message).toBe('Step returned false')
    expect(error.statusCode).toBe(500)
    expect(error.step).toEqual(step)
    expect(error.originalError).toBe(originalError)
  })
})

describe('Errors - Utility functions', () => {
  describe('isHttpError', () => {
    it('should return true for HttpError instances', () => {
      expect(isHttpError(new HttpError('Test', 500))).toBe(true)
      expect(isHttpError(new ValidationError())).toBe(true)
      expect(isHttpError(new NotFoundError())).toBe(true)
      expect(isHttpError(new FeatureExecutionError(new Error('Test')))).toBe(true)
    })

    it('should return false for non-HttpError instances', () => {
      expect(isHttpError(new Error('Test'))).toBe(false)
      expect(isHttpError('error')).toBe(false)
      expect(isHttpError(null)).toBe(false)
      expect(isHttpError(undefined)).toBe(false)
      expect(isHttpError({})).toBe(false)
    })
  })

  describe('isOperationalError', () => {
    it('should return true for operational errors', () => {
      expect(isOperationalError(new HttpError('Test', 500))).toBe(true)
      expect(isOperationalError(new ValidationError())).toBe(true)
      expect(isOperationalError(new NotFoundError())).toBe(true)
    })

    it('should return false for non-operational errors', () => {
      expect(isOperationalError(new Error('Test'))).toBe(false)
      expect(isOperationalError('error')).toBe(false)
      expect(isOperationalError(null)).toBe(false)
      expect(isOperationalError(undefined)).toBe(false)
    })
  })
})

describe('Errors - suggestion and docUrl', () => {
  describe('HttpError with options', () => {
    it('should create HttpError with suggestion', () => {
      const error = new HttpError('Test error', 500, {
        suggestion: 'Try restarting the server',
      })

      expect(error.suggestion).toBe('Try restarting the server')
      expect(error.docUrl).toBeUndefined()
    })

    it('should create HttpError with docUrl', () => {
      const error = new HttpError('Test error', 500, {
        docUrl: 'https://numflow.dev/docs/errors',
      })

      expect(error.docUrl).toBe('https://numflow.dev/docs/errors')
      expect(error.suggestion).toBeUndefined()
    })

    it('should create HttpError with both suggestion and docUrl', () => {
      const error = new HttpError('Test error', 500, {
        suggestion: 'Try restarting the server',
        docUrl: 'https://numflow.dev/docs/errors',
      })

      expect(error.suggestion).toBe('Try restarting the server')
      expect(error.docUrl).toBe('https://numflow.dev/docs/errors')
    })
  })

  describe('ValidationError suggestion', () => {
    it('should have suggestion when validationErrors are provided', () => {
      const error = new ValidationError('Validation failed', {
        email: ['Invalid email'],
      })

      expect(error.suggestion).toBeDefined()
      expect(error.suggestion).toContain('validationErrors')
      expect(error.docUrl).toBe('https://numflow.dev/docs/errors#validation-error')
    })

    it('should have suggestion when validationErrors are not provided', () => {
      const error = new ValidationError()

      expect(error.suggestion).toBeDefined()
      expect(error.suggestion).toContain('required fields')
      expect(error.docUrl).toBe('https://numflow.dev/docs/errors#validation-error')
    })
  })

  describe('All error types should have suggestion and docUrl', () => {
    it('BusinessError should have suggestion and docUrl', () => {
      const error = new BusinessError('Test')
      expect(error.suggestion).toBeDefined()
      expect(error.docUrl).toBe('https://numflow.dev/docs/errors#business-error')
    })

    it('UnauthorizedError should have suggestion and docUrl', () => {
      const error = new UnauthorizedError()
      expect(error.suggestion).toBeDefined()
      expect(error.suggestion).toContain('authentication')
      expect(error.docUrl).toBe('https://numflow.dev/docs/errors#unauthorized-error')
    })

    it('ForbiddenError should have suggestion and docUrl', () => {
      const error = new ForbiddenError()
      expect(error.suggestion).toBeDefined()
      expect(error.suggestion).toContain('permissions')
      expect(error.docUrl).toBe('https://numflow.dev/docs/errors#forbidden-error')
    })

    it('NotFoundError should have suggestion and docUrl', () => {
      const error = new NotFoundError()
      expect(error.suggestion).toBeDefined()
      expect(error.suggestion).toContain('URL')
      expect(error.docUrl).toBe('https://numflow.dev/docs/errors#not-found-error')
    })

    it('ConflictError should have suggestion and docUrl', () => {
      const error = new ConflictError()
      expect(error.suggestion).toBeDefined()
      expect(error.suggestion).toContain('conflict')
      expect(error.docUrl).toBe('https://numflow.dev/docs/errors#conflict-error')
    })

    it('PayloadTooLargeError should have suggestion and docUrl', () => {
      const error = new PayloadTooLargeError()
      expect(error.suggestion).toBeDefined()
      expect(error.suggestion).toContain('size')
      expect(error.docUrl).toBe('https://numflow.dev/docs/errors#payload-too-large-error')
    })

    it('TooManyRequestsError should have suggestion with retryAfter', () => {
      const error = new TooManyRequestsError('Rate limit', 60)
      expect(error.suggestion).toBeDefined()
      expect(error.suggestion).toContain('60')
      expect(error.docUrl).toBe('https://numflow.dev/docs/errors#too-many-requests-error')
    })

    it('TooManyRequestsError should have suggestion without retryAfter', () => {
      const error = new TooManyRequestsError()
      expect(error.suggestion).toBeDefined()
      expect(error.suggestion).toContain('wait')
      expect(error.docUrl).toBe('https://numflow.dev/docs/errors#too-many-requests-error')
    })

    it('InternalServerError should have suggestion and docUrl', () => {
      const error = new InternalServerError()
      expect(error.suggestion).toBeDefined()
      expect(error.suggestion).toContain('unexpected')
      expect(error.docUrl).toBe('https://numflow.dev/docs/errors#internal-server-error')
    })

    it('NotImplementedError should have suggestion and docUrl', () => {
      const error = new NotImplementedError()
      expect(error.suggestion).toBeDefined()
      expect(error.suggestion).toContain('not yet implemented')
      expect(error.docUrl).toBe('https://numflow.dev/docs/errors#not-implemented-error')
    })

    it('ServiceUnavailableError should have suggestion and docUrl', () => {
      const error = new ServiceUnavailableError()
      expect(error.suggestion).toBeDefined()
      expect(error.suggestion).toContain('temporarily')
      expect(error.docUrl).toBe('https://numflow.dev/docs/errors#service-unavailable-error')
    })
  })

  describe('FeatureExecutionError suggestion', () => {
    it('should have suggestion with step information', () => {
      const originalError = new Error('Step failed')
      const step = { number: 300, name: '300-process.js' }
      const error = new FeatureExecutionError(originalError, step)

      expect(error.suggestion).toBeDefined()
      expect(error.suggestion).toContain('step 300')
      expect(error.suggestion).toContain('300-process.js')
      expect(error.docUrl).toBe('https://numflow.dev/docs/errors#feature-execution-error')
    })

    it('should have suggestion without step information', () => {
      const originalError = new Error('Feature failed')
      const error = new FeatureExecutionError(originalError)

      expect(error.suggestion).toBeDefined()
      expect(error.suggestion).toContain('feature execution')
      expect(error.docUrl).toBe('https://numflow.dev/docs/errors#feature-execution-error')
    })
  })
})
