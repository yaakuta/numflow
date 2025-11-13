/**
 * Simple load generation script (K6 alternative)
 *
 * Continuously sends HTTP requests to put load on the server.
 *
 * Usage:
 *   node load-generator.js
 */

const http = require('http')

// Configuration
const TARGET_URL = 'http://localhost:3000'
const CONCURRENT_REQUESTS = 50 // Number of concurrent requests
const REQUEST_INTERVAL = 100 // ms - interval between requests
const DURATION = 6 * 60 * 60 * 1000 // 6 hours (ms)

// Statistics
let stats = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  totalResponseTime: 0,
  minResponseTime: Infinity,
  maxResponseTime: 0,
  startTime: Date.now(),

  // Statistics by feature
  health: { count: 0, success: 0, totalTime: 0 },
  users: { count: 0, success: 0, totalTime: 0 },
  orders: { count: 0, success: 0, totalTime: 0 },
}

// Scenario weights (similar to K6)
const scenarios = [
  { name: 'health', method: 'GET', path: '/api/health', weight: 10 },
  { name: 'users', method: 'POST', path: '/api/users', weight: 45 },
  { name: 'orders', method: 'POST', path: '/api/orders', weight: 45 },
]

// Calculate cumulative weights
let cumulativeWeights = []
let sum = 0
scenarios.forEach(s => {
  sum += s.weight
  cumulativeWeights.push(sum)
})

// Select scenario (weight-based)
function selectScenario() {
  const rand = Math.random() * sum
  for (let i = 0; i < scenarios.length; i++) {
    if (rand <= cumulativeWeights[i]) {
      return scenarios[i]
    }
  }
  return scenarios[0]
}

// Send HTTP request
function sendRequest(scenario) {
  const startTime = Date.now()
  stats.totalRequests++
  stats[scenario.name].count++

  let postData = ''
  if (scenario.method === 'POST') {
    if (scenario.name === 'users') {
      postData = JSON.stringify({
        name: `Load Test User ${Math.floor(Math.random() * 100000)}`,
        email: `loadtest-${Math.floor(Math.random() * 100000)}@example.com`,
      })
    } else if (scenario.name === 'orders') {
      postData = JSON.stringify({
        userId: Math.floor(Math.random() * 1000) + 1,
        productId: Math.floor(Math.random() * 3) + 1,
        quantity: Math.floor(Math.random() * 10) + 1,
      })
    }
  }

  const options = {
    hostname: 'localhost',
    port: 3000,
    path: scenario.path,
    method: scenario.method,
    headers: scenario.method === 'POST' ? {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
    } : {},
  }

  const req = http.request(options, (res) => {
    let data = ''

    res.on('data', (chunk) => {
      data += chunk
    })

    res.on('end', () => {
      const responseTime = Date.now() - startTime

      if (res.statusCode >= 200 && res.statusCode < 300) {
        stats.successfulRequests++
        stats[scenario.name].success++
      } else {
        stats.failedRequests++
      }

      stats.totalResponseTime += responseTime
      stats[scenario.name].totalTime += responseTime
      stats.minResponseTime = Math.min(stats.minResponseTime, responseTime)
      stats.maxResponseTime = Math.max(stats.maxResponseTime, responseTime)
    })
  })

  req.on('error', (error) => {
    stats.failedRequests++
    console.error(`Request error (${scenario.name}):`, error.message)
  })

  if (postData) {
    req.write(postData)
  }
  req.end()
}

// Start load generator
let activeWorkers = 0
const startLoad = () => {
  console.log(`\n🚀 Starting load generation`)
  console.log(`   Target:         ${TARGET_URL}`)
  console.log(`   Concurrent:     ${CONCURRENT_REQUESTS}`)
  console.log(`   Interval:       ${REQUEST_INTERVAL}ms`)
  console.log(`   Estimated end:  ${new Date(Date.now() + DURATION).toLocaleString('en-US')}\n`)

  // Start workers
  for (let i = 0; i < CONCURRENT_REQUESTS; i++) {
    setTimeout(() => {
      activeWorkers++
      runWorker(i)
    }, i * 50) // Distribute start time
  }
}

// Worker (continuously sends requests)
function runWorker(workerId) {
  const interval = setInterval(() => {
    // Check end time
    if (Date.now() - stats.startTime >= DURATION) {
      clearInterval(interval)
      activeWorkers--

      if (activeWorkers === 0) {
        printFinalReport()
        process.exit(0)
      }
      return
    }

    const scenario = selectScenario()
    sendRequest(scenario)
  }, REQUEST_INTERVAL)
}

// Print statistics (every 30 seconds)
setInterval(() => {
  const elapsed = (Date.now() - stats.startTime) / 1000
  const avgResponseTime = stats.totalRequests > 0 ? stats.totalResponseTime / stats.totalRequests : 0
  const requestsPerSec = stats.totalRequests / elapsed
  const successRate = stats.totalRequests > 0 ? (stats.successfulRequests / stats.totalRequests * 100) : 0

  console.clear()
  console.log('═══════════════════════════════════════════════════════════')
  console.log(`📊 Load Generation Statistics (${Math.floor(elapsed / 60)}m ${Math.floor(elapsed % 60)}s elapsed)`)
  console.log('═══════════════════════════════════════════════════════════')
  console.log(`\n📈 Overall Statistics:`)
  console.log(`   Total Requests:  ${stats.totalRequests.toLocaleString()}`)
  console.log(`   Success:         ${stats.successfulRequests.toLocaleString()} (${successRate.toFixed(2)}%)`)
  console.log(`   Failed:          ${stats.failedRequests.toLocaleString()}`)
  console.log(`   Throughput:      ${requestsPerSec.toFixed(1)} req/sec`)

  console.log(`\n⏱️  Response Time:`)
  console.log(`   Average:         ${avgResponseTime.toFixed(2)} ms`)
  console.log(`   Min:             ${stats.minResponseTime === Infinity ? 'N/A' : stats.minResponseTime + ' ms'}`)
  console.log(`   Max:             ${stats.maxResponseTime} ms`)

  console.log(`\n📦 By Scenario:`)
  scenarios.forEach(s => {
    const scenarioStats = stats[s.name]
    const avgTime = scenarioStats.count > 0 ? scenarioStats.totalTime / scenarioStats.count : 0
    const successRate = scenarioStats.count > 0 ? (scenarioStats.success / scenarioStats.count * 100) : 0
    console.log(`   ${s.name.padEnd(8)} - ${scenarioStats.count.toLocaleString().padStart(8)} requests, ${avgTime.toFixed(1).padStart(6)} ms avg, ${successRate.toFixed(1)}% success`)
  })

  const remaining = DURATION - (Date.now() - stats.startTime)
  const remainingMin = Math.floor(remaining / 60000)
  const remainingSec = Math.floor((remaining % 60000) / 1000)
  console.log(`\n⏰ Time Remaining: ${remainingMin}m ${remainingSec}s`)
  console.log('═══════════════════════════════════════════════════════════')
}, 30000)

// Final report
function printFinalReport() {
  const elapsed = (Date.now() - stats.startTime) / 1000
  const avgResponseTime = stats.totalRequests > 0 ? stats.totalResponseTime / stats.totalRequests : 0
  const requestsPerSec = stats.totalRequests / elapsed
  const successRate = stats.totalRequests > 0 ? (stats.successfulRequests / stats.totalRequests * 100) : 0

  console.log('\n\n═══════════════════════════════════════════════════════════')
  console.log('📊 Final Report')
  console.log('═══════════════════════════════════════════════════════════')
  console.log(`\n⏱️  Test Duration: ${Math.floor(elapsed / 60)}m ${Math.floor(elapsed % 60)}s`)
  console.log(`\n📈 Overall Statistics:`)
  console.log(`   Total Requests:  ${stats.totalRequests.toLocaleString()}`)
  console.log(`   Success:         ${stats.successfulRequests.toLocaleString()} (${successRate.toFixed(2)}%)`)
  console.log(`   Failed:          ${stats.failedRequests.toLocaleString()}`)
  console.log(`   Throughput:      ${requestsPerSec.toFixed(1)} req/sec`)

  console.log(`\n⏱️  Response Time:`)
  console.log(`   Average:         ${avgResponseTime.toFixed(2)} ms`)
  console.log(`   Min:             ${stats.minResponseTime} ms`)
  console.log(`   Max:             ${stats.maxResponseTime} ms`)

  console.log(`\n📦 By Scenario:`)
  scenarios.forEach(s => {
    const scenarioStats = stats[s.name]
    const avgTime = scenarioStats.count > 0 ? scenarioStats.totalTime / scenarioStats.count : 0
    const successRate = scenarioStats.count > 0 ? (scenarioStats.success / scenarioStats.count * 100) : 0
    console.log(`   ${s.name}:`)
    console.log(`     Requests:      ${scenarioStats.count.toLocaleString()}`)
    console.log(`     Success:       ${scenarioStats.success.toLocaleString()} (${successRate.toFixed(2)}%)`)
    console.log(`     Avg Response:  ${avgTime.toFixed(2)} ms`)
  })

  console.log('\n═══════════════════════════════════════════════════════════')
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n⚠️  Received stop signal. Generating final report...')
  printFinalReport()
  process.exit(0)
})

// Start
startLoad()
