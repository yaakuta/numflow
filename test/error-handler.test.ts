/**
 * Error Handler Test
 *
 * Simplified Express-style error handling tests
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'
import { IncomingMessage, ServerResponse } from 'http'
import {
  sendErrorResponse,
  defaultErrorHandler,
  ErrorResponse,
} from '../src/errors/error-handler.js'
import { FeatureError, StepInfo } from '../src/feature/types.js'

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
      res._headersSent = true
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
  let consoleErrorSpy: any

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
  })

  it('should send basic error response with 500 status', () => {
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

  it('should use statusCode from error if present', () => {
    const req = createMockRequest()
    const res = createMockResponse()
    const error = new Error('Not found') as Error & { statusCode: number }
    error.statusCode = 404

    sendErrorResponse(error, req, res)

    expect(res.statusCode).toBe(404)

    const body = JSON.parse(res._body!) as ErrorResponse
    expect(body.error.message).toBe('Not found')
    expect(body.error.statusCode).toBe(404)
  })

  it('should include step information from FeatureError', () => {
    const req = createMockRequest()
    const res = createMockResponse()
    const step: StepInfo = {
      number: 300,
      name: '300-process-payment.js',
      path: '/path/to/step',
      fn: async () => {},
    }
    const originalError = new Error('Payment failed')
    const error = new FeatureError(originalError.message, originalError, step, {}, 500)

    sendErrorResponse(error, req, res)

    expect(res.statusCode).toBe(500)

    const body = JSON.parse(res._body!) as ErrorResponse
    expect(body.error.message).toBe('Payment failed')
    expect(body.error.statusCode).toBe(500)
    expect(body.error.step).toEqual({ number: 300, name: '300-process-payment.js' })
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

  it('should prefer original error stack for FeatureError', () => {
    const req = createMockRequest()
    const res = createMockResponse()
    const originalError = new Error('Original error')
    const step: StepInfo = { number: 100, name: '100-test.js', path: '/path', fn: async () => {} }
    const featureError = new FeatureError(originalError.message, originalError, step, {}, 500)

    sendErrorResponse(featureError, req, res, true)

    const body = JSON.parse(res._body!) as ErrorResponse
    expect(body.error.stack).toBeDefined()
    expect(body.error.stack).toContain('Original error')
  })

  it('should not send response if headers already sent', () => {
    const req = createMockRequest()
    const res = createMockResponse()
    res.headersSent = true
    const error = new Error('Test error')

    sendErrorResponse(error, req, res)

    expect(res._body).toBeUndefined()
  })
})

describe('Error Handler - defaultErrorHandler', () => {
  let consoleErrorSpy: any
  let originalEnv: string | undefined

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    originalEnv = process.env.NODE_ENV
  })

  afterEach(() => {
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
