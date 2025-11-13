/**
 * Benchmark scenario definitions
 */

/**
 * General route benchmark scenarios
 * Supported by Numflow, Express, and Fastify
 */
const BASIC_SCENARIOS = [
  {
    name: 'Hello World',
    method: 'GET',
    path: '/',
  },
  {
    name: 'JSON Response (GET)',
    method: 'GET',
    path: '/json',
  },
  {
    name: 'JSON Parse (POST)',
    method: 'POST',
    path: '/users',
    body: { name: 'John Doe', email: 'john@example.com' },
  },
  {
    name: 'Route Parameters (single)',
    method: 'GET',
    path: '/users/123',
  },
  {
    name: 'Route Parameters (multiple)',
    method: 'GET',
    path: '/users/123/posts/456',
  },
  {
    name: 'Route + Query',
    method: 'GET',
    path: '/search?q=test&page=1&limit=10',
  },
  {
    name: 'Middleware Chain (4 middlewares)',
    method: 'GET',
    path: '/middleware-chain',
  },
]

/**
 * Feature-First dedicated benchmark scenarios
 * Numflow only
 */
const FEATURE_SCENARIOS = [
  {
    name: 'Feature-First (10 Steps)',
    method: 'POST',
    path: '/api/feature-10-steps',
    body: { test: 'data' },
    onlyNumflow: true,
  },
  {
    name: 'Feature-First (50 Steps)',
    method: 'POST',
    path: '/api/feature-50-steps',
    body: { test: 'data' },
    onlyNumflow: true,
  },
  {
    name: 'Regular Route (Comparison)',
    method: 'POST',
    path: '/api/regular-route',
    body: { test: 'data' },
    onlyNumflow: true,
  },
]

module.exports = {
  BASIC_SCENARIOS,
  FEATURE_SCENARIOS,
}
