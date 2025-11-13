/**
 * AsyncWrapper unit tests

 */

import { asyncWrapper, isAsyncFunction, returnsPromise } from '../../src/utils/async-wrapper.js'
import { Request, Response, NextFunction } from '../../src/types/index.js'

describe('AsyncWrapper', () => {
  let mockReq: Partial<Request>
  let mockRes: Partial<Response>
  let mockNext: jest.Mock<NextFunction>

  beforeEach(() => {
    mockReq = {}
    mockRes = {}
    mockNext = jest.fn()
  })

  describe('asyncWrapper()', () => {
    it('should work correctly even when wrapping synchronous handler', () => {
      const handler = jest.fn((_req, _res, next) => {
        next()
      })

      const wrapped = asyncWrapper(handler)
      wrapped(mockReq as Request, mockRes as Response, mockNext)

      expect(handler).toHaveBeenCalledWith(mockReq, mockRes, expect.any(Function))
      expect(mockNext).toHaveBeenCalledWith()
    })

    it('should work correctly even when wrapping asynchronous handler', async () => {
      const handler = jest.fn(async (_req, _res, next) => {
        await new Promise(resolve => setTimeout(resolve, 10))
        next()
      })

      const wrapped = asyncWrapper(handler)
      wrapped(mockReq as Request, mockRes as Response, mockNext)

      // Wait until async task completes
      await new Promise(resolve => setTimeout(resolve, 20))

      expect(handler).toHaveBeenCalled()
      expect(mockNext).toHaveBeenCalledWith()
    })

    it('should catch synchronous error and pass to next(error)', () => {
      const testError = new Error('Sync error')
      const handler = jest.fn(() => {
        throw testError
      })

      const wrapped = asyncWrapper(handler)
      wrapped(mockReq as Request, mockRes as Response, mockNext)

      expect(handler).toHaveBeenCalled()
      expect(mockNext).toHaveBeenCalledWith(testError)
    })

    it('should catch asynchronous error and pass to next(error)', async () => {
      const testError = new Error('Async error')
      const handler = jest.fn(async () => {
        await new Promise(resolve => setTimeout(resolve, 10))
        throw testError
      })

      const wrapped = asyncWrapper(handler)
      wrapped(mockReq as Request, mockRes as Response, mockNext)

      // Wait until async task completes
      await new Promise(resolve => setTimeout(resolve, 20))

      expect(handler).toHaveBeenCalled()
      expect(mockNext).toHaveBeenCalledWith(testError)
    })

    it('should catch Promise.reject and pass to next(error)', async () => {
      const testError = new Error('Promise rejection')
      const handler = jest.fn(() => {
        return Promise.reject(testError)
      })

      const wrapped = asyncWrapper(handler)
      wrapped(mockReq as Request, mockRes as Response, mockNext)

      // Wait until async task completes
      await new Promise(resolve => setTimeout(resolve, 20))

      expect(handler).toHaveBeenCalled()
      expect(mockNext).toHaveBeenCalledWith(testError)
    })

    it('should work correctly even when handler does not call next() if no error occurs', () => {
      const handler = jest.fn((_req, _res) => {
        // Do nothing without calling next() (normal case)
      })

      const wrapped = asyncWrapper(handler)
      wrapped(mockReq as Request, mockRes as Response, mockNext)

      expect(handler).toHaveBeenCalled()
      // next() does not need to be called
      expect(mockNext).not.toHaveBeenCalled()
    })

    it('should work like normal function if handler does not return Promise', () => {
      const handler = jest.fn((_req, _res, next) => {
        next()
        return undefined // Not a Promise
      })

      const wrapped = asyncWrapper(handler)
      wrapped(mockReq as Request, mockRes as Response, mockNext)

      expect(handler).toHaveBeenCalled()
      expect(mockNext).toHaveBeenCalledWith()
    })
  })

  describe('isAsyncFunction()', () => {
    it('should identify async function', () => {
      const asyncFn = async () => {}
      expect(isAsyncFunction(asyncFn)).toBe(true)
    })

    it('should identify that normal function is not async', () => {
      const normalFn = () => {}
      expect(isAsyncFunction(normalFn)).toBe(false)
    })

    it('should identify that function returning Promise is also not async', () => {
      const promiseFn = () => Promise.resolve()
      expect(isAsyncFunction(promiseFn)).toBe(false)
    })
  })

  describe('returnsPromise()', () => {
    it('should identify function returning Promise', () => {
      const promiseFn = () => Promise.resolve()
      expect(returnsPromise(promiseFn)).toBe(true)
    })

    it('should identify that async function also returns Promise', () => {
      const asyncFn = async () => {}
      expect(returnsPromise(asyncFn)).toBe(true)
    })

    it('should identify that function returning normal value is not Promise', () => {
      const normalFn = () => 'value'
      expect(returnsPromise(normalFn)).toBe(false)
    })

    it('should identify that function throwing error is not Promise', () => {
      const errorFn = () => {
        throw new Error('Test error')
      }
      expect(returnsPromise(errorFn)).toBe(false)
    })
  })
})
