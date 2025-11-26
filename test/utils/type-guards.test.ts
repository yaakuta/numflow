/**
 * Type Guards tests
 *
 * Tests type guard functions in src/utils/type-guards.ts
 */

import {
  isInternalRequest,
  isInternalResponse,
  isInternalSocket,
  isInternalError,
  hasParams,
  hasQuery,
  hasReq,
  hasApp,
  hasCode,
  hasValidationErrors,
} from '../../src/utils/type-guards'

describe('Type Guards', () => {
  describe('isInternalRequest', () => {
    it('should recognize object as InternalRequest', () => {
      const req = { url: '/test' }
      expect(isInternalRequest(req)).toBe(true)
    })

    it('null should return false', () => {
      expect(isInternalRequest(null)).toBe(false)
    })

    it('undefined should return false', () => {
      expect(isInternalRequest(undefined)).toBe(false)
    })

    it('primitive values should return false', () => {
      expect(isInternalRequest('string')).toBe(false)
      expect(isInternalRequest(123)).toBe(false)
      expect(isInternalRequest(true)).toBe(false)
    })
  })

  describe('isInternalResponse', () => {
    it('should recognize object as InternalResponse', () => {
      const res = { statusCode: 200 }
      expect(isInternalResponse(res)).toBe(true)
    })

    it('null should return false', () => {
      expect(isInternalResponse(null)).toBe(false)
    })
  })

  describe('isInternalSocket', () => {
    it('should recognize object as InternalSocket', () => {
      const socket = { encrypted: true, remoteAddress: '127.0.0.1' }
      expect(isInternalSocket(socket)).toBe(true)
    })

    it('null should return false', () => {
      expect(isInternalSocket(null)).toBe(false)
    })
  })

  describe('isInternalError', () => {
    it('should recognize Error object as InternalError', () => {
      const error = new Error('Test error')
      expect(isInternalError(error)).toBe(true)
    })

    it('should recognize Error subclass as well', () => {
      class CustomError extends Error {}
      const error = new CustomError('Custom error')
      expect(isInternalError(error)).toBe(true)
    })

    it('plain object should return false', () => {
      const notError = { message: 'Not an error' }
      expect(isInternalError(notError as any)).toBe(false)
    })
  })

  describe('hasParams', () => {
    it('Request with params field should return true', () => {
      const req = { params: { id: '123' } }
      expect(hasParams(req as any)).toBe(true)
    })

    it('Request without params field should return false', () => {
      const req = { url: '/test' }
      expect(hasParams(req as any)).toBe(false)
    })

    it('should return false if params is not an object', () => {
      const req = { params: 'not-object' }
      expect(hasParams(req as any)).toBe(false)
    })
  })

  describe('hasQuery', () => {
    it('Request with query field should return true', () => {
      const req = { query: { search: 'test' } }
      expect(hasQuery(req as any)).toBe(true)
    })

    it('Request without query field should return false', () => {
      const req = { url: '/test' }
      expect(hasQuery(req as any)).toBe(false)
    })

    it('should return false if query is not an object', () => {
      const req = { query: 'not-object' }
      expect(hasQuery(req as any)).toBe(false)
    })
  })

  describe('hasReq', () => {
    it('Response with req field should return true', () => {
      const res = { req: { url: '/test' } }
      expect(hasReq(res as any)).toBe(true)
    })

    it('Response without req field should return false', () => {
      const res = { statusCode: 200 }
      expect(hasReq(res as any)).toBe(false)
    })

    it('should return false if req is not an object', () => {
      const res = { req: 'not-object' }
      expect(hasReq(res as any)).toBe(false)
    })
  })

  describe('hasApp', () => {
    it('Response with app field should return true', () => {
      const res = { app: { settings: {} } }
      expect(hasApp(res as any)).toBe(true)
    })

    it('Response without app field should return false', () => {
      const res = { statusCode: 200 }
      expect(hasApp(res as any)).toBe(false)
    })

    it('should return false if app is not an object', () => {
      const res = { app: 'not-object' }
      expect(hasApp(res as any)).toBe(false)
    })
  })

  describe('hasCode', () => {
    it('Error with code field as string should return true', () => {
      const error = new Error('Test')
      ;(error as any).code = 'ERR_INVALID_INPUT'
      expect(hasCode(error)).toBe(true)
    })

    it('Error without code field should return false', () => {
      const error = new Error('Test')
      expect(hasCode(error)).toBe(false)
    })

    it('should return false if code is not a string', () => {
      const error = new Error('Test')
      ;(error as any).code = 404
      expect(hasCode(error)).toBe(false)
    })
  })

  describe('hasValidationErrors', () => {
    it('Error with validationErrors field should return true', () => {
      const error = new Error('Test')
      ;(error as any).validationErrors = [{ field: 'email', message: 'Invalid' }]
      expect(hasValidationErrors(error)).toBe(true)
    })

    it('Error without validationErrors field should return false', () => {
      const error = new Error('Test')
      expect(hasValidationErrors(error)).toBe(false)
    })

    it('should return false if validationErrors is undefined', () => {
      const error = new Error('Test')
      ;(error as any).validationErrors = undefined
      expect(hasValidationErrors(error)).toBe(false)
    })

    it('should return false if validationErrors is null', () => {
      const error = new Error('Test')
      ;(error as any).validationErrors = null
      expect(hasValidationErrors(error)).toBe(false)
    })

    it('should return true even if validationErrors is an empty array', () => {
      const error = new Error('Test')
      ;(error as any).validationErrors = []
      expect(hasValidationErrors(error)).toBe(true)
    })
  })
})
