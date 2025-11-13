/**
 * Benchmark regression test
 *
 * Detects performance degradation by comparing latest benchmark results with baseline.
 */

const fs = require('fs')
const path = require('path')

// Acceptable performance degradation thresholds
const THRESHOLDS = {
  // Warn if Feature-First overhead increases by 20% or more
  featureOverhead: 0.2, // 20%

  // Warn if individual scenario performance degrades by 30% or more
  scenarioPerformance: 0.3, // 30%

  // Warn if overall average performance degrades by 20% or more
  overallPerformance: 0.2, // 20%
}

/**
 * Calculate Feature-First overhead
 */
function calculateFeatureOverhead(results) {
  const feature10 = results.find((r) => r.scenario === 'Feature-First (10 Steps)')
  const regular = results.find((r) => r.scenario === 'Regular Route (Comparison)')

  if (!feature10 || !regular) {
    return null
  }

  return (regular.requestsPerSec - feature10.requestsPerSec) / regular.requestsPerSec
}

/**
 * Compare performance by scenario
 */
function compareScenarios(baseline, current) {
  const warnings = []

  for (const currentResult of current) {
    const baselineResult = baseline.find((r) => r.scenario === currentResult.scenario)

    if (!baselineResult) {
      continue
    }

    const performanceChange =
      (currentResult.requestsPerSec - baselineResult.requestsPerSec) /
      baselineResult.requestsPerSec

    // If performance degraded beyond threshold
    if (performanceChange < -THRESHOLDS.scenarioPerformance) {
      warnings.push({
        type: 'scenario',
        scenario: currentResult.scenario,
        baseline: baselineResult.requestsPerSec,
        current: currentResult.requestsPerSec,
        change: performanceChange,
      })
    }
  }

  return warnings
}

/**
 * Compare Feature-First overhead
 */
function compareFeatureOverhead(baseline, current) {
  const baselineOverhead = calculateFeatureOverhead(baseline)
  const currentOverhead = calculateFeatureOverhead(current)

  if (baselineOverhead === null || currentOverhead === null) {
    return null
  }

  // Calculate overhead increase rate
  const overheadIncrease = (currentOverhead - baselineOverhead) / baselineOverhead

  if (overheadIncrease > THRESHOLDS.featureOverhead) {
    return {
      type: 'overhead',
      baseline: baselineOverhead,
      current: currentOverhead,
      increase: overheadIncrease,
    }
  }

  return null
}

/**
 * Compare overall average performance
 */
function compareOverallPerformance(baseline, current) {
  const baselineAvg =
    baseline.reduce((sum, r) => sum + r.requestsPerSec, 0) / baseline.length
  const currentAvg = current.reduce((sum, r) => sum + r.requestsPerSec, 0) / current.length

  const performanceChange = (currentAvg - baselineAvg) / baselineAvg

  if (performanceChange < -THRESHOLDS.overallPerformance) {
    return {
      type: 'overall',
      baseline: baselineAvg,
      current: currentAvg,
      change: performanceChange,
    }
  }

  return null
}

/**
 * Run regression test
 */
function runRegressionTest(baselinePath, currentPath) {
  // Read baseline file
  if (!fs.existsSync(baselinePath)) {
    console.log('⚠️  Baseline not found. Skipping regression test.')
    console.log(`   Create baseline: cp ${currentPath} ${baselinePath}`)
    return { passed: true, warnings: [] }
  }

  const baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf-8'))
  const current = JSON.parse(fs.readFileSync(currentPath, 'utf-8'))

  const warnings = []

  // 1. Compare Feature-First overhead
  const overheadWarning = compareFeatureOverhead(baseline.results, current.results)
  if (overheadWarning) {
    warnings.push(overheadWarning)
  }

  // 2. Compare performance by scenario
  const scenarioWarnings = compareScenarios(baseline.results, current.results)
  warnings.push(...scenarioWarnings)

  // 3. Compare overall average performance
  const overallWarning = compareOverallPerformance(baseline.results, current.results)
  if (overallWarning) {
    warnings.push(overallWarning)
  }

  return {
    passed: warnings.length === 0,
    warnings,
    baseline: baseline.timestamp,
    current: current.timestamp,
  }
}

/**
 * Print results
 */
function printRegressionResults(result) {
  if (result.passed) {
    console.log('\n✅ Regression test PASSED')
    console.log('   No significant performance degradation detected.')
    return
  }

  console.log('\n⚠️  Regression test WARNING')
  console.log(
    `   Baseline: ${new Date(result.baseline).toLocaleString()} vs Current: ${new Date(result.current).toLocaleString()}`
  )
  console.log()

  for (const warning of result.warnings) {
    if (warning.type === 'overhead') {
      console.log('  🔴 Feature-First Overhead Increase:')
      console.log(`     Baseline: ${(warning.baseline * 100).toFixed(2)}%`)
      console.log(`     Current:  ${(warning.current * 100).toFixed(2)}%`)
      console.log(`     Increase: ${(warning.increase * 100).toFixed(2)}%`)
    } else if (warning.type === 'scenario') {
      console.log(`  🔴 Scenario Performance Drop: ${warning.scenario}`)
      console.log(`     Baseline: ${Math.round(warning.baseline).toLocaleString()} req/s`)
      console.log(`     Current:  ${Math.round(warning.current).toLocaleString()} req/s`)
      console.log(`     Change:   ${(warning.change * 100).toFixed(2)}%`)
    } else if (warning.type === 'overall') {
      console.log('  🔴 Overall Performance Drop:')
      console.log(`     Baseline: ${Math.round(warning.baseline).toLocaleString()} req/s`)
      console.log(`     Current:  ${Math.round(warning.current).toLocaleString()} req/s`)
      console.log(`     Change:   ${(warning.change * 100).toFixed(2)}%`)
    }
    console.log()
  }

  console.log('⚠️  Please investigate the performance degradation!')
}

module.exports = {
  runRegressionTest,
  printRegressionResults,
  calculateFeatureOverhead,
}
