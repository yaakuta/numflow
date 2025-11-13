/**
 * Error Handler Test
 *

 * Error handler function tests
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'
import { IncomingMessage, ServerResponse } from 'http'
import {
  sendErrorResponse,
  defaultErrorHandler,
  wrapErrorHandler,
  ErrorResponse,
} from '../src/errors/error-handler.js'
import {
  ValidationError,
  BusinessError,
  NotFoundError,
  FeatureExecutionError,
} from '../src/errors/index.js'

// Mock Request and Response helpers
function createMockRequest(): IncomingMessage {
  return {
    method: 'GET',
    url: '/test',
    headers: {},
  } as IncomingMessage
}

function createMockResponse(): ServerResponse & {
  _statusCode?: number
  _headers: Record<string, string>
  _body?: string
  headersSent: boolean
} {
  const res: any = {
    _headersSent: false,
    _statusCode: undefined,
    _headers: {},
    _body: undefined,
    statusCode: 200,
    setHeader(name: string, value: string) {
      res._headers[name] = value
    },
    end(data?: string) {
      res._body = data
      res._headersSent = true // Mark headers as sent when end() is called
    },
  }

  Object.defineProperty(res, 'statusCode', {
    get() {
      return res._statusCode || 200
    },
    set(value: number) {
      res._statusCode = value
    },
  })

  Object.defineProperty(res, 'headersSent', {
    get() {
      return res._headersSent
    },
    set(value: boolean) {
      res._headersSent = value
    },
  })

  return res as ServerResponse & {
    _statusCode?: number
    _headers: Record<string, string>
    _body?: string
    headersSent: boolean
  }
}

describe('Error Handler - sendErrorResponse', () => {
  let consoleInfoSpy: any
  let consoleErrorSpy: any

  beforeEach(() => {
    consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation(() => {})
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleInfoSpy.mockRestore()
    consoleErrorSpy.mockRestore()
  })

  it('should send basic error response', () => {
    const req = createMockRequest()
    const res = createMockResponse()
    const error = new Error('Test error')

    sendErrorResponse(error, req, res)

    expect(res.statusCode).toBe(500)
    expect(res._headers['Content-Type']).toBe('application/json')

    const body = JSON.parse(res._body!) as ErrorResponse
    expect(body.error.message).toBe('Test error')
    expect(body.error.statusCode).toBe(500)
    expect(body.error.stack).toBeUndefined()
  })

  it('should send HttpError with correct status code', () => {
    const req = createMockRequest()
    const res = createMockResponse()
    const error = new NotFoundError('User not found')

    sendErrorResponse(error, req, res)

    expect(res.statusCode).toBe(404)

    const body = JSON.parse(res._body!) as ErrorResponse
    expect(body.error.message).toBe('User not found')
    expect(body.error.statusCode).toBe(404)
  })

  it('should include validation errors for ValidationError', () => {
    const req = createMockRequest()
    const res = createMockResponse()
    const validationErrors = {
      email: ['Email is required'],
      password: ['Password is too short'],
    }
    const error = new ValidationError('Validation failed', validationErrors)

    sendErrorResponse(error, req, res)

    expect(res.statusCode).toBe(400)

    const body = JSON.parse(res._body!) as ErrorResponse
    expect(body.error.message).toBe('Validation failed')
    expect(body.error.statusCode).toBe(400)
    expect(body.error.validationErrors).toEqual(validationErrors)
  })

  it('should include code for BusinessError', () => {
    const req = createMockRequest()
    const res = createMockResponse()
    const error = new BusinessError('Insufficient balance', 'INSUFFICIENT_BALANCE')

    sendErrorResponse(error, req, res)

    expect(res.statusCode).toBe(400)

    const body = JSON.parse(res._body!) as ErrorResponse
    expect(body.error.message).toBe('Insufficient balance')
    expect(body.error.statusCode).toBe(400)
    expect(body.error.code).toBe('INSUFFICIENT_BALANCE')
  })

  it('should include step information for FeatureExecutionError', () => {
    const req = createMockRequest()
    const res = createMockResponse()
    const originalError = new Error('Payment failed')
    const step = { number: 300, name: '300-process-payment.js' }
    const error = new FeatureExecutionError(originalError, step)

    sendErrorResponse(error, req, res)

    expect(res.statusCode).toBe(500)

    const body = JSON.parse(res._body!) as ErrorResponse
    expect(body.error.message).toBe('Payment failed')
    expect(body.error.statusCode).toBe(500)
    expect(body.error.step).toEqual(step)
  })

  it('should include stack trace when includeStack is true', () => {
    const req = createMockRequest()
    const res = createMockResponse()
    const error = new Error('Test error')

    sendErrorResponse(error, req, res, true)

    const body = JSON.parse(res._body!) as ErrorResponse
    expect(body.error.stack).toBeDefined()
    expect(body.error.stack).toContain('Test error')
  })

  it('should not include stack trace when includeStack is false', () => {
    const req = createMockRequest()
    const res = createMockResponse()
    const error = new Error('Test error')

    sendErrorResponse(error, req, res, false)

    const body = JSON.parse(res._body!) as ErrorResponse
    expect(body.error.stack).toBeUndefined()
  })

  it('should not send response if headers already sent', () => {
    const req = createMockRequest()
    const res = createMockResponse()
    res.headersSent = true
    const error = new Error('Test error')

    sendErrorResponse(error, req, res)

    expect(res._body).toBeUndefined()
  })

  it('should log operational errors as info', () => {
    const req = createMockRequest()
    const res = createMockResponse()
    const error = new NotFoundError('User not found')

    sendErrorResponse(error, req, res)

    expect(consoleInfoSpy).toHaveBeenCalledWith('[404] User not found')
    expect(consoleErrorSpy).not.toHaveBeenCalled()
  })

  it('should log non-operational errors as error', () => {
    const req = createMockRequest()
    const res = createMockResponse()
    const error = new Error('Unexpected error')

    sendErrorResponse(error, req, res)

    expect(consoleErrorSpy).toHaveBeenCalledWith('[500] Unexpected error')
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Unexpected error'))
    expect(consoleInfoSpy).not.toHaveBeenCalled()
  })
})

describe('Error Handler - defaultErrorHandler', () => {
  let consoleInfoSpy: any
  let consoleErrorSpy: any
  let originalEnv: string | undefined

  beforeEach(() => {
    consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation(() => {})
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    originalEnv = process.env.NODE_ENV
  })

  afterEach(() => {
    consoleInfoSpy.mockRestore()
    consoleErrorSpy.mockRestore()
    process.env.NODE_ENV = originalEnv
  })

  it('should include stack trace in development mode', () => {
    process.env.NODE_ENV = 'development'

    const req = createMockRequest()
    const res = createMockResponse()
    const error = new Error('Test error')

    defaultErrorHandler(error, req, res)

    const body = JSON.parse(res._body!) as ErrorResponse
    expect(body.error.stack).toBeDefined()
  })

  it('should not include stack trace in production mode', () => {
    process.env.NODE_ENV = 'production'

    const req = createMockRequest()
    const res = createMockResponse()
    const error = new Error('Test error')

    defaultErrorHandler(error, req, res)

    const body = JSON.parse(res._body!) as ErrorResponse
    expect(body.error.stack).toBeUndefined()
  })
})

describe('Error Handler - wrapErrorHandler', () => {
  let consoleErrorSpy: any

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
  })

  it('should execute custom error handler', async () => {
    const req = createMockRequest()
    const res = createMockResponse()
    const error = new Error('Test error')

    const customHandler = jest.fn((_err: any, _req: any, res: any) => {
      res.statusCode = 999
      res.setHeader('X-Custom', 'true')
      res.end('Custom error')
    })

    const wrapped = wrapErrorHandler(customHandler)
    await wrapped(error, req, res)

    expect(customHandler).toHaveBeenCalledWith(error, req, res)
    expect(res.statusCode).toBe(999)
    expect(res._headers['X-Custom']).toBe('true')
    expect(res._body).toBe('Custom error')
  })

  it('should send default response if handler does not send response', async () => {
    process.env.NODE_ENV = 'production'

    const req = createMockRequest()
    const res = createMockResponse()
    const error = new NotFoundError('User not found')

    const customHandler = jest.fn((_err: any, _req: any, _res: any) => {
      // Handler does nothing
    })

    const wrapped = wrapErrorHandler(customHandler)
    await wrapped(error, req, res)

    expect(customHandler).toHaveBeenCalled()
    expect(res.statusCode).toBe(404)

    const body = JSON.parse(res._body!) as ErrorResponse
    expect(body.error.message).toBe('User not found')
    expect(body.error.statusCode).toBe(404)
  })

  it('should handle async error handler', async () => {
    const req = createMockRequest()
    const res = createMockResponse()
    const error = new Error('Test error')

    const asyncHandler = jest.fn(async (_err: any, _req: any, res: any) => {
      await new Promise(resolve => setTimeout(resolve, 10))
      res.statusCode = 888
      res.end('Async error')
    })

    const wrapped = wrapErrorHandler(asyncHandler)
    await wrapped(error, req, res)

    expect(asyncHandler).toHaveBeenCalled()
    expect(res.statusCode).toBe(888)
    expect(res._body).toBe('Async error')
  })

  it('should handle error in error handler', async () => {
    const req = createMockRequest()
    const res = createMockResponse()
    const error = new Error('Original error')

    const faultyHandler = jest.fn((_err: any, _req: any, _res: any) => {
      throw new Error('Handler error')
    })

    const wrapped = wrapErrorHandler(faultyHandler)
    await wrapped(error, req, res)

    expect(faultyHandler).toHaveBeenCalled()
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error in error handler:',
      expect.any(Error)
    )
    expect(res.statusCode).toBe(500)

    const body = JSON.parse(res._body!)
    expect(body.error.message).toBe('Internal server error')
    expect(body.error.statusCode).toBe(500)
  })

  it('should not send response twice if handler errors and headers sent', async () => {
    const req = createMockRequest()
    const res = createMockResponse()
    const error = new Error('Original error')

    const faultyHandler = jest.fn((_err: any, _req: any, res: any) => {
      res.headersSent = true
      throw new Error('Handler error')
    })

    const wrapped = wrapErrorHandler(faultyHandler)
    await wrapped(error, req, res)

    expect(faultyHandler).toHaveBeenCalled()
    expect(res._body).toBeUndefined()
  })
})
