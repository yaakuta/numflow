/**
 * Real-time monitoring script
 *
 * Periodically collects server memory, CPU, and performance metrics.
 *
 * Usage:
 *   node monitor.js
 *
 * Use with PM2:
 *   pm2 start app.js --name soak-test
 *   node monitor.js --pid $(pm2 pid soak-test)
 */

const v8 = require('v8');
const os = require('os');
const fs = require('fs');
const path = require('path');

// Configuration
const INTERVAL = 10000; // Collect every 10 seconds
const OUTPUT_FILE = path.join(__dirname, 'monitor-results.jsonl');

// Initialization
let startTime = Date.now();
let initialMemory = process.memoryUsage();
let initialCpu = process.cpuUsage();

// Create results file
fs.writeFileSync(OUTPUT_FILE, '', 'utf8');
console.log(`📊 Monitoring started. Results: ${OUTPUT_FILE}\n`);

// Event Loop Lag measurement
let lastCheck = Date.now();
let eventLoopLag = 0;

setInterval(() => {
  const now = Date.now();
  eventLoopLag = now - lastCheck - INTERVAL;
  lastCheck = now;
}, INTERVAL);

// Collect metrics
setInterval(() => {
  const uptime = (Date.now() - startTime) / 1000; // seconds
  const memUsage = process.memoryUsage();
  const cpuUsage = process.cpuUsage();
  const heapStats = v8.getHeapStatistics();
  const systemMem = {
    total: os.totalmem(),
    free: os.freemem(),
  };

  // Calculate memory growth rate
  const heapGrowth = memUsage.heapUsed - initialMemory.heapUsed;
  const heapGrowthRate = heapGrowth / uptime; // bytes per second

  const metrics = {
    timestamp: new Date().toISOString(),
    uptime: uptime.toFixed(0) + ' sec',

    // Memory
    memory: {
      rss: (memUsage.rss / 1024 / 1024).toFixed(2) + ' MB',
      heapUsed: (memUsage.heapUsed / 1024 / 1024).toFixed(2) + ' MB',
      heapTotal: (memUsage.heapTotal / 1024 / 1024).toFixed(2) + ' MB',
      external: (memUsage.external / 1024 / 1024).toFixed(2) + ' MB',
      arrayBuffers: (memUsage.arrayBuffers / 1024 / 1024).toFixed(2) + ' MB',

      // Memory growth rate
      heapGrowth: (heapGrowth / 1024 / 1024).toFixed(2) + ' MB',
      heapGrowthRate: (heapGrowthRate / 1024).toFixed(2) + ' KB/sec',
    },

    // Heap statistics
    heap: {
      totalHeapSize: (heapStats.total_heap_size / 1024 / 1024).toFixed(2) + ' MB',
      usedHeapSize: (heapStats.used_heap_size / 1024 / 1024).toFixed(2) + ' MB',
      heapSizeLimit: (heapStats.heap_size_limit / 1024 / 1024).toFixed(2) + ' MB',
      usedPercent: ((heapStats.used_heap_size / heapStats.heap_size_limit) * 100).toFixed(2) + '%',

      // Heap space details
      mallocedMemory: (heapStats.malloced_memory / 1024 / 1024).toFixed(2) + ' MB',
      peakMallocedMemory: (heapStats.peak_malloced_memory / 1024 / 1024).toFixed(2) + ' MB',
    },

    // CPU
    cpu: {
      user: (cpuUsage.user / 1000000).toFixed(2) + ' sec',
      system: (cpuUsage.system / 1000000).toFixed(2) + ' sec',

      // CPU usage rate (per second)
      userRate: ((cpuUsage.user - initialCpu.user) / uptime / 1000000).toFixed(2) + ' sec/sec',
      systemRate: ((cpuUsage.system - initialCpu.system) / uptime / 1000000).toFixed(2) + ' sec/sec',
    },

    // System memory
    system: {
      totalMemory: (systemMem.total / 1024 / 1024 / 1024).toFixed(2) + ' GB',
      freeMemory: (systemMem.free / 1024 / 1024 / 1024).toFixed(2) + ' GB',
      usedMemory: ((systemMem.total - systemMem.free) / 1024 / 1024 / 1024).toFixed(2) + ' GB',
      usedPercent: (((systemMem.total - systemMem.free) / systemMem.total) * 100).toFixed(2) + '%',
    },

    // Event Loop
    eventLoop: {
      lag: eventLoopLag + ' ms',
    },
  };

  // Console output
  console.clear();
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`📊 Monitoring (Uptime: ${metrics.uptime})`);
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`\n💾 Memory:`);
  console.log(`   RSS:              ${metrics.memory.rss}`);
  console.log(`   Heap Used:        ${metrics.memory.heapUsed} / ${metrics.memory.heapTotal}`);
  console.log(`   Heap Limit:       ${metrics.heap.heapSizeLimit} (${metrics.heap.usedPercent} used)`);
  console.log(`   Heap Growth:      ${metrics.memory.heapGrowth} (${metrics.memory.heapGrowthRate})`);

  console.log(`\n🔥 CPU:`);
  console.log(`   User Time:        ${metrics.cpu.user}`);
  console.log(`   System Time:      ${metrics.cpu.system}`);
  console.log(`   User Rate:        ${metrics.cpu.userRate}`);

  console.log(`\n🌐 System:`);
  console.log(`   Memory Used:      ${metrics.system.usedMemory} / ${metrics.system.totalMemory} (${metrics.system.usedPercent})`);

  console.log(`\n⚡ Event Loop:`);
  console.log(`   Lag:              ${metrics.eventLoop.lag}`);

  // ⚠️ Warnings
  const warnings = [];

  // Memory leak warning
  const heapUsedMB = parseFloat(metrics.memory.heapUsed);
  const heapLimitMB = parseFloat(metrics.heap.heapSizeLimit);
  if (heapUsedMB > heapLimitMB * 0.9) {
    warnings.push('⚠️  Memory usage > 90% of heap limit!');
  }

  // Memory growth rate warning (>1MB/min)
  const growthRate = parseFloat(metrics.memory.heapGrowthRate);
  if (growthRate > 1024 / 60) {
    warnings.push(`⚠️  High heap growth rate: ${metrics.memory.heapGrowthRate}`);
  }

  // Event Loop Lag warning
  if (eventLoopLag > 100) {
    warnings.push(`⚠️  High event loop lag: ${eventLoopLag}ms`);
  }

  if (warnings.length > 0) {
    console.log(`\n⚠️  Warnings:`);
    warnings.forEach(w => console.log(`   ${w}`));
  }

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log(`📝 Logs: ${OUTPUT_FILE}`);

  // Save to file in JSONL format
  const rawMetrics = {
    timestamp: metrics.timestamp,
    uptime,
    memory: {
      rss: memUsage.rss,
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
      external: memUsage.external,
      heapGrowth,
      heapGrowthRate,
    },
    heap: {
      totalHeapSize: heapStats.total_heap_size,
      usedHeapSize: heapStats.used_heap_size,
      heapSizeLimit: heapStats.heap_size_limit,
      usedPercent: (heapStats.used_heap_size / heapStats.heap_size_limit) * 100,
    },
    cpu: {
      user: cpuUsage.user,
      system: cpuUsage.system,
    },
    eventLoop: {
      lag: eventLoopLag,
    },
  };

  fs.appendFileSync(OUTPUT_FILE, JSON.stringify(rawMetrics) + '\n', 'utf8');

}, INTERVAL);

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n✅ Monitoring stopped. Results saved to:', OUTPUT_FILE);
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\n✅ Monitoring stopped. Results saved to:', OUTPUT_FILE);
  process.exit(0);
});
