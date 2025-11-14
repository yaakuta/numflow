# Async Tasks

> **Execute background tasks after transaction completion**
>
> Async Tasks in Numflow allow you to offload time-consuming operations (like sending emails or notifications) to run in the background without blocking the HTTP response.

---

## Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [When to Use Async Tasks](#when-to-use-async-tasks)
- [Convention over Configuration](#convention-over-configuration)
- [Detailed Guide](#detailed-guide)
- [Execution Flow](#execution-flow)
- [Error Handling](#error-handling)
- [Best Practices](#best-practices)
- [Examples](#examples)
- [Troubleshooting](#troubleshooting)
- [Related](#related)

---

## Overview

**Async Tasks** are background operations that execute **after** all steps complete successfully. They are perfect for operations that don't need to block the HTTP response:

- 📧 **Sending emails** (order confirmations, welcome emails)
- 📱 **Sending SMS/push notifications**
- 📊 **Logging analytics** (user events, metrics)
- 🔔 **Triggering webhooks** (notify external services)
- 🗄️ **Updating caches** (Redis, CDN)
- 🎯 **Background processing** (image optimization, report generation)

**Key Benefits**:
- ⚡ **Faster Response Times**: Return immediately to the client
- 🔒 **Transaction Safety**: Only execute after successful commit
- 🛡️ **Error Isolation**: Failures don't affect the main response
- 📦 **Clean Separation**: Keep business logic separate from side effects

---

## Quick Start

### Basic Example

```javascript
const numflow = require('numflow')
const app = numflow()

// features/api/orders/@post/index.js
module.exports = numflow.feature({
  // Convention: method and path are inferred from folder structure
  // POST /api/orders

  // Async tasks run AFTER steps complete
  asyncTasks: [
    async (ctx) => {
      // Send order confirmation email
      await emailService.send({
        to: ctx.user.email,
        subject: `Order Confirmation #${ctx.order.id}`,
        body: `Your order has been confirmed!`
      })
    },
    async (ctx) => {
      // Send SMS notification
      await smsService.send({
        to: ctx.user.phone,
        message: `Order #${ctx.order.id} confirmed!`
      })
    }
  ],

  steps: [
    // Step 1: Create order
    async (ctx, req, res) => {
      const order = await Order.create(req.body)
      ctx.order = order
    },
    // Step 2: Send response (async tasks run AFTER this)
    async (ctx, req, res) => {
      res.status(201).json({ success: true, order: ctx.order })
      return // End execution
    }
  ]
})
```

**Execution Order**:
```
1. Step 1 executes → Creates order
2. Step 2 executes → Sends response to client
3. Client receives response (fast!)
4. Async tasks execute in background (email, SMS)
```

---

## When to Use Async Tasks

### ✅ Good Use Cases

Use async tasks for operations that:

- **Don't affect the response** (client doesn't need to wait)
- **Should run after transaction commit** (data is safely persisted)
- **Can tolerate failures** (retry mechanisms can be added separately)

**Examples**:
- Sending confirmation emails
- Logging analytics events
- Updating search indexes
- Purging caches
- Notifying external webhooks

### ❌ When NOT to Use

Don't use async tasks for:

- **Operations that affect the response** (use regular steps)
- **Operations that must complete before responding** (use regular steps)
- **Critical operations** (use steps with proper error handling)

**Example** - Wrong usage:
```javascript
// ❌ BAD: Payment processing should be a step, not async task
asyncTasks: [
  async (ctx) => {
    await paymentService.charge(ctx.user, ctx.amount)
  }
]

// ✅ GOOD: Payment processing as a step
steps: [
  async (ctx, req, res) => {
    const payment = await paymentService.charge(ctx.user, ctx.amount)
    ctx.payment = payment
  }
]
```

---

## Convention over Configuration

Numflow automatically detects async tasks from your folder structure!

### Automatic Detection

```
features/
└── api/
    └── orders/
        └── @post/                    # POST /api/orders
            ├── index.js
            ├── steps/
            │   ├── 100-validate.js
            │   └── 200-create.js
            └── async-tasks/         # ← Auto-detected!
                ├── send-email.js
                └── send-sms.js
```

**index.js** (minimal configuration):
```javascript
module.exports = numflow.feature({
  // Convention over Configuration!
  // - method: 'POST' (from folder name)
  // - path: '/api/orders' (from folder structure)
  // - steps: './steps' (auto-detected)
  // - asyncTasks: './async-tasks' (auto-detected!)
})
```

### Async Task Files

Each file in `async-tasks/` becomes an async task:

**async-tasks/send-email.js**:
```javascript
module.exports = async (ctx) => {
  await emailService.send({
    to: ctx.user.email,
    subject: `Order Confirmation #${ctx.order.id}`,
    body: `Your order has been confirmed!`
  })
}
```

**async-tasks/send-sms.js**:
```javascript
module.exports = async (ctx) => {
  await smsService.send({
    to: ctx.user.phone,
    message: `Order #${ctx.order.id} confirmed!`
  })
}
```

**Benefits**:
- ✅ File names are self-documenting
- ✅ Each task is independently testable
- ✅ Easy to add/remove tasks
- ✅ No naming conflicts (unlike numbered steps)

---

## Detailed Guide

### Accessing Context

Async tasks receive the same context as steps:

```javascript
module.exports = async (ctx) => {
  // Access data from steps
  const { user, order, payment } = ctx

  // Add new data to context (for other async tasks)
  ctx.emailSent = true
  ctx.emailSentAt = new Date()
}
```

### Execution Order

Async tasks execute **sequentially** in the order defined:

```javascript
asyncTasks: [
  async (ctx) => {
    console.log('Task 1: Send email')
    await emailService.send(/* ... */)
  },
  async (ctx) => {
    console.log('Task 2: Log analytics')
    await analytics.track(/* ... */)
    // Task 2 runs AFTER Task 1 completes
  }
]
```

### Async vs Sync Tasks

All async tasks run in the background. Use `await` inside them for sequential operations:

```javascript
module.exports = async (ctx) => {
  // These run sequentially within this task
  await emailService.send(/* ... */)
  await smsService.send(/* ... */)
  await analytics.track(/* ... */)
}
```

---

## Execution Flow

### Complete Request Lifecycle

```
┌─────────────────────────────────────────────────┐
│ 1. Client sends request                         │
└──────────────────┬──────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────┐
│ 2. Context Initializer runs                     │
│    ctx = { userId: req.user.id, ... }          │
└──────────────────┬──────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────┐
│ 3. Middlewares execute                          │
│    (authentication, validation, etc.)           │
└──────────────────┬──────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────┐
│ 4. Steps execute sequentially                   │
│    Step 100 → Step 200 → ... → Step 900        │
└──────────────────┬──────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────┐
│ 5. Response sent to client                      │
│    res.json({ success: true })                  │
│    (Client receives response immediately!)      │
└──────────────────┬──────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────┐
│ 6. Async Tasks execute in background            │
│    Task 1 → Task 2 → Task 3 → ...              │
│    (Client doesn't wait for these)              │
└─────────────────────────────────────────────────┘
```

### Timeline Example

```
Time: 0ms     | Request received
Time: 10ms    | Step 1: Validate input ✓
Time: 50ms    | Step 2: Create order ✓
Time: 60ms    | Step 3: Respond to client ✓
              | → Client receives response (60ms total)
              |
Time: 70ms    | [Background] Async Task 1: Send email ⏳
Time: 1070ms  | [Background] Async Task 1 complete ✓
Time: 1080ms  | [Background] Async Task 2: Send SMS ⏳
Time: 2080ms  | [Background] Async Task 2 complete ✓
```

**Result**: Client gets response in 60ms, not 2080ms!

---

## Async Task Execution Conditions (Important)

Async tasks execute **only after successful feature completion**. Understanding execution conditions is crucial for predictable behavior.

### When DO Async Tasks Execute?

| Step Status | Response Sent | Async Tasks Execute |
|-------------|--------------|-------------------|
| ✅ All succeed | ✅ Sent (last step) | ✅ **Execute** |
| ✅ Early success response (200 OK) | ✅ Sent (middle step) | ✅ **Execute** ⭐ |
| ❌ Early error response (4xx/5xx) | ✅ Sent (middle step) | ❌ Do NOT execute |
| ✅ All succeed | ❌ Not sent | ❌ Error (no response sent) |
| ❌ throw Error | - | ❌ Do NOT execute |
| ❌ Exception occurred | - | ❌ Do NOT execute |

### Case 1: Early Error Response (4xx/5xx) → Async Tasks Do NOT Execute ❌

When sending an error response (400, 401, 403, 404, 500, etc.) in a middle step:

```javascript
// steps/100-validate.js
module.exports = async (ctx, req, res) => {
  if (!req.body.productId) {
    // ⚠️ Error response → Async tasks will NOT execute
    res.status(400).json({ error: 'productId required' })
    return  // ⚠️ return is required!
  }
  ctx.validated = true
}

// steps/200-create-order.js - Skipped
module.exports = async (ctx, req, res) => {
  const order = await db.orders.create(req.body)
  ctx.order = order
}

// async-tasks/send-email.js - ❌ Does NOT execute (error response)
module.exports = async (ctx) => {
  await emailService.send({
    to: ctx.order.userEmail,
    subject: 'Order confirmed'
  })
}
```

**Result:**
- Step 100 executes → Sends 400 error response
- Steps 200+ skipped
- **Async tasks do NOT execute** ❌
- Client receives error response immediately

### Case 2: Early Success Response (200 OK) → Async Tasks Execute ✅

When sending a successful response (200, 201, etc.) in a middle step, async tasks **still execute**:

```javascript
// steps/100-check-cache.js
module.exports = async (ctx, req, res) => {
  const cached = await cache.get(`product:${req.params.id}`)

  if (cached) {
    // ✅ Success response → Async tasks WILL execute
    res.json(cached)  // 200 OK
    return  // ⚠️ return is required!
  }

  // Cache miss → Continue to next step
}

// steps/200-fetch-from-db.js - Skipped on cache hit
module.exports = async (ctx, req, res) => {
  const product = await db.products.findById(req.params.id)
  ctx.product = product
  res.json(product)
}

// async-tasks/log-access.js - ✅ Executes even on cache hit
module.exports = async (ctx) => {
  // Successful response (200 OK) → Async tasks execute!
  await logService.write({
    action: 'product_viewed',
    productId: req.params.id,
    timestamp: new Date()
  })
}
```

**Result:**
- Step 100 executes → Sends 200 OK response (cache hit)
- Steps 200+ skipped
- **Async tasks execute normally** ✅ (treated as successful completion)
- Client receives cached data immediately

### Why the Difference?

Numflow treats **successful early responses (200 OK)** as "successful feature completion":

```typescript
// Internal behavior (src/feature/index.ts)
const result = await executor.execute()

// Success response → Schedule async tasks
if (result.success && this.asyncTasks.length > 0) {
  scheduler.schedule()  // ✅ Execute async tasks
}

// Error response → Don't schedule async tasks
// (result.success === false)
```

**The key distinction:**
- 200 OK = Feature succeeded (just finished early) → Async tasks run ✅
- 4xx/5xx = Feature failed → Async tasks don't run ❌

### How to Handle Conditional Execution

If you need conditional logic in async tasks, use context flags:

```javascript
// steps/100-validate.js
module.exports = async (ctx, req, res) => {
  if (!req.body.productId) {
    ctx.isError = true  // ← Set flag
    res.status(400).json({ error: 'productId required' })
    return
  }
  ctx.validated = true
}

// async-tasks/send-email.js
module.exports = async (ctx) => {
  // Skip email on error response
  if (ctx.isError) {
    console.log('Error response, skipping email')
    return
  }

  await emailService.send({
    to: ctx.order.userEmail,
    subject: 'Order confirmed'
  })
}
```

### Summary Table

| Response Type | HTTP Status | Remaining Steps | Async Tasks |
|--------------|-------------|----------------|-------------|
| **Success (normal)** | 200-299 (last step) | ✅ All executed | ✅ **Execute** |
| **Success (early)** | 200-299 (middle step) | ❌ Skipped | ✅ **Execute** ⭐ |
| **Error (early)** | 400-599 (middle step) | ❌ Skipped | ❌ Do NOT execute |
| **throw Error** | - | ❌ Stopped | ❌ Do NOT execute |
| **No response** | - | ✅ All executed | ❌ Error thrown |

### Real-World Scenarios

**Scenario 1: API Rate Limiting**
```javascript
// steps/100-check-rate-limit.js
module.exports = async (ctx, req, res) => {
  const limit = await rateLimiter.check(req.ip)

  if (limit.exceeded) {
    // Error response → No analytics logged
    res.status(429).json({ error: 'Rate limit exceeded' })
    return
  }
}

// async-tasks/log-analytics.js
// ✅ Only logs successful requests (not rate-limited ones)
module.exports = async (ctx) => {
  await analytics.track('api_request', { userId: ctx.userId })
}
```

**Scenario 2: Cache Optimization**
```javascript
// steps/100-check-cache.js
module.exports = async (ctx, req, res) => {
  const cached = await cache.get(req.url)

  if (cached) {
    // Success response → Analytics still logged
    res.json(cached)  // 200 OK
    return
  }
}

// async-tasks/log-analytics.js
// ✅ Logs both cache hits and misses
module.exports = async (ctx) => {
  await analytics.track('api_request', {
    userId: ctx.userId,
    cacheHit: !!cached
  })
}
```

### Best Practice

**✅ Use early success response (200 OK) when:**
- Cache hit (still want to log analytics)
- Partial success (some data available)
- Fallback data served

**✅ Use early error response (4xx/5xx) when:**
- Validation failure
- Authentication/Authorization failure
- Resource not found
- Don't want side effects to execute

---

## Error Handling

### Default Behavior

By default, async task failures are **logged** but don't affect the response:

```javascript
asyncTasks: [
  async (ctx) => {
    throw new Error('Email service down!')
    // Error is logged, but other tasks continue
  },
  async (ctx) => {
    await smsService.send(/* ... */)
    // This task still runs
  }
]
```

**Console Output**:
```
[AsyncTaskScheduler] ERROR: Async task "send-email.js" failed: Email service down!
[AsyncTaskScheduler] Executing async task: send-sms.js
[AsyncTaskScheduler] Async task "send-sms.js" completed in 1234ms
```

### Custom Error Handling

Add error handling within async tasks for more control:

```javascript
module.exports = async (ctx) => {
  try {
    await emailService.send(/* ... */)
  } catch (error) {
    // Log to external service
    await errorTracker.log({
      type: 'async_task_failure',
      task: 'send-email',
      error: error.message,
      context: ctx
    })

    // Optional: Retry logic
    if (error.code === 'RATE_LIMIT') {
      await sleep(5000)
      await emailService.send(/* ... */) // Retry
    }
  }
}
```

### Accessing Feature Error Handler

The feature's `onError` handler does **not** catch async task errors. Handle errors within async tasks:

```javascript
module.exports = numflow.feature({
  onError: async (error, ctx, req, res) => {
    // This catches errors from STEPS only
    // NOT from async tasks
  },

  asyncTasks: [
    async (ctx) => {
      try {
        // Your async task logic
      } catch (error) {
        // Handle error here
      }
    }
  ]
})
```

---

## Best Practices

### 1. Keep Async Tasks Idempotent

Async tasks may be executed multiple times (e.g., after server restart). Make them idempotent:

```javascript
module.exports = async (ctx) => {
  // ✅ GOOD: Check if already sent
  if (await emailLog.exists(ctx.order.id)) {
    return // Already sent, skip
  }

  await emailService.send(/* ... */)
  await emailLog.record(ctx.order.id)
}
```

### 2. Add Timeouts

Prevent async tasks from hanging indefinitely:

```javascript
module.exports = async (ctx) => {
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Timeout')), 5000)
  )

  await Promise.race([
    emailService.send(/* ... */),
    timeoutPromise
  ])
}
```

### 3. Use a Task Queue for Reliability

For critical operations, use a proper task queue (Bull, BullMQ, etc.):

```javascript
module.exports = async (ctx) => {
  // Add to persistent queue
  await taskQueue.add('send-email', {
    orderId: ctx.order.id,
    userId: ctx.user.id
  }, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 }
  })
}
```

### 4. Log Everything

Add comprehensive logging for debugging:

```javascript
module.exports = async (ctx) => {
  console.log('[send-email] Starting...', {
    orderId: ctx.order.id,
    userId: ctx.user.id
  })

  try {
    await emailService.send(/* ... */)
    console.log('[send-email] Success!')
  } catch (error) {
    console.error('[send-email] Failed:', error.message)
    throw error
  }
}
```

### 5. Don't Block Other Tasks

Keep async tasks fast and focused:

```javascript
// ❌ BAD: Heavy operation blocks other tasks
module.exports = async (ctx) => {
  await generatePDFReport(ctx.order) // Takes 30 seconds!
  await sendEmail(ctx.order)
}

// ✅ GOOD: Offload to separate queue
module.exports = async (ctx) => {
  await taskQueue.add('generate-pdf', { orderId: ctx.order.id })
  await sendEmail(ctx.order) // Fast!
}
```

---

## Examples

### Example 1: E-commerce Order Confirmation

```javascript
// features/api/orders/@post/index.js
module.exports = numflow.feature({})

// features/api/orders/@post/async-tasks/send-confirmation-email.js
module.exports = async (ctx) => {
  const { user, order } = ctx

  await emailService.send({
    to: user.email,
    subject: `Order Confirmation #${order.id}`,
    template: 'order-confirmation',
    data: {
      userName: user.name,
      orderId: order.id,
      items: order.items,
      totalAmount: order.totalAmount
    }
  })
}

// features/api/orders/@post/async-tasks/send-sms.js
module.exports = async (ctx) => {
  await smsService.send({
    to: ctx.user.phone,
    message: `Thank you for your order #${ctx.order.id}! We'll notify you when it ships.`
  })
}

// features/api/orders/@post/async-tasks/update-analytics.js
module.exports = async (ctx) => {
  await analytics.track('order_created', {
    userId: ctx.user.id,
    orderId: ctx.order.id,
    amount: ctx.order.totalAmount,
    items: ctx.order.items.length
  })
}
```

### Example 2: User Registration

```javascript
// features/api/auth/register/@post/async-tasks/send-welcome-email.js
module.exports = async (ctx) => {
  await emailService.send({
    to: ctx.user.email,
    subject: 'Welcome to Our Platform!',
    template: 'welcome',
    data: { userName: ctx.user.name }
  })
}

// features/api/auth/register/@post/async-tasks/create-default-settings.js
module.exports = async (ctx) => {
  await userSettings.create({
    userId: ctx.user.id,
    language: 'en',
    theme: 'light',
    notifications: true
  })
}

// features/api/auth/register/@post/async-tasks/trigger-webhook.js
module.exports = async (ctx) => {
  // Notify CRM system
  await webhookService.send('https://crm.example.com/webhooks/user-registered', {
    userId: ctx.user.id,
    email: ctx.user.email,
    timestamp: new Date().toISOString()
  })
}
```

### Example 3: Blog Post Publication

```javascript
// features/api/blog/posts/@post/async-tasks/notify-subscribers.js
module.exports = async (ctx) => {
  const subscribers = await Subscriber.findAll()

  for (const subscriber of subscribers) {
    await emailService.send({
      to: subscriber.email,
      subject: `New Post: ${ctx.post.title}`,
      template: 'new-post',
      data: { post: ctx.post }
    })
  }
}

// features/api/blog/posts/@post/async-tasks/update-search-index.js
module.exports = async (ctx) => {
  await searchEngine.index('posts', {
    id: ctx.post.id,
    title: ctx.post.title,
    content: ctx.post.content,
    tags: ctx.post.tags
  })
}

// features/api/blog/posts/@post/async-tasks/purge-cdn-cache.js
module.exports = async (ctx) => {
  await cdn.purge([
    '/blog',
    `/blog/${ctx.post.slug}`,
    '/blog/rss'
  ])
}
```

---

## Troubleshooting

### Issue 1: Async Tasks Not Executing

**Problem**: Async tasks don't run

**Solution**: Ensure steps complete successfully:

```javascript
steps: [
  async (ctx, req, res) => {
    // ✅ Must send response
    res.json({ success: true })
    return // Must return to end execution
  }
]
```

### Issue 2: Context Not Available

**Problem**: `ctx` is undefined in async tasks

**Solution**: Initialize context properly:

```javascript
module.exports = numflow.feature({
  contextInitializer: (ctx, req, res) => {
    ctx.userId = req.user.id
    // ... other data
  }
})
```

### Issue 3: Tasks Executing Too Slowly

**Problem**: Async tasks block each other

**Solution**: Use Promise.all for parallel execution:

```javascript
// ❌ Sequential (slow)
asyncTasks: [
  async (ctx) => { await task1() }, // 5 seconds
  async (ctx) => { await task2() }, // 5 seconds
  // Total: 10 seconds
]

// ✅ Parallel (fast)
asyncTasks: [
  async (ctx) => {
    await Promise.all([
      task1(), // 5 seconds
      task2()  // 5 seconds (runs in parallel)
    ])
    // Total: 5 seconds
  }
]
```

---

## Related

### Documentation
- **[Feature-First Architecture](./feature-first.md)** - Core concepts
- **[Getting Started](./getting-started.md)** - Basic setup
- **[Error Handling](../advanced/error-handling.md)** - Error handling strategies

### API Reference
- **[Feature API](../api/feature.md)** - Complete Feature API
- **[Application API](../api/application.md)** - Application methods

### Examples
- **[Feature-First Examples](../../examples/07-feature-first/)** - Complete examples
- **[Async Tasks Example](../../examples/07-feature-first-old/03-async-tasks-feature.js)** - Detailed async tasks demo

---

**Last Updated**: 2025-10-20
**Numflow Version**: 0.1.0+
