/**
 * Basic Feature integration test
 * Tests Feature functionality using inject() for fast, reliable testing
 */

import numflow from '../../src/index'

describe('Feature Basic Integration', () => {
  it('Feature should respond with basic step execution', async () => {
    const app = numflow()

    // Simple Feature without middlewares
    app.use(numflow.feature({
      method: 'GET',
      path: '/api/test',
      steps: './test/__fixtures__/feature-integration/basic-steps',
    }))

    // Use inject() for fast testing without server startup
    const response = await app.inject({
      method: 'GET',
      url: '/api/test',
    })

    expect(response.statusCode).toBe(200)
    const body = JSON.parse(response.payload)
    expect(body.success).toBe(true)
  })
})
