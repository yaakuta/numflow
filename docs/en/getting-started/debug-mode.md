# Debug Mode 🐛

Numflow's Debug Mode is a powerful debugging tool that visually tracks the execution flow of Feature-First Auto-Orchestration.

> **Note**: Debug Mode only works with Feature-First pattern. It does not work with regular routes.

---

## 📑 Table of Contents

- [What is Debug Mode?](#what-is-debug-mode)
- [Why Do You Need It?](#why-do-you-need-it)
- [Enable/Disable](#enabledisable)
- [Output Format](#output-format)
- [Context Tracking](#context-tracking)
- [Real-World Examples](#real-world-examples)
- [Log Control](#log-control)
- [Performance Considerations](#performance-considerations)
- [Best Practices](#best-practices)

---

## What is Debug Mode?

Debug Mode displays Feature step execution flow in **tree format** and tracks **Context changes** to make debugging easier.

It is **disabled by default** and can be enabled via environment variable when needed.

### Key Features

1. **Detailed Step Information**
   - Input before step execution (context state)
   - Context changes after step execution
   - Execution time (ms)
   - Success/Failure indicator (✓/✗)

2. **Tree Format Output**
   - Beautiful tree structure (├─, └─)
   - Step number and name display
   - Input/Output information for each step

3. **Summary Statistics**
   - Total execution time
   - Success/Failure step count
   - Final status (Success/Failed)

---

## Why Do You Need It?

In Feature-First pattern, multiple steps execute sequentially while sharing Context. Without Debug Mode:

```javascript
// ❌ Without Debug Mode...
// - Hard to know which step failed
// - Can't see how each step modifies Context
// - Difficult to find performance bottlenecks
// - Hard to debug complex business logic

features/create-order/steps/
  100-validate-order.js    // Where did it stop?
  200-check-inventory.js   // Was Context passed correctly?
  300-reserve-stock.js     // Why is this step so slow?
  400-process-payment.js   // Did error occur here?
```

**With Debug Mode:**

```bash
# ✅ See everything at a glance with Debug Mode!
[Feature] POST /api/orders
  [Step 100] validate-order (2ms) ✓
    ├─ Input: {"userId":1,"orderData":{...}}
    └─ Context: {"validation":{"isValid":true}}

  [Step 200] check-inventory (15ms) ✓
    ├─ Input: {"userId":1,"orderData":{...}}
    └─ Context: {"inventory":{"available":true}}

  [Step 300] reserve-stock (150ms) ✓  ← This is slow!
    └─ Context: {"reservation":{"id":"123"}}

  [Step 400] process-payment (8ms) ✗  ← Error occurred!
    └─ Error: Payment gateway timeout

  [Summary]
    Total: 175ms
    Steps: 3/4 passed
    Status: ✗ Failed
```

---

## Enable/Disable

### Default State (Disabled)

Debug Mode is **disabled by default**. Running a Feature without configuration produces no debug logs.

```javascript
// features/create-order/index.js
const numflow = require('numflow')

module.exports = numflow.feature({
  method: 'POST',
  path: '/api/orders',
  steps: './steps'
})

// No Debug Mode logs when running server
// node server.js
```

### How to Enable

Enable it in development environment or when debugging is needed.

```bash
# Method 1: Enable via environment variable
FEATURE_DEBUG=true node server.js

# Method 2: Add to .env file
echo "FEATURE_DEBUG=true" >> .env
node server.js

# Method 3: package.json script
{
  "scripts": {
    "dev": "FEATURE_DEBUG=true node server.js",  // Enable Debug Mode in dev
    "start": "node server.js"                     // Production (disabled)
  }
}
```

### Other Log Controls

```bash
# Disable all Feature logs (for testing)
DISABLE_FEATURE_LOGS=true node server.js

# Test mode (automatically disables all logs)
NODE_ENV=test npm test
```

---

## Output Format

### Success Case

```bash
[Feature] POST /api/orders
  [Step 100] validate-order (2ms) ✓
    ├─ Input: {"userId":1,"orderData":{"items":[{"id":1,"qty":2}]}}
    └─ Context: {"validation":{"isValid":true,"itemCount":1}}

  [Step 200] check-inventory (15ms) ✓
    ├─ Input: {"userId":1,"orderData":{"items":[{"id":1,"qty":2}]}}
    └─ Context: {"inventory":{"available":true,"stock":50}}

  [Step 300] create-order (8ms) ✓
    ├─ Input: {"userId":1,"orderData":{"items":[{"id":1,"qty":2}]}}
    └─ Context: {"order":{"orderId":"12345","status":"created"}}

  [Summary]
    Total: 25ms
    Steps: 3/3 passed
    Status: ✓ Success
```

### Error Case

```bash
[Feature] POST /api/orders
  [Step 100] validate-order (2ms) ✓
    ├─ Input: {"userId":1,"orderData":{"items":[]}}
    └─ Context: {"validation":{"isValid":false}}

  [Step 200] check-inventory (1ms) ✗
    ├─ Input: {"userId":1,"orderData":{"items":[]}}
    └─ Error: No items in order

  [Summary]
    Total: 3ms
    Steps: 1/2 passed
    Status: ✗ Failed
    Error: No items in order
```

### Output Elements

| Element | Description |
|---------|-------------|
| `[Feature]` | Feature header (HTTP method + path) |
| `[Step 100]` | Step number (extracted from filename) |
| `validate-order` | Step name (filename without extension) |
| `(2ms)` | Step execution time (milliseconds) |
| `✓` / `✗` | Success/Failure icon |
| `├─ Input` | Context state before step execution (excluding results) |
| `└─ Context` | Context changes after step execution |
| `└─ Error` | Error message when error occurs |
| `[Summary]` | Overall execution statistics |

---

## Context Tracking

The core feature of Debug Mode is **Context change tracking**.

### Input vs Context

**Input (Before Execution)**
- Context state before step execution
- Excludes `ctx`
- Data passed from previous steps

```javascript
// Input example
{
  userId: 1,
  orderData: { items: [...] }
}
```

**Context (After Execution Changes)**
- Shows only data added to `ctx` after step execution
- Displays only newly added keys

```javascript
// Context example (newly added data)
{
  validation: { isValid: true, itemCount: 1 }
}
```

### Example: Tracking Context Flow

```javascript
// features/create-order/steps/100-validate-order.js
module.exports = async function(context) {
  const { orderData } = context

  // Validation logic
  const isValid = orderData.items && orderData.items.length > 0

  // Add to ctx (displayed in Debug Mode)
  ctx.validation = {
    isValid,
    itemCount: orderData.items?.length || 0
  }

  if (!isValid) {
    throw new Error('Invalid order')
  }
}
```

```javascript
// features/create-order/steps/200-check-inventory.js
module.exports = async function(context) {
  // Use previous step result
  const { validation } = ctx

  if (!validation.isValid) {
    throw new Error('Cannot check inventory for invalid order')
  }

  // Inventory check logic
  const stock = await db.getStock(context.orderData.items)

  // Add new result
  ctx.inventory = {
    available: stock.available,
    stock: stock.quantity
  }
}
```

**Debug Output:**

```bash
[Step 100] validate-order (2ms) ✓
  ├─ Input: {"userId":1,"orderData":{"items":[...]}}
  └─ Context: {"validation":{"isValid":true,"itemCount":1}}  ← Newly added

[Step 200] check-inventory (15ms) ✓
  ├─ Input: {"userId":1,"orderData":{...},"results":{"validation":{...}}}
  └─ Context: {"inventory":{"available":true,"stock":50}}  ← Newly added
```

---

## Real-World Examples

### Example 1: Order Creation Debugging

```javascript
// features/create-order/index.js
const numflow = require('numflow')

module.exports = numflow.feature({
  method: 'POST',
  path: '/api/orders',
  steps: './steps',

  contextInitializer: (ctx, req, res) => {
    ctx.userId = req.user?.id
    ctx.orderData = req.body
  },

  onError: async (error, context, req, res) => {
    console.error('Order creation failed:', error)
    res.status(500).json({ error: error.message })
  }
})
```

```javascript
// features/create-order/steps/100-validate-order.js
module.exports = async function(context) {
  const { orderData } = context

  if (!orderData.items || orderData.items.length === 0) {
    throw new Error('Order must have at least one item')
  }

  ctx.validation = {
    isValid: true,
    itemCount: orderData.items.length,
    totalAmount: orderData.items.reduce((sum, item) =>
      sum + (item.price * item.quantity), 0
    )
  }
}
```

```javascript
// features/create-order/steps/200-check-inventory.js
module.exports = async function(context) {
  const { orderData, results } = context
  const { validation } = results

  // Inventory check logic
  const outOfStock = []

  for (const item of orderData.items) {
    const stock = await inventoryService.getStock(item.id)
    if (stock < item.quantity) {
      outOfStock.push({
        itemId: item.id,
        requested: item.quantity,
        available: stock
      })
    }
  }

  if (outOfStock.length > 0) {
    throw new Error(`Items out of stock: ${JSON.stringify(outOfStock)}`)
  }

  ctx.inventory = {
    checked: true,
    timestamp: new Date().toISOString()
  }
}
```

**Debug Output (Success Case):**

```bash
[Feature] POST /api/orders
  [Step 100] validate-order (3ms) ✓
    ├─ Input: {"userId":1,"orderData":{"items":[{"id":1,"price":100,"quantity":2}]}}
    └─ Context: {"validation":{"isValid":true,"itemCount":1,"totalAmount":200}}

  [Step 200] check-inventory (45ms) ✓
    ├─ Input: {"userId":1,"orderData":{...}}
    └─ Context: {"inventory":{"checked":true,"timestamp":"2025-10-16..."}}

  [Summary]
    Total: 48ms
    Steps: 2/2 passed
    Status: ✓ Success
```

**Debug Output (Out of Stock):**

```bash
[Feature] POST /api/orders
  [Step 100] validate-order (2ms) ✓
    └─ Context: {"validation":{"isValid":true,"itemCount":1,"totalAmount":200}}

  [Step 200] check-inventory (35ms) ✗
    └─ Error: Items out of stock: [{"itemId":1,"requested":2,"available":0}]

  [Summary]
    Total: 37ms
    Steps: 1/2 passed
    Status: ✗ Failed
    Error: Items out of stock: [{"itemId":1,"requested":2,"available":0}]
```

### Example 2: Finding Performance Bottlenecks

Debug Mode measures execution time for each step, making it easy to find slow steps.

```bash
[Feature] POST /api/orders
  [Step 100] validate-order (2ms) ✓
  [Step 200] check-inventory (850ms) ✓  ← Slow!
  [Step 300] create-order (5ms) ✓
  [Step 400] send-notification (1200ms) ✓  ← Also slow!

  [Summary]
    Total: 2057ms
    Steps: 4/4 passed
    Status: ✓ Success
```

**Solutions:**
- Step 200: Optimize inventory check query (add index)
- Step 400: Move notification to async-tasks

---

## Log Control

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `FEATURE_DEBUG` | `false` (disabled) | Set to `true` to enable Debug Mode |
| `DISABLE_FEATURE_LOGS` | `false` (enabled) | Set to `true` to disable all Feature logs |
| `NODE_ENV` | - | Automatically disables all logs when set to `test` |

### Scenario-Specific Settings

**Development Environment (Detailed Logs)**
```bash
# Enable Debug Mode
FEATURE_DEBUG=true node server.js
```

**Production Environment (Minimal Logs)**
```bash
# Debug Mode disabled (default)
node server.js
```

**Test Environment (No Logs)**
```bash
# All logs automatically disabled
NODE_ENV=test npm test
```

**Specific Situations (Turn off Feature logs only)**
```bash
# Turn off Feature logs, keep app logs
DISABLE_FEATURE_LOGS=true node server.js
```

---

## Performance Considerations

### Context Snapshot Overhead

Debug Mode copies (snapshots) Context before and after each step execution. The performance impact is **negligible**.

**Performance Measurement (10 Steps Feature):**
- Debug Mode OFF: 42,104 req/s
- Debug Mode ON: ~41,000 req/s (approximately 2.6% overhead)

### Context Size Limit

Debug Mode converts Context to string using JSON.stringify. Limited to 60 characters by default.

```javascript
// Context is automatically truncated if too large
{
  validation: { isValid: true, itemCount: 1, items: [...] }
}

// Output example
└─ Context: {"validation":{"isValid":true,"itemCount":1,"items":[...
```

### Production Recommendations

1. **Keep disabled in production (default)**
   ```bash
   # Debug Mode is disabled by default, so
   # just run without configuration
   npm start
   ```

2. **Be careful with sensitive data**
   - Avoid including passwords, API keys in Context
   - Filter sensitive data in onError if needed

3. **Use log aggregators**
   - Save debug logs to file: `node server.js > debug.log 2>&1`
   - Use structured logging: Winston, Pino, etc.

---

## Best Practices

### 1. Context Design

```javascript
// ✅ Good: Maintain immutability
module.exports = async function(context) {
  // Add new data to results only
  ctx.validation = { isValid: true }
}

// ❌ Bad: Modify existing data
module.exports = async function(context) {
  // Modifying existing orderData (hard to track)
  context.orderData.status = 'validated'
}
```

### 2. Store Meaningful Results

```javascript
// ✅ Good: Detailed information
ctx.payment = {
  transactionId: '12345',
  amount: 100,
  method: 'credit_card',
  timestamp: new Date().toISOString()
}

// ❌ Bad: Unclear information
ctx.payment = true
```

### 3. Clear Error Messages

```javascript
// ✅ Good: Specific error
throw new Error(`Insufficient inventory for item ${itemId}: requested ${qty}, available ${stock}`)

// ❌ Bad: Vague error
throw new Error('Inventory error')
```

### 4. Optimize Step Execution Time

```javascript
// Check slow steps with Debug Mode and optimize

// Before (slow)
[Step 200] check-inventory (850ms) ✓

// After (fast)
[Step 200] check-inventory (12ms) ✓

// Optimization methods:
// - Optimize DB queries (add indexes)
// - Parallel processing (Promise.all)
// - Caching (Redis)
```

### 5. Development vs Production

```javascript
// package.json
{
  "scripts": {
    "dev": "FEATURE_DEBUG=true node server.js",  // Dev (Debug Mode enabled)
    "start": "node server.js",  // Production (disabled, default)
    "test": "NODE_ENV=test jest"  // Test (no logs)
  }
}
```

---

## Next Steps

- **[Feature-First Auto-Orchestration](./feature-first.md)** - Complete Feature-First pattern guide
- **[Error Handling](../api/feature.md#error-handling)** - Using onError handler
- **[Project Structure](../getting-started/project-structure.md)** - Feature folder structure design

---

**Last Updated**: 2025-11-09 (Debug Mode documentation created)
