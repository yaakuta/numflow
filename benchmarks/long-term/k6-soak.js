/**
 * k6 Soak Test Script
 *
 * Detects memory leaks and performance degradation while maintaining constant load for 6 hours.
 *
 * How to run:
 *   k6 run k6-soak.js
 *
 * Save results to file:
 *   k6 run --out json=results.json k6-soak.js
 */

import http from 'k6/http';
import { sleep, check } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('error_rate');
const successfulRequests = new Counter('successful_requests');
const responseTime = new Trend('custom_response_time');

// Test configuration
export let options = {
  stages: [
    // Warm-up: 10 minutes
    { duration: '10m', target: 100 },

    // Main load: 5 hours 40 minutes
    { duration: '5h40m', target: 100 },

    // Cool down: 10 minutes
    { duration: '10m', target: 0 },
  ],

  // Performance thresholds (SLA)
  thresholds: {
    // HTTP request failure rate < 1%
    'http_req_failed': ['rate<0.01'],

    // Response time
    'http_req_duration': [
      'p(95)<250',  // P95 < 250ms
      'p(99)<600',  // P99 < 600ms
    ],

    // Custom metrics
    'error_rate': ['rate<0.005'],  // Error rate < 0.5%
  },

  // Other settings
  noConnectionReuse: false,
  userAgent: 'K6SoakTest/1.0',
};

// Execute once at test start
export function setup() {
  console.log('🚀 Starting 6-hour Soak Test');
  console.log(`⏰ Test will run until: ${new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString()}`);

  // Health check
  let res = http.get('http://localhost:3000/health');
  if (res.status !== 200) {
    throw new Error('Server is not healthy!');
  }

  return { startTime: Date.now() };
}

// Function executed repeatedly by each VU
export default function (data) {
  // Scenario 1: Health Check (10%)
  if (Math.random() < 0.1) {
    let res = http.get('http://localhost:3000/health');
    let success = check(res, {
      'health status is 200': (r) => r.status === 200,
    });

    errorRate.add(!success);
    if (success) successfulRequests.add(1);
    responseTime.add(res.timings.duration);

    sleep(1);
    return;
  }

  // Scenario 2: GET / (40%)
  if (Math.random() < 0.4) {
    let res = http.get('http://localhost:3000/');
    let success = check(res, {
      'home status is 200': (r) => r.status === 200,
    });

    errorRate.add(!success);
    if (success) successfulRequests.add(1);
    responseTime.add(res.timings.duration);

    sleep(2);
    return;
  }

  // Scenario 3: GET /api/users (40%)
  if (Math.random() < 0.8) {
    let res = http.get('http://localhost:3000/api/users');
    let success = check(res, {
      'api status is 200': (r) => r.status === 200,
      'api returns json': (r) => r.headers['Content-Type'] && r.headers['Content-Type'].includes('application/json'),
    });

    errorRate.add(!success);
    if (success) successfulRequests.add(1);
    responseTime.add(res.timings.duration);

    sleep(3);
    return;
  }

  // Scenario 4: POST /api/users (10%)
  let payload = JSON.stringify({
    name: `K6 User ${Math.floor(Math.random() * 10000)}`,
    email: `k6-${Math.floor(Math.random() * 10000)}@test.com`,
  });

  let params = {
    headers: { 'Content-Type': 'application/json' },
  };

  let res = http.post('http://localhost:3000/api/users', payload, params);
  let success = check(res, {
    'post status is 200 or 201': (r) => r.status === 200 || r.status === 201,
  });

  errorRate.add(!success);
  if (success) successfulRequests.add(1);
  responseTime.add(res.timings.duration);

  sleep(5);
}

// Execute once at test end
export function teardown(data) {
  const duration = (Date.now() - data.startTime) / 1000 / 60; // minutes
  console.log(`\n✅ Soak Test completed after ${duration.toFixed(2)} minutes`);
}
