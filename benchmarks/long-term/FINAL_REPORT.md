# Numflow v0.2.0 Long-term Stability Test Final Report

**Generated:** 2025. 11. 10. 7:42:53 AM

---

## 📋 Test Overview


### Runtime
- **Total Runtime:** 6h 48m 44s (24524 seconds)

### Feature-First Throughput
- **Total Steps Executed:** 28,694,708
- **Total Async Tasks Completed:** 4,782,556
- **Total Transactions Committed:** 4,782,229
- **Users Created:** 4,782,229
- **Orders Created:** 327

---

## 🎯 Key Achievements


### ✅ Memory Stability
- **Memory Leak:** ✅ None
- **Total Memory Growth:** 0.27 MB
- **Memory Growth Rate:** 0.01 KB/sec
- **Average Heap Usage:** 3.62 MB
- **Maximum Heap Usage:** 4.32 MB
- **Heap Limit:** 4144.00 MB
- **Maximum Heap Usage Rate:** 0.10%

### ✅ Event Loop Health
- **Event Loop Blocking:** ⚠️ Detected
- **Average Event Loop Lag:** 1.68 ms
- **Maximum Event Loop Lag:** 2101 ms

### 📊 CPU Usage
- **Total User Time:** 1.60 seconds
- **Total System Time:** 2.14 seconds

### 🚀 Feature-First Performance
- **Average Steps Throughput:** 1170.6/sec
- **Average Async Tasks Throughput:** 195.1/sec
- **Average Transactions Throughput:** 195.1/sec

### ✅ Stability Metrics
- **Async Task Success Rate:** 100.00%
  - Completed: 4,782,556
  - Failed: 0
- **Transaction Success Rate:** 100.00%
  - Committed: 4,782,229
  - Rolled Back: 0

---

## 📈 Detailed Analysis


### Memory Trend
```
Initial Heap: 3.31 MB
Final Heap:   3.58 MB
Growth:       0.27 MB
Growth Rate:  0.01 KB/sec

Average Heap: 3.62 MB
Minimum Heap: 2.81 MB
Maximum Heap: 4.32 MB

Heap Limit:        4144.00 MB
Max Usage Rate:    0.10%
Avg Usage Rate:    0.09%
```

---

## 🏆 Final Conclusion


### ⚠️ **Improvements Needed**

The following issues were found during testing:

- ⚠️ Event loop lag detected (max 2101 ms)

---

## 📊 Raw Data

- **System Monitoring:** `/Users/seunghyunpaek/__dev/_numbers/benchmarks/long-term/monitor-results.jsonl` (2452 samples)
- **Feature Monitoring:** `/Users/seunghyunpaek/__dev/_numbers/benchmarks/long-term/feature-first/feature-metrics.jsonl` (2452 samples)

---

**Report Generated:** 2025-11-09T22:42:53.290Z
**Numflow Version:** v0.2.0
**Test Type:** 6-hour long-term stability test
