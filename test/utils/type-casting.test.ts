/**
 * Type Casting tests
 *
 * Tests type casting functions in src/utils/type-casting.ts
 */

import {
  asInternalRequest,
  asInternalResponse,
  asInternalSocket,
  asInternalRouter,
  asInternalError,
  castTo,
  setField,
  getField,
  getFieldSafe,
} from '../../src/utils/type-casting'

describe('Type Casting', () => {
  describe('asInternalRequest', () => {
    it('should cast object to InternalRequest', () => {
      const req = { url: '/test', method: 'GET' }
      const internalReq = asInternalRequest(req)

      expect(internalReq).toBe(req)

      // Can add InternalRequest fields
      internalReq.params = { id: '123' }
      internalReq.query = { search: 'test' }

      expect(internalReq.params).toEqual({ id: '123' })
      expect(internalReq.query).toEqual({ search: 'test' })
    })
  })

  describe('asInternalResponse', () => {
    it('should cast object to InternalResponse', () => {
      const res = { statusCode: 200, setHeader: jest.fn() }
      const internalRes = asInternalResponse(res)

      expect(internalRes).toBe(res)

      // Can add InternalResponse fields
      internalRes.req = { url: '/test' } as any
      internalRes.app = {} as any

      expect(internalRes.req).toBeDefined()
      expect(internalRes.app).toBeDefined()
    })
  })

  describe('asInternalSocket', () => {
    it('should cast object to InternalSocket', () => {
      const socket = { remoteAddress: '127.0.0.1' }
      const internalSocket = asInternalSocket(socket)

      expect(internalSocket).toBe(socket)
      expect(internalSocket.remoteAddress).toBe('127.0.0.1')
    })

    it('should be able to access encrypted field', () => {
      const socket = { encrypted: true, remoteAddress: '127.0.0.1' }
      const internalSocket = asInternalSocket(socket)

      expect(internalSocket.encrypted).toBe(true)
    })
  })

  describe('asInternalRouter', () => {
    it('should cast object to InternalRouter', () => {
      const router = {
        get: jest.fn(),
        post: jest.fn(),
      }
      const internalRouter = asInternalRouter(router)

      expect(internalRouter).toBe(router)

      // Can call dynamic methods
      expect(internalRouter['get']).toBe(router.get)
      expect(internalRouter['post']).toBe(router.post)
    })
  })

  describe('asInternalError', () => {
    it('should cast Error object to InternalError', () => {
      const error = new Error('Test error')
      const internalError = asInternalError(error)

      expect(internalError).toBe(error)
      expect(internalError.message).toBe('Test error')
    })

    it('should be able to access InternalError fields', () => {
      const error = new Error('Test error')
      ;(error as any).statusCode = 404
      ;(error as any).code = 'ERR_NOT_FOUND'

      const internalError = asInternalError(error)

      expect(internalError.statusCode).toBe(404)
      expect(internalError.code).toBe('ERR_NOT_FOUND')
    })
  })

  describe('castTo', () => {
    it('should cast any value to specific type', () => {
      const value: any = { name: 'John', age: 30 }
      const user = castTo<{ name: string; age: number }>(value)

      expect(user.name).toBe('John')
      expect(user.age).toBe(30)
    })

    it('should be able to cast to various types', () => {
      expect(castTo<string>('test')).toBe('test')
      expect(castTo<number>(123)).toBe(123)
      expect(castTo<boolean>(true)).toBe(true)
    })
  })

  describe('setField', () => {
    it('should add field to object', () => {
      const obj: any = { existing: 'value' }

      setField(obj, 'newField', 'newValue')

      expect(obj.newField).toBe('newValue')
      expect(obj.existing).toBe('value')
    })

    it('should be able to add values of various types', () => {
      const obj: any = {}

      setField(obj, 'string', 'value')
      setField(obj, 'number', 123)
      setField(obj, 'boolean', true)
      setField(obj, 'object', { nested: 'value' })
      setField(obj, 'array', [1, 2, 3])

      expect(obj.string).toBe('value')
      expect(obj.number).toBe(123)
      expect(obj.boolean).toBe(true)
      expect(obj.object).toEqual({ nested: 'value' })
      expect(obj.array).toEqual([1, 2, 3])
    })

    it('should be able to overwrite existing field', () => {
      const obj: any = { field: 'old' }

      setField(obj, 'field', 'new')

      expect(obj.field).toBe('new')
    })
  })

  describe('getField', () => {
    it('should get field from object', () => {
      const obj = { name: 'John', age: 30 }

      const name = getField<string>(obj, 'name')
      const age = getField<number>(obj, 'age')

      expect(name).toBe('John')
      expect(age).toBe(30)
    })

    it('should return undefined for non-existent field', () => {
      const obj = { name: 'John' }

      const missing = getField<string>(obj, 'missing')

      expect(missing).toBeUndefined()
    })

    it('should be able to get nested object field', () => {
      const obj = { user: { name: 'John', profile: { age: 30 } } }

      const user = getField<any>(obj, 'user')

      expect(user).toBeDefined()
      expect(user.name).toBe('John')
    })
  })

  describe('getFieldSafe', () => {
    it('should safely get field from object', () => {
      const obj = { name: 'John', age: 30 }

      const name = getFieldSafe<string>(obj, 'name')
      const age = getFieldSafe<number>(obj, 'age')

      expect(name).toBe('John')
      expect(age).toBe(30)
    })

    it('should return undefined for non-existent field', () => {
      const obj = { name: 'John' }

      const missing = getFieldSafe<string>(obj, 'missing')

      expect(missing).toBeUndefined()
    })

    it('should return undefined for null object', () => {
      const result = getFieldSafe<string>(null, 'field')

      expect(result).toBeUndefined()
    })

    it('should return undefined for undefined object', () => {
      const result = getFieldSafe<string>(undefined, 'field')

      expect(result).toBeUndefined()
    })

    it('should return undefined for primitive values', () => {
      expect(getFieldSafe<string>('string', 'field')).toBeUndefined()
      expect(getFieldSafe<string>(123, 'field')).toBeUndefined()
      expect(getFieldSafe<string>(true, 'field')).toBeUndefined()
    })

    it('should check field existence using in operator', () => {
      const obj = { field: undefined }

      // When field exists but is undefined
      const result = getFieldSafe<any>(obj, 'field')

      expect(result).toBeUndefined()
    })
  })
})
