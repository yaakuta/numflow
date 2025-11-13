/**
 * Feature Retry mechanism tests
 */

import { retry, RETRY } from '../src/feature/index.js'

describe('Feature Retry', () => {
  it('should export retry function', () => {
    expect(retry).toBeDefined()
    expect(typeof retry).toBe('function')
  })

  it('should export RETRY symbol', () => {
    expect(RETRY).toBeDefined()
    expect(typeof RETRY).toBe('symbol')
  })

  it('retry() without options should return RETRY symbol', () => {
    const result = retry()
    expect(result).toBe(RETRY)
  })

  it('retry() with delay should return RetrySignal object', () => {
    const result = retry({ delay: 1000 })
    expect(result).toHaveProperty('__retry', true)
    expect(result).toHaveProperty('delay', 1000)
  })

  it('retry() with maxAttempts should return RetrySignal object', () => {
    const result = retry({ maxAttempts: 3 })
    expect(result).toHaveProperty('__retry', true)
    expect(result).toHaveProperty('maxAttempts', 3)
  })

  it('retry() with both options should return RetrySignal object', () => {
    const result = retry({ delay: 2000, maxAttempts: 5 })
    expect(result).toHaveProperty('__retry', true)
    expect(result).toHaveProperty('delay', 2000)
    expect(result).toHaveProperty('maxAttempts', 5)
  })
})
