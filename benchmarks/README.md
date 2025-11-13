# Numflow Benchmarks

Comprehensive benchmark comparing Numflow's performance with Express and Fastify.

## 📁 Structure

```
benchmarks/
├── README.md              # This file
├── index.js               # Main benchmark runner
│
├── servers/               # Benchmark servers
│   ├── numflow.js        # Numflow server
│   ├── express.js        # Express server
│   └── fastify.js        # Fastify server
│
├── utils/                 # Utilities
│   ├── scenarios.js      # Benchmark scenario definitions
│   ├── runner.js         # Benchmark execution logic
│   └── reporter.js       # Results output and saving
│
├── fixtures/              # Auto-generated test files
│   ├── generate-steps.js # Steps generation script
│   ├── steps-10/         # 10 steps
│   └── steps-50/         # 50 steps
│
└── results/               # Benchmark results
    ├── latest.json       # Latest results (always updated)
    └── *.json            # Timestamped results
```

## 🚀 How to Run

### Run Comprehensive Benchmark

```bash
# Build the project first
npm run build

# Run benchmark
node benchmarks/index.js
```

### Benchmark Configuration

You can modify the following settings in `benchmarks/index.js`:

```javascript
const DURATION = 10        // Benchmark duration (seconds)
const CONNECTIONS = 100    // Number of concurrent connections
const WARMUP_TIME = 3000   // Warmup time (ms)
```

## 📊 Benchmark Scenarios

### General Routes (7 scenarios)

1. **Hello World** - `GET /`
2. **JSON Response** - `GET /json`
3. **JSON Parse** - `POST /users`
4. **Route Parameters (single)** - `GET /users/123`
5. **Route Parameters (multiple)** - `GET /users/123/posts/456`
6. **Route + Query** - `GET /search?q=test&page=1&limit=10`
7. **Middleware Chain (4 middlewares)** - `GET /middleware-chain`

### Feature-First (3 scenarios, Numflow only)

1. **Feature-First (10 Steps)** - `POST /api/feature-10-steps`
2. **Feature-First (50 Steps)** - `POST /api/feature-50-steps`
3. **Regular Route (Comparison)** - `POST /api/regular-route`

## 📈 Interpreting Results

### Comprehensive Comparison Table

```
| # | Scenario | Numflow | Express | Fastify | vs Express | vs Fastify |
|---|----------|---------|---------|---------|-----------|-----------|
| 1 | Hello World | 86,711 | 21,653 | 90,831 | +300% ✅ | -5% ❌ |
...
```

- **Numflow**: Numflow's request throughput (req/s)
- **Express**: Express's request throughput (req/s)
- **Fastify**: Fastify's request throughput (req/s)
- **vs Express**: Performance increase compared to Express
- **vs Fastify**: Performance increase compared to Fastify

### Feature-First Overhead Analysis

```
[Feature (10 Steps) vs Regular Route]
  Feature (10 Steps): 53,305 req/s
  Regular Route: 54,500 req/s
  Overhead: 2.19%
```

- Measures Feature-First pattern overhead
- Analyzes performance differences based on step count

## 🔧 Customization

### Adding New Scenarios

Add scenario to `utils/scenarios.js`:

```javascript
const BASIC_SCENARIOS = [
  // ... existing scenarios
  {
    name: 'New Scenario',
    method: 'GET',
    path: '/new-route',
    body: { /* optional */ },
  },
]
```

Implement corresponding route in each server file (`servers/*.js`):

```javascript
app.get('/new-route', (req, res) => {
  res.json({ message: 'New route' })
})
```

### Regenerate Steps

```bash
node benchmarks/fixtures/generate-steps.js
```

## 📝 Saving Results

All benchmark results are saved to the `results/` directory:

- **`latest.json`**: Always updated with latest results
- **`baseline.json`**: Regression test baseline (manually updated)
- **`comprehensive-{timestamp}.json`**: Timestamped results

## 🔒 Automated Validation and Regression Testing

Benchmarks go through the following automated validation procedures:

### 1. Fixture Validation (Before Execution)

Fixtures are automatically validated before benchmark execution:

```bash
# Runs automatically (when running index.js)
# - Verifies generated step file count
# - Checks that last step sends response
# - Confirms intermediate steps don't send responses
# - Tests actual server functionality
```

Manual validation:
```bash
node benchmarks/fixtures/validate-fixtures.js
```

### 2. Self-validation During Fixture Generation

`generate-steps.js` automatically validates after creating files:

```bash
node benchmarks/fixtures/generate-steps.js

# Output:
# ✓ Generated 10 steps in benchmarks/fixtures/steps-10
# ✓ Generated 50 steps in benchmarks/fixtures/steps-50
# ✅ All fixtures generated!
# 🔍 Validating generated fixtures...
#   ✅ 10 steps validated successfully
#   ✅ 50 steps validated successfully
# ✅ All fixtures validated successfully!
```

### 3. Regression Testing (After Execution)

Automatically compares with baseline after benchmark completion:

```bash
# Runs automatically (when running index.js)
# - Detects Feature-First overhead increase (20% threshold)
# - Detects individual scenario performance degradation (30% threshold)
# - Detects overall average performance degradation (20% threshold)
```

Update baseline:
```bash
# Set current results as new baseline
cp benchmarks/results/latest.json benchmarks/results/baseline.json
```

### 4. When Validation Fails

Benchmark stops immediately if validation fails:

- **Fixture validation failure**: Regenerate with `node benchmarks/fixtures/generate-steps.js`
- **Regression test warning**: Investigate cause of performance degradation

## 🛡️ Prevention System

The benchmark system has 4 defense layers:

1. **Layer 1**: `generate-steps.js` self-validation - Validates immediately after generation
2. **Layer 2**: `validate-fixtures.js` - Tests actual server operation
3. **Layer 3**: Auto-validation before `index.js` execution - Verifies before benchmark start
4. **Layer 4**: Regression testing - Detects performance degradation by comparing with baseline

## ⚠️ Important Notes

1. **Build Required**: Must run `npm run build` before executing benchmarks
2. **Port Conflicts**: Ports 4000, 4001, 4002 must be available
3. **System Resources**: May use high CPU/memory
4. **Result Variability**: Results may vary based on system state

## 🎯 Benchmark Purposes

1. **Performance Comparison**: Numflow vs Express vs Fastify
2. **Feature-First Overhead**: Measure performance impact of Feature pattern
3. **Regression Testing**: Track performance changes on code modifications
4. **Optimization**: Identify performance bottlenecks

## 📚 Related Documentation

- [Numflow Performance Guide](../docs/performance.md)
- [Architecture Documentation](../docs/ARCHITECTURE.md)
- [Benchmark Results Analysis](./results/latest.json)
