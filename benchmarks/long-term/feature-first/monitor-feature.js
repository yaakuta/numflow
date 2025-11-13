/**
 * Feature-First dedicated monitoring script
 *
 * Collects Feature-First specific metrics:
 * - Step execution count
 * - Async Task completion rate
 * - Transaction commit/rollback
 * - Estimated Context memory usage
 *
 * Usage:
 *   node monitor-feature.js
 */

const http = require('http')
const fs = require('fs')
const path = require('path')

const INTERVAL = 10000 // 10 seconds
const OUTPUT_FILE = path.join(__dirname, 'feature-metrics.jsonl')
const API_URL = 'http://localhost:3000/api/health'

// Initialize
fs.writeFileSync(OUTPUT_FILE, '', 'utf8')
console.log(`📊 Feature-First monitoring started\n`)
console.log(`📝 Output: ${OUTPUT_FILE}\n`)

let previousMetrics = null

setInterval(async () => {
  try {
    // Fetch metrics from Health API
    const response = await fetch(API_URL)
    const data = await response.json()

    const now = new Date()
    const metrics = {
      timestamp: now.toISOString(),
      uptime: data.uptime,
      memory: data.memory,
      featureFirst: data.featureFirst,
    }

    // Calculate rates
    if (previousMetrics) {
      const timeDiff =
        (now - new Date(previousMetrics.timestamp)) / 1000 // seconds

      metrics.rates = {
        stepsPerSec:
          (metrics.featureFirst.totalStepsExecuted -
            previousMetrics.featureFirst.totalStepsExecuted) /
          timeDiff,
        asyncTasksPerSec:
          (metrics.featureFirst.asyncTasksCompleted -
            previousMetrics.featureFirst.asyncTasksCompleted) /
          timeDiff,
        transactionsPerSec:
          (metrics.featureFirst.transactionsCommitted -
            previousMetrics.featureFirst.transactionsCommitted) /
          timeDiff,
      }

      // Async Task success rate
      const totalAsyncTasks =
        metrics.featureFirst.asyncTasksCompleted +
        metrics.featureFirst.asyncTasksFailed
      metrics.asyncTaskSuccessRate =
        totalAsyncTasks > 0
          ? (
              (metrics.featureFirst.asyncTasksCompleted / totalAsyncTasks) *
              100
            ).toFixed(2) + '%'
          : 'N/A'

      // Transaction success rate
      const totalTransactions =
        metrics.featureFirst.transactionsCommitted +
        metrics.featureFirst.transactionsRolledBack
      metrics.transactionSuccessRate =
        totalTransactions > 0
          ? (
              (metrics.featureFirst.transactionsCommitted /
                totalTransactions) *
              100
            ).toFixed(2) + '%'
          : 'N/A'
    }

    // Console output
    console.clear()
    console.log('═══════════════════════════════════════════════════════════')
    console.log(
      `📊 Feature-First Monitoring (${now.toLocaleTimeString('en-US')})`
    )
    console.log('═══════════════════════════════════════════════════════════')

    console.log(`\n⏱️  Uptime: ${metrics.uptime}`)

    console.log(`\n💾 Memory:`)
    console.log(`   RSS:         ${metrics.memory.rss}`)
    console.log(`   Heap Used:   ${metrics.memory.heapUsed}`)

    console.log(`\n📦 Feature-First Metrics:`)
    console.log(
      `   Steps Executed:              ${metrics.featureFirst.totalStepsExecuted.toLocaleString()}`
    )
    console.log(
      `   Async Tasks Completed:       ${metrics.featureFirst.asyncTasksCompleted.toLocaleString()}`
    )
    console.log(
      `   Async Tasks Failed:          ${metrics.featureFirst.asyncTasksFailed.toLocaleString()}`
    )
    console.log(
      `   Transactions Committed:      ${metrics.featureFirst.transactionsCommitted.toLocaleString()}`
    )
    console.log(
      `   Transactions Rolled Back:    ${metrics.featureFirst.transactionsRolledBack.toLocaleString()}`
    )

    if (metrics.rates) {
      console.log(`\n📈 Throughput (last ${INTERVAL / 1000}s):`)
      console.log(`   Steps:           ${metrics.rates.stepsPerSec.toFixed(1)}/sec`)
      console.log(
        `   Async Tasks:     ${metrics.rates.asyncTasksPerSec.toFixed(1)}/sec`
      )
      console.log(
        `   Transactions:    ${metrics.rates.transactionsPerSec.toFixed(1)}/sec`
      )

      console.log(`\n✅ Success Rates:`)
      console.log(`   Async Tasks:     ${metrics.asyncTaskSuccessRate}`)
      console.log(`   Transactions:    ${metrics.transactionSuccessRate}`)
    }

    console.log(`\n💼 Data:`)
    console.log(`   Users:       ${metrics.featureFirst.users.toLocaleString()}`)
    console.log(`   Orders:      ${metrics.featureFirst.orders.toLocaleString()}`)

    // Warnings
    const warnings = []

    if (metrics.featureFirst.asyncTasksFailed > 0) {
      warnings.push(
        `⚠️  Async Task failures: ${metrics.featureFirst.asyncTasksFailed}`
      )
    }

    if (metrics.featureFirst.transactionsRolledBack > 0) {
      warnings.push(
        `⚠️  Transaction rollbacks: ${metrics.featureFirst.transactionsRolledBack}`
      )
    }

    // Estimated Context memory usage (very rough estimate)
    const estimatedContextSize =
      metrics.featureFirst.totalStepsExecuted * 500 // average 500 bytes per step context
    if (estimatedContextSize > 100 * 1024 * 1024) {
      // 100MB
      warnings.push(
        `⚠️  High estimated Context memory usage: ${(estimatedContextSize / 1024 / 1024).toFixed(2)} MB`
      )
    }

    if (warnings.length > 0) {
      console.log(`\n⚠️  Warnings:`)
      warnings.forEach((w) => console.log(`   ${w}`))
    }

    console.log('\n═══════════════════════════════════════════════════════════')
    console.log(`📝 Log: ${OUTPUT_FILE}`)

    // Save to file
    fs.appendFileSync(OUTPUT_FILE, JSON.stringify(metrics) + '\n', 'utf8')

    previousMetrics = metrics
  } catch (error) {
    console.error('❌ Metrics collection failed:', error.message)
  }
}, INTERVAL)

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n✅ Monitoring stopped. Results:', OUTPUT_FILE)
  process.exit(0)
})

process.on('SIGTERM', () => {
  console.log('\n\n✅ Monitoring stopped. Results:', OUTPUT_FILE)
  process.exit(0)
})
