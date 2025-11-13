# Long-term Stability and Performance Testing

Test suite for verifying long-term operational stability and performance of the Numflow framework.

## 📋 Test Types

| File | Tool | Duration | Purpose |
|------|------|----------|---------|
| `1hour-load.yml` | Artillery | 1 hour | Normal load testing |
| `6hour-soak.yml` | Artillery | 6 hours | Memory leak detection |
| `k6-soak.js` | k6 | 6 hours | Performance degradation monitoring |
| `monitor.js` | Node.js | - | Real-time metrics collection |

---

## 🚀 Quick Start

### 1. Install Tools

```bash
# Artillery (recommended)
npm install -g artillery

# k6 (optional)
# macOS
brew install k6

# Linux
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

### 2. Prepare Test Server

```bash
# From Numflow root directory
cd /Users/seunghyunpaek/__dev/_numbers

# Run simple test server (using examples)
cd examples/01-getting-started
node 03-json-api.js &

# Or run with PM2 (easier to monitor)
npm install -g pm2
pm2 start examples/01-getting-started/03-json-api.js --name test-server
```

### 3. Run Tests

```bash
cd benchmarks/long-term

# 1-hour load test
artillery run 1hour-load.yml

# 6-hour soak test
artillery run 6hour-soak.yml

# 6-hour soak test with k6
k6 run k6-soak.js
```

---

## 📊 Monitoring

### Method 1: Using monitor.js (Recommended)

```bash
# Terminal 1: Start monitoring
node monitor.js

# Terminal 2: Run test
artillery run 6hour-soak.yml
```

**Example Output**:
```
═══════════════════════════════════════════════════════════
📊 Monitoring (Uptime: 3600 sec)
═══════════════════════════════════════════════════════════

💾 Memory:
   RSS:              156.23 MB
   Heap Used:        89.45 MB / 120.00 MB
   Heap Limit:       2048.00 MB (4.37% used)
   Heap Growth:      12.34 MB (0.20 KB/sec)

🔥 CPU:
   User Time:        45.67 sec
   System Time:      8.90 sec
   User Rate:        0.01 sec/sec

🌐 System:
   Memory Used:      8.45 GB / 16.00 GB (52.81%)

⚡ Event Loop:
   Lag:              5 ms

═══════════════════════════════════════════════════════════
📝 Logs: /path/to/monitor-results.jsonl
```

### Method 2: PM2 Monitoring

```bash
# Start server with PM2
pm2 start app.js --name soak-test

# Real-time monitoring
pm2 monit

# Check metrics
pm2 describe soak-test

# View logs
pm2 logs soak-test
```

---

## 📈 Results Analysis

### Artillery Results

Results are automatically displayed after test completion:

```
All VUs finished. Total time: 1 hour 0 minutes 0 seconds

Summary report @ 14:23:45(+0900)
──────────────────────────────────────────────────────────

http.codes.200: ............................ 180000
http.request_rate: ......................... 50/sec
http.requests: ............................. 180000
http.response_time:
  min: ..................................... 5
  max: ..................................... 456
  mean: .................................... 45.3
  median: .................................. 42
  p95: ..................................... 89.2
  p99: ..................................... 145.6
http.responses: ............................ 180000
vusers.completed: .......................... 180000
vusers.created: ............................ 180000
vusers.created_by_name.Mixed Workload: .... 180000
vusers.failed: ............................. 0
vusers.session_length:
  min: ..................................... 2345.6
  max: ..................................... 8901.2
  mean: .................................... 4567.8
  median: .................................. 4321.5
  p95: ..................................... 7890.1
  p99: ..................................... 8456.3
```

**Analysis Points**:
- ✅ `http.codes.200` : Number of successful requests
- ✅ `http.response_time.p95` : 95% of requests complete within this time
- ✅ `vusers.failed` : Failed requests (should be 0)

### k6 Results

```
     ✓ health status is 200
     ✓ home status is 200
     ✓ api status is 200
     ✓ api returns json

     checks.........................: 100.00% ✓ 720000     ✗ 0
     data_received..................: 360 MB  100 kB/s
     data_sent......................: 72 MB   20 kB/s
     http_req_blocked...............: avg=1.2ms   min=0s     med=0s      max=234.5ms p(95)=0.01ms
     http_req_connecting............: avg=678µs   min=0s     med=0s      max=123.4ms p(95)=0s
   ✓ http_req_duration..............: avg=42.3ms  min=3.2ms  med=38.5ms  max=567.8ms p(95)=89.2ms
       { expected_response:true }...: avg=42.3ms  min=3.2ms  med=38.5ms  max=567.8ms p(95)=89.2ms
   ✓ http_req_failed................: 0.00%   ✓ 0          ✗ 180000
     http_req_receiving.............: avg=234µs   min=12µs   med=198µs   max=45.6ms  p(95)=567µs
     http_req_sending...............: avg=123µs   min=8µs    med=89µs    max=23.4ms  p(95)=345µs
     http_req_tls_handshaking.......: avg=0s      min=0s     med=0s      max=0s      p(95)=0s
     http_req_waiting...............: avg=41.9ms  min=3.1ms  med=38.2ms  max=556.7ms p(95)=88.9ms
     http_reqs......................: 180000  50/s
     iteration_duration.............: avg=2.1s    min=1.5s   med=2.0s    max=3.8s    p(95)=2.8s
     iterations.....................: 180000  50/s
     vus............................: 1       min=1        max=100
     vus_max........................: 100     min=100      max=100
```

**Analysis Points**:
- ✅ `http_req_failed` : 0.00% (all requests successful)
- ✅ `http_req_duration p(95)` : P95 < target value
- ✅ `checks` : 100% (all validations passed)

### monitor.js Results

Results are saved to `monitor-results.jsonl` file in JSONL format.

**Analysis Script** (`analyze-monitor.js`):
```javascript
const fs = require('fs');
const readline = require('readline');

const fileStream = fs.createReadStream('monitor-results.jsonl');
const rl = readline.createInterface({
  input: fileStream,
  crlfDelay: Infinity
});

let metrics = [];

rl.on('line', (line) => {
  metrics.push(JSON.parse(line));
});

rl.on('close', () => {
  // Memory growth rate analysis
  const heapGrowth = metrics.map(m => m.memory.heapGrowth);
  const avgGrowth = heapGrowth.reduce((a, b) => a + b, 0) / heapGrowth.length;

  console.log('Memory Analysis:');
  console.log(`  Initial Heap: ${(metrics[0].memory.heapUsed / 1024 / 1024).toFixed(2)} MB`);
  console.log(`  Final Heap: ${(metrics[metrics.length - 1].memory.heapUsed / 1024 / 1024).toFixed(2)} MB`);
  console.log(`  Total Growth: ${(heapGrowth[heapGrowth.length - 1] / 1024 / 1024).toFixed(2)} MB`);
  console.log(`  Avg Growth Rate: ${(avgGrowth / 1024).toFixed(2)} KB/sec`);

  // Memory leak detection
  if (avgGrowth > 1024 / 60) { // 1MB/min
    console.log('  ⚠️  Potential memory leak detected!');
  } else {
    console.log('  ✅ Memory usage is stable');
  }

  // Event Loop Lag analysis
  const avgLag = metrics.reduce((a, b) => a + b.eventLoop.lag, 0) / metrics.length;
  console.log(`\nEvent Loop:`);
  console.log(`  Average Lag: ${avgLag.toFixed(2)} ms`);

  if (avgLag > 50) {
    console.log('  ⚠️  High event loop lag detected!');
  } else {
    console.log('  ✅ Event loop is healthy');
  }
});
```

**Run**:
```bash
node analyze-monitor.js
```

---

## 🎯 Success Criteria

### 1-hour Load Test

- ✅ Error Rate < 0.1%
- ✅ P95 Response Time < 200ms
- ✅ P99 Response Time < 500ms
- ✅ Stable memory usage

### 6-hour Soak Test

- ✅ Error Rate < 0.05%
- ✅ P95 Response Time < 250ms
- ✅ P99 Response Time < 600ms
- ✅ Memory growth rate < 1MB/min (no memory leaks)
- ✅ Average Event Loop Lag < 50ms
- ✅ Stable CPU usage

---

## 🔍 Troubleshooting

### When Memory Leak is Detected

1. **Compare Heap Snapshots**:
```bash
# At test start
node --inspect app.js

# Create Heap Snapshot in Chrome DevTools
# Create another snapshot after 1 hour → compare
```

2. **Use clinic.js**:
```bash
# Heap Profiler
clinic heapprofiler -- node app.js

# Generate load
artillery run 1hour-load.yml

# Ctrl+C → Check HTML report
```

### When Performance Degradation is Detected

1. **Generate Flame Graph**:
```bash
clinic flame -- node app.js
artillery run 1hour-load.yml
# Ctrl+C → Check flame graph
```

2. **Use Bubbleprof**:
```bash
clinic bubbleprof -- node app.js
artillery run 1hour-load.yml
# Ctrl+C → Visualize async operations
```

---

## 📅 Recommended Test Schedule

| Test | Frequency | Responsible | Purpose |
|------|-----------|-------------|---------|
| 1-hour load | Every Monday | CI/CD | Basic stability verification |
| 6-hour soak | 1st of every month | Dev Team | Memory leak detection |
| Stress | Before release | QA Team | Identify limits |

---

## 🔗 References

- [Artillery Documentation](https://www.artillery.io/docs)
- [k6 Documentation](https://k6.io/docs/)
- [clinic.js Documentation](https://clinicjs.org/)
- [Node.js Performance Guide](https://nodejs.org/en/docs/guides/simple-profiling/)

---

Last updated: 2025-11-09
