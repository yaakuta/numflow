#!/usr/bin/env node

/**
 * Numflow Comprehensive Benchmark
 *
 * Performance comparison: Numflow vs Express vs Fastify
 * - General route benchmarks (7 scenarios)
 * - Feature-First benchmarks (3 scenarios)
 *
 * Usage:
 *   node benchmarks/index.js
 *   npm run benchmark (requires script in package.json)
 */

const path = require('path')
const { BASIC_SCENARIOS, FEATURE_SCENARIOS } = require('./utils/scenarios')
const { startServer, runBenchmark, sleep } = require('./utils/runner')
const { printComparisonTable, printFeatureResults, saveResults } = require('./utils/reporter')
const { runRegressionTest, printRegressionResults } = require('./utils/regression-test')

// Benchmark configuration
const DURATION = 10 // seconds
const CONNECTIONS = 100
const WARMUP_TIME = 3000 // ms

// Server configuration
const SERVERS = {
  numflow: {
    script: path.join(__dirname, 'servers/numflow.js'),
    port: 4000,
    name: 'Numflow',
  },
  express: {
    script: path.join(__dirname, 'servers/express.js'),
    port: 4001,
    name: 'Express',
  },
  fastify: {
    script: path.join(__dirname, 'servers/fastify.js'),
    port: 4002,
    name: 'Fastify',
  },
}

/**
 * Validate fixtures
 */
async function validateFixtures() {
  const { main: validateMain } = require('./fixtures/validate-fixtures')
  console.log('🔍 Validating fixtures before benchmark...\n')
  try {
    await validateMain()
    console.log()
  } catch (error) {
    console.error('\n❌ Fixture validation failed!')
    console.error('   Please run: node benchmarks/fixtures/generate-steps.js')
    throw error
  }
}

/**
 * Main function
 */
async function main() {
  console.log('=' .repeat(60))
  console.log('Numflow Comprehensive Benchmark')
  console.log('='.repeat(60))
  console.log(`\nConfiguration: ${CONNECTIONS} connections, ${DURATION}s duration\n`)

  const servers = {}
  const allResults = []

  try {
    // 0. Validate fixtures (required before benchmark!)
    await validateFixtures()

    // 1. Start all servers
    console.log('Starting servers...')
    for (const [key, config] of Object.entries(SERVERS)) {
      console.log(`  Starting ${config.name}...`)
      servers[key] = await startServer(config)
    }

    console.log(`\nWarmup (${WARMUP_TIME}ms)...\n`)
    await sleep(WARMUP_TIME)

    // 2. General route benchmarks
    console.log('=' .repeat(60))
    console.log('Running General Route Benchmarks...')
    console.log('='.repeat(60))

    for (const scenario of BASIC_SCENARIOS) {
      for (const [key, config] of Object.entries(SERVERS)) {
        const url = `http://localhost:${config.port}${scenario.path}`
        console.log(
          `\n[${config.name}] ${scenario.name} - ${scenario.method} ${scenario.path}`
        )

        const result = await runBenchmark(url, scenario, config.name, {
          connections: CONNECTIONS,
          duration: DURATION,
        })
        allResults.push(result)

        console.log(
          `  ✓ ${Math.round(result.requestsPerSec).toLocaleString()} req/s, ${result.latency.toFixed(2)}ms latency`
        )

        await sleep(1000) // Wait for server stabilization
      }
    }

    // 3. Feature-First benchmarks (Numflow only)
    console.log('\n\n' + '='.repeat(60))
    console.log('Running Feature-First Benchmarks...')
    console.log('='.repeat(60))

    for (const scenario of FEATURE_SCENARIOS) {
      const config = SERVERS.numflow
      const url = `http://localhost:${config.port}${scenario.path}`
      console.log(
        `\n[${config.name}] ${scenario.name} - ${scenario.method} ${scenario.path}`
      )

      const result = await runBenchmark(url, scenario, config.name, {
        connections: CONNECTIONS,
        duration: DURATION,
      })
      allResults.push(result)

      console.log(
        `  ✓ ${Math.round(result.requestsPerSec).toLocaleString()} req/s, ${result.latency.toFixed(2)}ms latency`
      )

      await sleep(1000)
    }

    // 4. Print results
    const basicResults = allResults.filter((r) =>
      BASIC_SCENARIOS.some((s) => s.name === r.scenario)
    )
    const featureResults = allResults.filter((r) =>
      FEATURE_SCENARIOS.some((s) => s.name === r.scenario)
    )

    printComparisonTable(basicResults, BASIC_SCENARIOS)
    printFeatureResults(featureResults)

    // 5. Save results
    saveResults(
      allResults,
      { duration: DURATION, connections: CONNECTIONS },
      `comprehensive-${Date.now()}.json`
    )

    // 6. Regression test (compare with baseline)
    const baselinePath = path.join(__dirname, 'results', 'baseline.json')
    const latestPath = path.join(__dirname, 'results', 'latest.json')
    const regressionResult = runRegressionTest(baselinePath, latestPath)
    printRegressionResults(regressionResult)
  } catch (error) {
    console.error('\n❌ Error during benchmark execution:', error)
    process.exit(1)
  } finally {
    // 7. Stop all servers
    console.log('\nStopping servers...')
    for (const [key, server] of Object.entries(servers)) {
      if (server) {
        server.kill()
      }
    }
    console.log('✅ Complete!\n')
  }
}

// Execute
if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
}

module.exports = { main }
