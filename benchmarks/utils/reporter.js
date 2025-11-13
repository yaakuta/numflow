/**
 * Benchmark results output and saving
 */

const fs = require('fs')
const path = require('path')

/**
 * Print comprehensive comparison table
 * @param {Array} results - Benchmark results array
 * @param {Array} scenarios - Scenario array
 */
function printComparisonTable(results, scenarios) {
  console.log('\n' + '='.repeat(120))
  console.log('Comprehensive Benchmark Results Comparison')
  console.log('='.repeat(120))
  console.log(
    '\n| # | Scenario | Numflow | Express | Fastify | vs Express | vs Fastify |'
  )
  console.log(
    '|---|----------|---------|---------|---------|-----------|-----------|'
  )

  const groupedResults = {}
  results.forEach((r) => {
    if (!groupedResults[r.scenario]) {
      groupedResults[r.scenario] = {}
    }
    groupedResults[r.scenario][r.server] = r
  })

  let index = 1
  let totalNumflow = 0
  let totalExpress = 0
  let totalFastify = 0
  let count = 0

  Object.entries(groupedResults).forEach(([scenario, servers]) => {
    const numflow = servers.Numflow?.requestsPerSec || 0
    const express = servers.Express?.requestsPerSec || 0
    const fastify = servers.Fastify?.requestsPerSec || 0

    const vsExpress =
      express > 0 ? ((numflow - express) / express) * 100 : 0
    const vsFastify =
      fastify > 0 ? ((numflow - fastify) / fastify) * 100 : 0

    const numflowStr = numflow > 0 ? `**${Math.round(numflow).toLocaleString()}**` : '-'
    const expressStr = express > 0 ? Math.round(express).toLocaleString() : '-'
    const fastifyStr = fastify > 0 ? Math.round(fastify).toLocaleString() : '-'
    const vsExpressStr =
      express > 0
        ? `**${vsExpress >= 0 ? '+' : ''}${vsExpress.toFixed(0)}%** ${vsExpress >= 0 ? '✅' : '❌'}`
        : '-'
    const vsFastifyStr =
      fastify > 0
        ? `**${vsFastify >= 0 ? '+' : ''}${vsFastify.toFixed(0)}%** ${vsFastify >= 0 ? '✅' : '❌'}`
        : '-'

    console.log(
      `| ${index++} | ${scenario} | ${numflowStr} | ${expressStr} | ${fastifyStr} | ${vsExpressStr} | ${vsFastifyStr} |`
    )

    if (numflow > 0 && express > 0 && fastify > 0) {
      totalNumflow += numflow
      totalExpress += express
      totalFastify += fastify
      count++
    }
  })

  if (count > 0) {
    const avgNumflow = totalNumflow / count
    const avgExpress = totalExpress / count
    const avgFastify = totalFastify / count
    const avgVsExpress = ((avgNumflow - avgExpress) / avgExpress) * 100
    const avgVsFastify = ((avgNumflow - avgFastify) / avgFastify) * 100

    console.log(
      `| | **Overall Average** | **${Math.round(avgNumflow).toLocaleString()}** | ${Math.round(avgExpress).toLocaleString()} | ${Math.round(avgFastify).toLocaleString()} | **${avgVsExpress >= 0 ? '+' : ''}${avgVsExpress.toFixed(0)}%** 🎉 | **${avgVsFastify >= 0 ? '+' : ''}${avgVsFastify.toFixed(0)}%** |`
    )
  }

  console.log('\n' + '='.repeat(120))
}

/**
 * Print Feature-First results table
 * @param {Array} results - Feature-First benchmark results array
 */
function printFeatureResults(results) {
  console.log('\n' + '='.repeat(100))
  console.log('Feature-First Benchmark Results')
  console.log('='.repeat(100))
  console.log(
    '\n| Scenario | Requests/sec | Latency (ms) | Throughput (MB/s) |'
  )
  console.log('|----------|--------------|--------------|-------------------|')

  results.forEach((r) => {
    const throughputMB = (r.throughput / 1024 / 1024).toFixed(2)
    console.log(
      `| ${r.scenario} | ${Math.round(r.requestsPerSec).toLocaleString()} | ${r.latency.toFixed(2)} | ${throughputMB} |`
    )
  })

  // Overhead analysis
  const regularRoute = results.find((r) =>
    r.scenario.includes('Regular Route')
  )
  const feature10 = results.find((r) => r.scenario.includes('10 Steps'))
  const feature50 = results.find((r) => r.scenario.includes('50 Steps'))

  console.log('\n' + '='.repeat(100))
  console.log('Feature-First Overhead Analysis')
  console.log('='.repeat(100))

  if (feature10 && regularRoute) {
    const overhead =
      ((regularRoute.requestsPerSec - feature10.requestsPerSec) /
        regularRoute.requestsPerSec) *
      100
    console.log(`\n[Feature (10 Steps) vs Regular Route]`)
    console.log(
      `  Feature (10 Steps): ${Math.round(feature10.requestsPerSec).toLocaleString()} req/s`
    )
    console.log(
      `  Regular Route: ${Math.round(regularRoute.requestsPerSec).toLocaleString()} req/s`
    )
    console.log(`  Overhead: ${overhead.toFixed(2)}%`)
  }

  if (feature10 && feature50) {
    const diff =
      ((feature10.requestsPerSec - feature50.requestsPerSec) /
        feature10.requestsPerSec) *
      100
    console.log(`\n[10 Steps vs 50 Steps]`)
    console.log(
      `  10 Steps: ${Math.round(feature10.requestsPerSec).toLocaleString()} req/s`
    )
    console.log(
      `  50 Steps: ${Math.round(feature50.requestsPerSec).toLocaleString()} req/s`
    )
    console.log(`  Difference: ${diff.toFixed(2)}%`)
  }

  console.log('\n' + '='.repeat(100))
}

/**
 * Save results
 * @param {Array} results - Benchmark results array
 * @param {Object} config - Benchmark configuration
 * @param {string} filename - Filename (optional)
 */
function saveResults(results, config, filename) {
  const resultsDir = path.join(__dirname, '../results')
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true })
  }

  const timestamp = new Date().toISOString()
  const output = {
    timestamp,
    duration: config.duration,
    connections: config.connections,
    results,
  }

  // Save timestamped file
  if (filename) {
    const filePath = path.join(resultsDir, filename)
    fs.writeFileSync(filePath, JSON.stringify(output, null, 2))
    console.log(`\nResults saved: ${filePath}`)
  }

  // Always update latest.json
  const latestPath = path.join(resultsDir, 'latest.json')
  fs.writeFileSync(latestPath, JSON.stringify(output, null, 2))
  console.log(`Latest results updated: ${latestPath}`)
}

module.exports = {
  printComparisonTable,
  printFeatureResults,
  saveResults,
}
