/**
 * Error Handling Documentation Scenarios Tests
 *
 * 문서(docs/ko/getting-started/error-handling.md)에서 설명하는
 * 모든 에러 핸들링 시나리오가 실제로 동작하는지 검증합니다.
 *
 * TDD: RED phase - 문서 기반 시나리오 테스트 작성
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals'
import numflow from '../src/index.js'
import { FeatureError, StepInfo } from '../src/feature/types.js'

describe('문서 시나리오: 기본 에러 처리', () => {
  let consoleErrorSpy: any

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
  })

  it('statusCode 없이 에러를 던지면 500으로 처리됨', async () => {
    const app = numflow()

    app.get('/users/:id', () => {
      throw new Error('User not found') // 500 에러로 처리됨
    })

    const response = await app.inject({ method: 'GET', url: '/users/123' })
    expect(response.statusCode).toBe(500)

    const body = JSON.parse(response.payload)
    expect(body.error.message).toBe('User not found')
    expect(body.error.statusCode).toBe(500)
  })

  it('statusCode 지정 시 해당 상태 코드로 응답', async () => {
    const app = numflow()

    app.get('/users/:id', () => {
      const error = new Error('User not found') as Error & { statusCode: number }
      error.statusCode = 404 // 404로 응답
      throw error
    })

    const response = await app.inject({ method: 'GET', url: '/users/123' })
    expect(response.statusCode).toBe(404)

    const body = JSON.parse(response.payload)
    expect(body.error.message).toBe('User not found')
    expect(body.error.statusCode).toBe(404)
  })
})

describe('문서 시나리오: 글로벌 에러 핸들러 (Express 스타일)', () => {
  let consoleErrorSpy: any

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
  })

  it('Express 스타일 에러 미들웨어로 모든 에러 처리', async () => {
    const app = numflow()

    app.get('/error', () => {
      const err = new Error('Test error') as Error & { statusCode: number }
      err.statusCode = 400
      throw err
    })

    // 글로벌 에러 핸들러 (Express 스타일, 4개의 매개변수)
    app.use((err: any, _req: any, res: any, _next: any) => {
      const statusCode = err.statusCode || 500

      res.status(statusCode).json({
        success: false,
        error: err.message
      })
    })

    const response = await app.inject({ method: 'GET', url: '/error' })
    expect(response.statusCode).toBe(400)

    const body = JSON.parse(response.payload)
    expect(body.success).toBe(false)
    expect(body.error).toBe('Test error')
  })

  it('에러 미들웨어는 정확히 4개의 매개변수가 필요', async () => {
    const app = numflow()
    const errorHandlerCalled = jest.fn()
    const regularMiddlewareCalled = jest.fn()

    app.get('/error', () => {
      throw new Error('Test error')
    })

    // 3개 매개변수 = 일반 미들웨어 (에러 핸들러 아님)
    app.use((_req: any, _res: any, next: any) => {
      regularMiddlewareCalled()
      next()
    })

    // 4개 매개변수 = 에러 미들웨어
    app.use((_err: any, _req: any, res: any, _next: any) => {
      errorHandlerCalled()
      res.status(500).json({ handled: true })
    })

    await app.inject({ method: 'GET', url: '/error' })

    // 에러 미들웨어만 호출됨
    expect(errorHandlerCalled).toHaveBeenCalled()
  })

  it('validationErrors, code 등 추가 속성 사용', async () => {
    const app = numflow()

    app.post('/users', () => {
      const error = new Error('검증 실패') as any
      error.statusCode = 400
      error.validationErrors = {
        email: ['유효한 이메일을 입력하세요'],
        password: ['비밀번호는 8자 이상이어야 합니다']
      }
      throw error
    })

    app.use((err: any, _req: any, res: any, _next: any) => {
      const statusCode = err.statusCode || 500

      res.status(statusCode).json({
        success: false,
        error: err.message,
        ...(err.validationErrors && { validationErrors: err.validationErrors }),
        ...(err.code && { code: err.code })
      })
    })

    const response = await app.inject({
      method: 'POST',
      url: '/users',
      headers: { 'Content-Type': 'application/json' },
      payload: '{}'
    })

    expect(response.statusCode).toBe(400)

    const body = JSON.parse(response.payload)
    expect(body.error).toBe('검증 실패')
    expect(body.validationErrors).toEqual({
      email: ['유효한 이메일을 입력하세요'],
      password: ['비밀번호는 8자 이상이어야 합니다']
    })
  })

  it('비즈니스 에러 코드 (code) 사용', async () => {
    const app = numflow()

    app.post('/orders', () => {
      const error = new Error('재고가 부족합니다') as any
      error.statusCode = 400
      error.code = 'OUT_OF_STOCK'
      throw error
    })

    app.use((err: any, _req: any, res: any, _next: any) => {
      const statusCode = err.statusCode || 500

      res.status(statusCode).json({
        success: false,
        error: err.message,
        ...(err.code && { code: err.code })
      })
    })

    const response = await app.inject({
      method: 'POST',
      url: '/orders',
      headers: { 'Content-Type': 'application/json' },
      payload: '{}'
    })

    expect(response.statusCode).toBe(400)

    const body = JSON.parse(response.payload)
    expect(body.error).toBe('재고가 부족합니다')
    expect(body.code).toBe('OUT_OF_STOCK')
  })
})

describe('문서 시나리오: FeatureError와 Step 정보', () => {
  let consoleErrorSpy: any

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
  })

  it('FeatureError의 step 정보 접근', async () => {
    const app = numflow()
    let capturedStep: any = null

    app.post('/orders', () => {
      // Feature에서 에러 발생 시 FeatureError로 래핑됨 (시뮬레이션)
      const stepInfo: StepInfo = {
        number: 300,
        name: '300-check-stock.js',
        path: '/path/to/step',
        fn: async () => {}
      }
      const originalError = new Error('Out of stock')
      const featureError = new FeatureError(
        originalError.message,
        originalError,
        stepInfo,
        {},
        400
      )
      throw featureError
    })

    // 에러 미들웨어에서 Step 정보 확인
    app.use((err: any, _req: any, res: any, _next: any) => {
      // FeatureError인 경우 step 정보 포함
      if (err.step) {
        capturedStep = err.step
      }

      const statusCode = err.statusCode || 500
      res.status(statusCode).json({
        error: err.message,
        ...(err.step && { step: { number: err.step.number, name: err.step.name } })
      })
    })

    const response = await app.inject({
      method: 'POST',
      url: '/orders',
      headers: { 'Content-Type': 'application/json' },
      payload: '{}'
    })

    // Step 정보 검증 (문서의 예시와 동일)
    expect(capturedStep).not.toBeNull()
    expect(capturedStep.number).toBe(300)
    expect(capturedStep.name).toBe('300-check-stock.js')

    const body = JSON.parse(response.payload)
    expect(body.error).toBe('Out of stock')
    expect(body.step).toEqual({
      number: 300,
      name: '300-check-stock.js'
    })
  })

  it('FeatureError의 originalError 접근', async () => {
    const app = numflow()
    let capturedOriginalError: any = null

    app.post('/users', () => {
      // 원본 에러에 커스텀 속성 추가
      const originalError = new Error('Validation failed') as any
      originalError.statusCode = 400
      originalError.code = 'VALIDATION_ERROR'
      originalError.validationErrors = { email: ['Invalid email format'] }

      // FeatureError로 래핑
      const stepInfo: StepInfo = {
        number: 100,
        name: '100-validate.js',
        path: '/path',
        fn: async () => {}
      }
      const featureError = new FeatureError(
        originalError.message,
        originalError,
        stepInfo,
        {},
        originalError.statusCode
      )
      throw featureError
    })

    app.use((err: any, _req: any, res: any, _next: any) => {
      // 원본 에러 직접 접근
      const originalError = err.originalError || err
      capturedOriginalError = originalError

      // 원본 에러의 커스텀 속성 접근
      const statusCode = originalError.statusCode || 500
      const code = originalError.code

      res.status(statusCode).json({
        error: originalError.message,
        ...(code && { code }),
        ...(originalError.validationErrors && { validationErrors: originalError.validationErrors })
      })
    })

    const response = await app.inject({
      method: 'POST',
      url: '/users',
      headers: { 'Content-Type': 'application/json' },
      payload: '{}'
    })

    expect(response.statusCode).toBe(400)

    const body = JSON.parse(response.payload)
    expect(body.error).toBe('Validation failed')
    expect(body.code).toBe('VALIDATION_ERROR')
    expect(body.validationErrors).toEqual({ email: ['Invalid email format'] })

    // originalError 확인
    expect(capturedOriginalError).not.toBeNull()
    expect(capturedOriginalError.code).toBe('VALIDATION_ERROR')
  })
})

describe('문서 시나리오: 개발 vs 프로덕션', () => {
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

  it('개발 환경에서는 에러 메시지와 스택 포함', async () => {
    process.env.NODE_ENV = 'development'

    const app = numflow()
    const isProd = process.env.NODE_ENV === 'production'

    app.get('/error', () => {
      throw new Error('Test error')
    })

    app.use((err: any, _req: any, res: any, _next: any) => {
      const statusCode = err.statusCode || 500

      res.status(statusCode).json({
        success: false,
        error: isProd ? 'Internal Server Error' : err.message,
        // 개발 환경에서만 스택 포함
        ...(!isProd && { stack: err.stack })
      })
    })

    const response = await app.inject({ method: 'GET', url: '/error' })

    const body = JSON.parse(response.payload)
    expect(body.error).toBe('Test error') // 실제 메시지
    expect(body.stack).toBeDefined() // 스택 포함
  })

  it('프로덕션 환경에서는 일반 메시지만 반환', async () => {
    process.env.NODE_ENV = 'production'

    const app = numflow()
    const isProd = process.env.NODE_ENV === 'production'

    app.get('/error', () => {
      throw new Error('Sensitive error details')
    })

    app.use((err: any, _req: any, res: any, _next: any) => {
      const statusCode = err.statusCode || 500

      res.status(statusCode).json({
        success: false,
        error: isProd ? 'Internal Server Error' : err.message,
        // 프로덕션에서는 스택 미포함
        ...(!isProd && { stack: err.stack })
      })
    })

    const response = await app.inject({ method: 'GET', url: '/error' })

    const body = JSON.parse(response.payload)
    expect(body.error).toBe('Internal Server Error') // 일반 메시지
    expect(body.stack).toBeUndefined() // 스택 미포함
  })
})

describe('문서 시나리오: 에러 처리 흐름 검증', () => {
  let consoleErrorSpy: any

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
  })

  it('next(error)로 에러 미들웨어에 에러 전달', async () => {
    const app = numflow()

    // 일반 미들웨어에서 next(error) 호출
    app.use((req: any, _res: any, next: any) => {
      if (req.url === '/error-next') {
        next(new Error('Error via next'))
        return
      }
      next()
    })

    app.get('/error-next', (_req: any, res: any) => {
      res.json({ message: 'Should not reach here' })
    })

    // 에러 미들웨어
    app.use((err: Error, _req: any, res: any, _next: any) => {
      res.status(500).json({ caught: err.message })
    })

    const response = await app.inject({ method: 'GET', url: '/error-next' })
    expect(response.statusCode).toBe(500)

    const body = JSON.parse(response.payload)
    expect(body.caught).toBe('Error via next')
  })

  it('throw error로 에러 미들웨어에 에러 전달', async () => {
    const app = numflow()

    app.get('/throw', () => {
      throw new Error('Thrown error')
    })

    app.use((err: Error, _req: any, res: any, _next: any) => {
      res.status(500).json({ caught: err.message })
    })

    const response = await app.inject({ method: 'GET', url: '/throw' })
    expect(response.statusCode).toBe(500)

    const body = JSON.parse(response.payload)
    expect(body.caught).toBe('Thrown error')
  })

  it('async 핸들러에서 에러 발생 시 에러 미들웨어로 전달', async () => {
    const app = numflow()

    app.get('/async-error', async () => {
      await Promise.resolve()
      throw new Error('Async error')
    })

    app.use((err: Error, _req: any, res: any, _next: any) => {
      res.status(500).json({ caught: err.message })
    })

    const response = await app.inject({ method: 'GET', url: '/async-error' })
    expect(response.statusCode).toBe(500)

    const body = JSON.parse(response.payload)
    expect(body.caught).toBe('Async error')
  })

  it('여러 에러 미들웨어가 있을 때 next(err)로 다음 에러 미들웨어 호출', async () => {
    const app = numflow()
    const firstHandler = jest.fn()
    const secondHandler = jest.fn()

    app.get('/error', () => {
      throw new Error('Test error')
    })

    // 첫 번째 에러 미들웨어 - next(err)로 다음 에러 미들웨어로 전달
    app.use((err: Error, _req: any, _res: any, next: any) => {
      firstHandler()
      next(err)
    })

    // 두 번째 에러 미들웨어 - 실제 응답
    app.use((_err: Error, _req: any, res: any, _next: any) => {
      secondHandler()
      res.status(500).json({ handled: 'by second' })
    })

    await app.inject({ method: 'GET', url: '/error' })

    expect(firstHandler).toHaveBeenCalled()
    expect(secondHandler).toHaveBeenCalled()
  })
})

describe('문서 시나리오: 커스텀 에러 클래스', () => {
  let consoleErrorSpy: any

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
  })

  // 커스텀 에러 클래스 정의 (문서 예시)
  class PaymentError extends Error {
    statusCode = 402
    transactionId: string
    reason: string
    refundable: boolean

    constructor(
      message: string,
      { transactionId, reason, refundable = false }: { transactionId: string; reason: string; refundable?: boolean }
    ) {
      super(message)
      this.name = 'PaymentError'
      this.transactionId = transactionId
      this.reason = reason
      this.refundable = refundable
    }
  }

  class ValidationError extends Error {
    statusCode = 400
    validationErrors: Record<string, string[]>

    constructor(message: string, errors: Record<string, string[]> = {}) {
      super(message)
      this.name = 'ValidationError'
      this.validationErrors = errors
    }
  }

  it('PaymentError 사용', async () => {
    const app = numflow()

    app.post('/payments', () => {
      throw new PaymentError('결제 실패', {
        transactionId: 'tx_12345',
        reason: 'insufficient_funds',
        refundable: false
      })
    })

    app.use((err: any, _req: any, res: any, _next: any) => {
      const statusCode = err.statusCode || 500

      const response: any = {
        success: false,
        error: {
          type: err.name,
          message: err.message
        }
      }

      if (err.transactionId) response.error.transactionId = err.transactionId
      if (err.reason) response.error.reason = err.reason

      res.status(statusCode).json(response)
    })

    const response = await app.inject({
      method: 'POST',
      url: '/payments',
      headers: { 'Content-Type': 'application/json' },
      payload: '{}'
    })

    expect(response.statusCode).toBe(402)

    const body = JSON.parse(response.payload)
    expect(body.error.type).toBe('PaymentError')
    expect(body.error.transactionId).toBe('tx_12345')
    expect(body.error.reason).toBe('insufficient_funds')
  })

  it('ValidationError 사용', async () => {
    const app = numflow()

    app.post('/users', () => {
      throw new ValidationError('검증 실패', {
        email: ['유효한 이메일을 입력하세요'],
        password: ['비밀번호는 8자 이상이어야 합니다']
      })
    })

    app.use((err: any, _req: any, res: any, _next: any) => {
      const statusCode = err.statusCode || 500

      const response: any = {
        success: false,
        error: {
          type: err.name,
          message: err.message
        }
      }

      if (err.validationErrors) response.error.fields = err.validationErrors

      res.status(statusCode).json(response)
    })

    const response = await app.inject({
      method: 'POST',
      url: '/users',
      headers: { 'Content-Type': 'application/json' },
      payload: '{}'
    })

    expect(response.statusCode).toBe(400)

    const body = JSON.parse(response.payload)
    expect(body.error.type).toBe('ValidationError')
    expect(body.error.fields).toEqual({
      email: ['유효한 이메일을 입력하세요'],
      password: ['비밀번호는 8자 이상이어야 합니다']
    })
  })
})
