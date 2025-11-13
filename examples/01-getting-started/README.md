# Getting Started

Basic examples for developers new to the Numflow framework.

## 📚 Learning Objectives

- Understanding Numflow framework basics
- Building simple HTTP servers
- Writing basic routing and JSON APIs

## 📂 Example List

| File | Difficulty | Description | Time |
|------|------------|-------------|------|
| `01-hello-world.js` | ⭐ Beginner | Simplest server | 5 min |
| `02-basic-routing.js` | ⭐ Beginner | Basic routing patterns | 10 min |
| `03-json-api.js` | ⭐ Beginner | Building JSON APIs | 15 min |

## 🚀 Quick Start

### 1. Hello World Server

```bash
node examples/01-getting-started/01-hello-world.js
```

Access http://localhost:3000 in browser

### 2. Basic Routing

```bash
node examples/01-getting-started/02-basic-routing.js

# Test in another terminal
curl http://localhost:3000/
curl http://localhost:3000/about
curl http://localhost:3000/contact
```

### 3. JSON API

```bash
node examples/01-getting-started/03-json-api.js

# Get user list
curl http://localhost:3000/api/users

# Create user
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com"}'
```

## 💡 Next Steps

After completing Getting Started, move to the next sections:

- **[02-routing](../02-routing/)** - Advanced routing patterns (parameters, query strings)
- **[03-middleware](../03-middleware/)** - Middleware system
- **[04-request-response](../04-request-response/)** - Advanced Request/Response features

## 📖 Core Concepts

### numflow() Factory Function
```javascript
const numflow = require('numflow')
const app = numflow()
```

### app.listen() Start Server
```javascript
app.listen(3000, () => {
  console.log('Server running on port 3000')
})
```

### Register Basic Routes
```javascript
app.get('/', (req, res) => {
  res.send('Hello World')
})
```

## 🐛 Troubleshooting

**Q: Port 3000 is already in use**
```javascript
// Use a different port
app.listen(4000, () => {
  console.log('Server running on port 4000')
})
```

**Q: Cannot find module**
```bash
# Build from project root
npm run build
```
