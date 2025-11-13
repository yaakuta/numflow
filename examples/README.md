# Numflow Framework - Examples Collection 📚

A comprehensive collection of examples to learn the Numflow framework.

> **Express Compatible, 3x Faster Performance, Feature-First Architecture** 🚀

## 🎯 Learning Path

New to Numflow? Follow this learning path:

### 🌱 Beginner - 30 minutes

Learn the basics of Numflow.

1. **[01-getting-started](./01-getting-started/)** - From Hello World to JSON API
   - `01-hello-world.js` - Simplest server
   - `02-basic-routing.js` - Basic routing
   - `03-json-api.js` - Building REST APIs

### 🌿 Intermediate - 1 hour

Learn commonly used patterns in real-world projects.

2. **[02-routing](./02-routing/)** - High-performance routing patterns
   - Dynamic parameters (`/users/:id`)
   - Query strings (`?page=1&limit=10`)
   - Route chaining

3. **[03-middleware](./03-middleware/)** - Middleware system
   - Basic middleware
   - Multiple middleware chains
   - Error middleware

4. **[04-request-response](./04-request-response/)** - Advanced Request/Response
   - Request properties (headers, query, params)
   - Response methods (json, redirect, status)
   - Body parsing (automatic!)

### 🌲 Advanced - 2 hours

Learn Numflow's powerful features.

5. **[05-error-handling](./05-error-handling/)** - Unified error handling
   - Custom error classes
   - Global error handlers
   - Feature error handling

6. **[06-advanced](./06-advanced/)** - Advanced middleware
   - CORS, Compression
   - Static file serving
   - Cookies, Sessions

7. **[07-feature-first](./07-feature-first/)** ⭐ **Core Differentiator!**
   - Feature-First architecture
   - Automatic Step execution
   - Error handling via onError
   - Async tasks

### 🏭 Real World - 3 hours

Build real-world projects.

8. **[08-real-world](./08-real-world/)** - Production projects
   - Todo API (REST API pattern)
   - Blog API (Auth, Authorization)
   - E-commerce API (Feature-First)

9. **[09-express-migration](./09-express-migration/)** - Express migration
   - Express code → Numflow code
   - Before/After comparison
   - Migration checklist

10. **[10-todo-app-ejs](./10-todo-app-ejs/)** ⭐ **Complete Full-Stack Example!**
   - Bulk Registration (Convention over Configuration)
   - EJS Template Engine (res.render())
   - Feature-First pattern
   - Beautiful UI/UX
   - REST API (GET, POST, PUT, DELETE)

11. **[11-javascript-jsdoc](./11-javascript-jsdoc/)** - JavaScript + JSDoc
   - Type hints without TypeScript
   - Using JSDoc comments
   - VS Code IntelliSense

12. **[12-llm-chat-api](./12-llm-chat-api/)** ⭐ **Retry & Fallback Pattern!**
   - Real-world usage of `numflow.retry()`
   - Multiple LLM Providers (OpenAI, OpenRouter, Gemini)
   - Automatic Provider Fallback (on Rate Limit)
   - Exponential Backoff Retry (on Timeout)
   - Context-based state management

## 📁 Directory Structure

```
examples/
├── 01-getting-started/          ⭐ Start here!
│   ├── 01-hello-world.js
│   ├── 02-basic-routing.js
│   └── 03-json-api.js
│
├── 02-routing/                  Routing patterns
│   ├── 01-route-parameters.js
│   ├── 02-query-strings.js
│   ├── 03-multiple-parameters.js
│   └── 04-route-chaining.js
│
├── 03-middleware/               Middleware system
│   ├── 01-basic-middleware.js
│   ├── 02-multiple-middleware.js
│   ├── 03-feature-middleware.js
│   └── 04-error-middleware.js
│
├── 04-request-response/         Request/Response
│   ├── 01-request-properties.js
│   ├── 02-response-methods.js
│   ├── 03-body-parsing.js
│   └── 04-content-negotiation.js
│
├── 05-error-handling/           Error handling
│   ├── 01-basic-errors.js
│   ├── 02-custom-errors.js
│   ├── 03-global-error-handler.js
│   └── 04-feature-error-handling.js
│
├── 06-advanced/                 Advanced middleware
│   ├── 01-cors.js
│   ├── 02-compression.js
│   ├── 03-static-files.js
│   ├── 04-cookies.js
│   └── 05-sessions.js
│
├── 07-feature-first/            ⭐ Core feature!
│   ├── 01-simple-feature.js
│   ├── 02-transaction-feature.js (onError examples)
│   ├── 03-async-tasks-feature.js
│   └── 04-middleware-integration.js
│
├── 08-real-world/               Production projects
│   └── todo-api/
│
├── 09-express-migration/        Express migration
│   ├── 01-before-express.js
│   └── 02-after-numbers.js
│
├── 10-todo-app-ejs/             ⭐ Full-Stack TODO app
│   ├── app.js                   Bulk Registration!
│   ├── features/                Convention over Configuration
│   │   └── todos/
│   │       ├── get/             GET /todos
│   │       ├── post/            POST /todos
│   │       └── [id]/
│   │           ├── put/         PUT /todos/:id
│   │           └── delete/      DELETE /todos/:id
│   ├── views/
│   │   └── index.ejs            EJS template
│   └── public/
│       └── style.css            Stylesheet
│
├── 11-javascript-jsdoc/         JavaScript + JSDoc
│   └── app.js                   Type hint examples
│
├── 12-llm-chat-api/             ⭐ LLM + Retry/Fallback
│   ├── app.js                   Chat API server
│   ├── features/
│   │   └── api/
│   │       └── chat/
│   │           └── post/        POST /api/chat
│   │               ├── index.js         retry() logic!
│   │               └── steps/
│   │                   ├── 100-validate.js
│   │                   ├── 200-prepare-messages.js
│   │                   └── 300-call-llm.js
│   └── test-api.sh              Test script
```

## 🚀 Quick Start

### 1. Hello World (5 minutes)

```bash
# Run the simplest server
node examples/01-getting-started/01-hello-world.js

# Open http://localhost:3000 in your browser
```

### 2. JSON API (10 minutes)

```bash
# Run REST API server
node examples/01-getting-started/03-json-api.js

# Test
curl http://localhost:3000/api/users
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"John","email":"john@example.com"}'
```

### 3. Feature-First (30 minutes)

```bash
# Run Feature-First example
node examples/07-feature-first/01-simple-feature.js

# Test
curl -X POST http://localhost:3000/api/greet \
  -H "Content-Type: application/json" \
  -d '{"name":"World"}'
```

## ⭐ Core Features of Numflow

### 1. 100% Express Compatible

```javascript
// Express code works as-is!
const numbers = require('numflow') // Instead of require('express')
const app = numbers()

app.get('/', (req, res) => {
  res.json({ message: 'Hello' })
})
```

### 2. 3x Faster Performance

```
Express:  14,124 req/s
Numflow:  43,865 req/s  ← 211% improvement! 🚀
```

- Radix Tree router (find-my-way)
- O(log n) lookup speed (Express is O(n))

### 3. Feature-First Architecture ⭐

**Traditional Approach**:
```javascript
// ❌ 149 lines of complex Orchestrator class
class OrderOrchestrator {
  async execute() {
    await this.validateOrder()
    await this.checkInventory()
    // ... 10+ methods
  }
}
```

**Feature-First**:
```javascript
// ✅ 25 lines of declarative configuration
module.exports = feature({
  method: 'POST',
  path: '/api/orders',
  steps: './steps',           // 100-, 200-, 300-... auto-execute!
  onError: async (error, context, req, res) => {
    // Error handling and rollback logic
    res.statusCode = 500
    res.end(JSON.stringify({ error: error.message }))
  },
  asyncTasks: './async-tasks',
})
```

**Benefits**:
- 📁 Understand entire flow just by looking at file list
- ➕ Add Steps by adding files (no code modification needed)
- 🔄 Systematic error handling via onError
- ⚡ Automatic async task scheduling

## 📊 Examples by Difficulty

### ⭐ Beginner

| Example | Description | Time |
|---------|-------------|------|
| Hello World | Simplest server | 5min |
| Basic Routing | GET, POST, PUT, DELETE | 10min |
| JSON API | Building REST API | 15min |

### ⭐⭐ Intermediate

| Example | Description | Time |
|---------|-------------|------|
| Route Parameters | Dynamic routing | 10min |
| Query Strings | Query string handling | 10min |
| Middleware | Middleware chains | 20min |
| Request/Response | Advanced Request/Response | 20min |

### ⭐⭐⭐ Advanced

| Example | Description | Time |
|---------|-------------|------|
| Error Handling | Unified error handling | 30min |
| Feature-First | Auto-orchestration | 60min |
| Real World | Production projects | 3hrs |

## 🎓 Learning Tips

### 1. Follow the sequence

Learn in order: 01 → 02 → 03 → ... Your skills will improve naturally.

### 2. Run the code yourself

```bash
# Run example
node examples/01-getting-started/01-hello-world.js

# Modify and run again
# Learn by iteration!
```

### 3. Test with curl

```bash
# GET request
curl http://localhost:3000/api/users

# POST request
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"John"}'

# PUT/DELETE requests
curl -X PUT http://localhost:3000/api/users/1 -d '{"name":"Jane"}'
curl -X DELETE http://localhost:3000/api/users/1
```

### 4. Read with documentation

Reading each example's README.md will deepen your understanding.

## 🛠️ Development Environment Setup

### Requirements

- **Node.js**: 16.x or higher
- **npm**: 7.x or higher

### Build

```bash
# From project root
npm install
npm run build
```

### Running Examples

```bash
# Run individual example
node examples/01-getting-started/01-hello-world.js

# Run all examples in a directory
node examples/02-routing/01-route-parameters.js
node examples/02-routing/02-query-strings.js
```

## 📚 Additional Resources

### Documentation

- **[GETTING_STARTED.md](../docs/GETTING_STARTED.md)** - User guide
- **[API.md](../docs/API.md)** - API reference
- **[FEATURES.md](../docs/FEATURES.md)** - Feature details
- **[PERFORMANCE.md](../docs/PERFORMANCE.md)** - Performance guide & Best Practices
- **[ROADMAP.md](../docs/ROADMAP.md)** - Development roadmap

## 🐛 Troubleshooting

### Q: Port is already in use

Another process is using port 3000.

```bash
# Check process using port
lsof -i :3000        # macOS/Linux
netstat -ano | findstr :3000  # Windows

# Kill process or use different port
```

### Q: Cannot find module

Build is required.

```bash
# From project root
npm run build
```

### Q: Example doesn't run

Check your Node.js version.

```bash
node --version  # Requires v16.x or higher
```

## 💡 Feedback

For feedback or suggestions about examples:

- **GitHub Issues**: https://github.com/gazerkr/numflow/issues
- **Discussions**: https://github.com/gazerkr/numflow/discussions

## 🏆 Next Steps

### After completing all examples

1. **Build a real project**
   - Todo API
   - Blog API
   - E-commerce API

2. **Migrate an Express project**
   - See [09-express-migration](./09-express-migration/)

3. **Contribute to open source**
   - Add new examples
   - Improve documentation
   - Report bugs

---

**Last Updated**: 2025-10-20 (Added 12-llm-chat-api - Retry/Fallback pattern examples)
**Previous Update**: 2025-10-16 (Added 10-todo-app-ejs - Full-Stack example)

**Ready to start?** → [01-getting-started](./01-getting-started/) 🚀
