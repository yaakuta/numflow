# Performance Benchmarks

> Comprehensive performance analysis of Numflow Framework

This document provides detailed benchmark results comparing Numflow against Express and Fastify, including Feature-First pattern performance analysis.

---

## Table of Contents

- [Test Environment](#test-environment)
- [Overall Benchmark Results](#overall-benchmark-results)
- [Framework Comparison](#framework-comparison)
- [Feature-First Performance](#feature-first-performance)
- [Performance Recommendations](#performance-recommendations)
- [Running Benchmarks](#running-benchmarks)

---

## Test Environment

```
OS: macOS (Apple Silicon / Intel compatible)
Node.js: v20.18.1
Benchmark Tool: autocannon
Configuration: 100 connections, 10s duration
Test Date: 2025-10-20
Numflow Version: v0.2.0
```

**Frameworks Tested:**
- Numflow v0.2.0 (Radix Tree router, Express compatible)
- Express v5.x (Node.js standard framework)
- Fastify v5.x (High-performance framework)

---

## Overall Benchmark Results

### General Route Performance Comparison

| Scenario | Numflow | Express | Fastify | vs Express | vs Fastify |
|----------|---------|---------|---------|-----------|-----------|
| **Hello World** | 85,286 req/s<br/>0.86ms | 21,593 req/s<br/>4.29ms | 91,116 req/s<br/>0.84ms | **+295%** | -6% |
| **JSON Response** | 70,496 req/s<br/>1.04ms | 20,446 req/s<br/>4.38ms | 78,475 req/s<br/>1.05ms | **+245%** | -10% |
| **JSON Parse (POST)** | 58,247 req/s<br/>1.14ms | 18,257 req/s<br/>5.08ms | 50,553 req/s<br/>1.32ms | **+219%** | **+15%** ⭐ |
| **Route Params (Single)** | 65,440 req/s<br/>1.15ms | 20,287 req/s<br/>4.36ms | 86,886 req/s<br/>0.92ms | **+223%** | -25% |
| **Route Params (Multiple)** | 69,194 req/s<br/>1.05ms | 20,353 req/s<br/>4.35ms | 84,972 req/s<br/>0.96ms | **+240%** | -19% |
| **Route + Query** | 62,132 req/s<br/>1.19ms | 20,031 req/s<br/>4.37ms | 84,122 req/s<br/>0.97ms | **+210%** | -26% |
| **Middleware Chain** | 66,301 req/s<br/>1.05ms | 19,817 req/s<br/>4.40ms | 84,797 req/s<br/>0.96ms | **+235%** | -22% |
| **Average** | **68,157 req/s**<br/>**1.07ms** | **20,112 req/s**<br/>**4.46ms** | **80,132 req/s**<br/>**1.00ms** | **+239%** | **-15%** |

### Performance Visualization

```
Hello World (req/s)
Numflow   ████████████████████████████████████████████████████████ 85,286
Express   ███████████ 21,593
Fastify   ██████████████████████████████████████████████████████████ 91,116

JSON Response (req/s)
Numflow   ████████████████████████████████████████████████ 70,496
Express   ████████████ 20,446
Fastify   ███████████████████████████████████████████████████████ 78,475

JSON Parse POST (req/s)
Numflow   ████████████████████████████████████████ 58,247 ⭐ Fastest!
Express   ███████████ 18,257
Fastify   ██████████████████████████████████ 50,553

Route Parameters (req/s)
Numflow   ███████████████████████████████████████████ 67,317 (avg)
Express   ████████████ 20,320 (avg)
Fastify   ██████████████████████████████████████████████████████ 85,929 (avg)

Middleware Chain (req/s)
Numflow   ████████████████████████████████████████████ 66,301
Express   ███████████ 19,817
Fastify   ██████████████████████████████████████████████████████ 84,797
```

### Latency Comparison (ms, lower is better)

| Scenario | Numflow | Express | Fastify | Improvement (vs Express) |
|----------|---------|---------|---------|--------------------------|
| Hello World | 0.86 | 4.29 | 0.84 | **79.9% reduction** |
| JSON Response | 1.04 | 4.38 | 1.05 | **76.3% reduction** |
| JSON Parse (POST) | 1.14 | 5.08 | 1.32 | **77.6% reduction** |
| Route Params (Single) | 1.15 | 4.36 | 0.92 | **73.6% reduction** |
| Route Params (Multiple) | 1.05 | 4.35 | 0.96 | **75.9% reduction** |
| Route + Query | 1.19 | 4.37 | 0.97 | **72.8% reduction** |
| Middleware Chain | 1.05 | 4.40 | 0.96 | **76.1% reduction** |
| **Average** | **1.07** | **4.46** | **1.00** | **76.0% reduction** |

---

## Framework Comparison

### Performance vs Express

**Key Achievements:**
- Average **239% faster** (3.4x speed)
- Dominates Express in all scenarios
- Average latency reduced by 76.0% (4.46ms → 1.07ms)

**Fastest Scenarios vs Express:**
1. Hello World: **295% faster** (85,286 vs 21,593 req/s)
2. JSON Response: **245% faster** (70,496 vs 20,446 req/s)
3. Route Params (Multiple): **240% faster** (69,194 vs 20,353 req/s)

**Key Factors:**
- **Radix Tree Router**: Using find-my-way for O(log n) routing (Express uses O(n))
- **Optimized Body Parser**: Automatic parser selection based on Content-Type
- **URL Parsing Cache**: LRU cache eliminates repeated parsing overhead

### Competitiveness vs Fastify

**Overall Average Comparison:**
- Fastify: 80,132 req/s (1.00ms latency)
- Numflow: 68,157 req/s (1.07ms latency)
- Numflow achieves **85% of Fastify's performance**

**Where Numflow is Faster:**
- **JSON Parse (POST): +15% faster** (58,247 vs 50,553 req/s) ⭐
  - Body Parser optimization effect

**Where Fastify is Faster:**
- Route Parameters (Single): -25% (65,440 vs 86,886 req/s)
- Route + Query: -26% (62,132 vs 84,122 req/s)
- Middleware Chain: -22% (66,301 vs 84,797 req/s)

**Critical Difference:**
- Numflow: **100% Express compatibility** (zero learning curve)
- Fastify: Requires learning new API, limited Express plugin compatibility

**Conclusion:** Numflow provides near-Fastify performance while maintaining complete Express compatibility.

---

## Feature-First Performance

### What is Feature-First?

Numflow's core differentiator that automatically manages complex business logic based on folder structure:

- **Convention over Configuration**: Auto-infer HTTP method/path from folder structure
- **Auto-Discovery**: Automatically scan and sort Step files
- **Auto-Execution**: Execute Steps in numeric order
- **Auto-Error Handling**: Automatically invoke onError handler
- **Context Sharing**: Share data across all Steps

### Feature-First Performance Results

| Test Case | Req/s | Latency (ms) | Throughput (MB/s) |
|-----------|-------|--------------|-------------------|
| Regular Route (baseline) | 55,647 | 1.17 | 24.09 |
| Feature (10 Steps) | 49,381 | 1.37 | 21.42 |
| Feature (50 Steps) | 42,620 | 2.02 | 57.51 |
| Feature (With onError) | 52,851 | 1.22 | 22.89 |
| Feature (Without onError) | 53,139 | 1.21 | 23.01 |

### Overhead Analysis

#### 1. Feature-First vs Regular Route

```
Regular Route:          █████████████████████████████████████ 55,647 req/s
Feature (10 Steps):     ████████████████████████████████ 49,381 req/s
Overhead: 11.26%
```

**Analysis:**
- Feature-First pattern has **11.26% performance overhead** vs regular routes
- This is the cost of providing:
  - Automatic Step scanning and sorting
  - Context sharing and management
  - Sequential execution and error handling
  - Convention-based automatic routing
- Considering the value of systematically managing complex business logic, this is a reasonable tradeoff

#### 2. onError Handler Impact

```
Without onError:        █████████████████████████████████████ 53,139 req/s
With onError:           ████████████████████████████████████ 52,851 req/s
Overhead: 0.54%
```

**Analysis:**
- onError handler has **only 0.54% performance impact** (negligible!)
- Safe to use when DB transaction rollback is needed
- Improves code stability through systematic error handling

#### 3. Impact of Step Count Increase

```
10 Steps:   ██████████████████████████████████ 49,381 req/s (1.37ms)
50 Steps:   ██████████████████████████ 42,620 req/s (2.02ms)
Difference: 13.69%
```

**Analysis:**
- 5x increase in Steps (10→50) results in 13.69% performance decrease
- Average overhead per Step: ~0.34% (13.69% ÷ 40 additional Steps)
- Even at 50 Steps, 42,620 req/s is **113% faster** than Express (~20,000 req/s)
- Typical Features (10-20 Steps) can be used without performance concerns

### Feature-First Performance Visualization

```
Performance Spectrum (higher is better)

Regular Route             ████████████████████████████████████████ 55,647 req/s (baseline)
Feature (Without onError) ███████████████████████████████████████ 53,139 req/s (-4.5%)
Feature (With onError)    ██████████████████████████████████████ 52,851 req/s (-5.0%)
Feature (10 Steps)        █████████████████████████████████ 49,381 req/s (-11.3%)
Feature (50 Steps)        ███████████████████████████ 42,620 req/s (-23.4%)

┌─────────────────────────────────────────────────────────────┐
│ Express Average (20,000 req/s)                              │
│ ████████████                                                │
│ ↑ Numflow Feature-First is 2x faster than Express even at  │
│   50 Steps!                                                 │
└─────────────────────────────────────────────────────────────┘
```

---

## Performance Recommendations

### Feature-First Usage Guide

#### ✅ When to Actively Use Feature-First

1. **Complex Business Logic** (5+ Steps)
   ```
   POST /api/orders
   Steps: Validate → Check Stock → Process Payment → Create Order →
          Send Notification → Add Points

   Overhead: 11% vs regular route
   Value: Systematic logic management, improved maintainability
   ```

2. **DB Transaction Required Operations**
   ```javascript
   // onError overhead: 0.54% (negligible)
   onError: async (error, ctx, req, res) => {
     await ctx.dbClient.query('ROLLBACK')
     res.status(500).json({ error: error.message })
   }
   ```

3. **Leveraging Convention over Configuration**
   ```
   features/api/v1/users/@post/
   ├── index.js           # Just feature({})!
   └── steps/
       ├── 100-validate.js
       ├── 200-create.js
       └── 300-notify.js

   Folder structure = POST /api/v1/users (auto-inferred!)
   ```

#### ✅ When Regular Routes Are Also Good

1. **Simple Query APIs**
   ```javascript
   app.get('/users/:id', async (req, res) => {
     const user = await db.users.findById(req.params.id)
     res.json(user)
   })
   ```

2. **Proxy/Gateway** (Only forwarding requests)

**Note:** Since Feature-First overhead is reasonable at 11%, we recommend using Feature-First in most cases.

### Step Count Recommendations

| Step Count | Performance Impact | Recommendation |
|------------|-------------------|----------------|
| 1-10 | ~11% | ✅ Optimal (balance of performance and structure) |
| 11-20 | ~11-15% | ✅ Recommended (typical complexity) |
| 21-40 | ~15-20% | ⚠️ Acceptable (complex logic) |
| 41-50 | ~20-24% | ⚠️ Caution (consider splitting logic) |
| 50+ | >24% | ❌ Not recommended (split into multiple Features) |

**Note:** Even at 50 Steps, still 2x faster than Express!

### Framework Selection Guide

```
┌────────────────────────────────────────────────────────┐
│ Project Requirements          Recommended Framework    │
├────────────────────────────────────────────────────────┤
│ Migrating from Express        → Numflow ⭐             │
│ Express compatibility + Speed → Numflow ⭐             │
│ Systematize complex logic     → Numflow ⭐             │
│ Zero learning curve + Speed   → Numflow ⭐             │
│ Absolute max performance      → Fastify                │
│ Legacy maintenance            → Express                │
└────────────────────────────────────────────────────────┘
```

**Why Choose Numflow:**
1. **239% faster** than Express (3.4x speed)
2. **85% of Fastify's performance** (even faster in JSON POST!)
3. **100% Express compatibility** (zero learning curve)
4. **Feature-First** pattern improves productivity
5. Reliable onError handler (0.54% overhead)

---

## Running Benchmarks

### Running Comprehensive Benchmarks

```bash
# 1. Build the project
npm run build

# 2. Run comprehensive benchmarks (Numflow vs Express vs Fastify + Feature-First)
node benchmarks/comprehensive-benchmark.js
```

**Execution Time:** ~5-7 minutes

**Included Tests:**
- 7 general route scenarios × 3 frameworks = 21 tests
- 5 Feature-First scenarios = 5 tests
- Total 26 tests

### Viewing Results

```bash
# Check latest result files
ls -lt benchmarks/results/

# Read result file (JSON format)
cat benchmarks/results/comprehensive-*.json | jq .
```

### Test Scenarios

#### General Route Scenarios (7)

1. **Hello World**: `GET /`
2. **JSON Response**: `GET /json`
3. **JSON Parse (POST)**: `POST /users`
4. **Route Parameters (Single)**: `GET /users/:id`
5. **Route Parameters (Multiple)**: `GET /users/:userId/posts/:postId`
6. **Route + Query**: `GET /search?q=test&page=1&limit=10`
7. **Middleware Chain (4 middleware)**: `GET /middleware-chain`

#### Feature-First Scenarios (5, Numflow only)

1. **Feature (10 Steps)**: `POST /api/feature-10-steps`
2. **Feature (50 Steps)**: `POST /api/feature-50-steps`
3. **Feature (With onError)**: `POST /api/feature-with-error-handler`
4. **Feature (Without onError)**: `POST /api/feature-without-error-handler`
5. **Regular Route (Comparison)**: `POST /api/regular-route`

---

## Conclusion

### Numflow Performance Summary

| Metric | Result | Notes |
|--------|--------|-------|
| **vs Express Performance** | +239% (3.4x) | ✅ Dominates all scenarios |
| **vs Fastify Performance** | 85% | ✅ Near-Fastify while keeping Express compatibility |
| **JSON POST Performance** | 15% faster than Fastify | ⭐ Body Parser optimization effect |
| **Latency Improvement** | 76% reduction (4.46ms → 1.07ms) | ✅ Dramatically better user experience |
| **Feature-First Overhead** | 11.26% | ✅ Reasonable level |
| **onError Overhead** | 0.54% | ✅ Negligible |
| **50 Steps vs Express** | Still 113% faster | ✅ Fast even with large Features |

### Key Message

**Numflow is a high-performance framework that can completely replace Express.**

- 🚀 **3.4x faster than Express**
- 🔄 **100% Express compatible** (zero learning curve)
- 🎯 **Feature-First** pattern achieves both productivity and performance
- ⚡ **Fastify-level performance** (faster in some scenarios)
- 🛡️ **Reliable onError handler** (negligible performance impact)

**Choose Numflow!**

---

## Related Documentation

- [Getting Started Guide](../guides/getting-started.md)
- [Feature-First Guide](../guides/feature-first.md)
- [Architecture Guide](./architecture.md)
- [Routing Guide](../guides/routing.md)

---

*Last updated: 2025-10-20*
