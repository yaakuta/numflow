# 05. Bulk Feature Registration (Auto Scan)

Use **app.registerFeatures()** to automatically scan and register all Features in the features directory.

## 🌟 Core Concepts

1. **Recursive Scanning**: Recursively scan all subdirectories in features directory
2. **Convention over Configuration**: Automatically infer HTTP method and path from folder structure
3. **Auto-Registration**: Automatically register all Features to router
4. **Scalability**: Register hundreds of Features with just one line of code

## 📁 Project Structure

```
05-bulk-registration/
├── app.js                              # Main application
└── features/
    └── api/
        └── v1/
            ├── orders/
            │   ├── @post/                  # POST /api/v1/orders
            │   │   ├── index.js
            │   │   └── steps/
            │   │       ├── 100-validate-order.js
            │   │       ├── 200-create-order.js
            │   │       └── 300-send-confirmation.js
            │   └── [id]/
            │       └── @get/               # GET /api/v1/orders/:id
            │           └── index.js
            └── users/
                └── @get/                   # GET /api/v1/users
                    └── index.js
```

## 🚀 How to Run

```bash
# Start server
node app.js
```

## 📋 Convention Rules

### 1. HTTP Method Inference

Automatically infer HTTP method from folder name:

```
features/
  api/
    orders/
      @get/     → GET /api/orders
      @post/    → POST /api/orders
      @put/     → PUT /api/orders
      @delete/  → DELETE /api/orders
      @patch/   → PATCH /api/orders
```

### 2. Path Inference

Automatically infer API path from folder structure:

```
features/
  api/
    v1/
      orders/
        @post/  → POST /api/v1/orders
```

### 3. Dynamic Route Conversion

`[id]` folder names are automatically converted to `:id` parameters:

```
features/
  api/
    orders/
      [id]/
        @get/   → GET /api/orders/:id
```

## 🧪 Testing

### 1. Create Order (POST /api/v1/orders)

```bash
curl -X POST http://localhost:3000/api/v1/orders \
  -H "Content-Type: application/json" \
  -d '{"product":"MacBook Pro","quantity":1}'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "validated": true,
    "order": {
      "orderId": "ORD-1729098765432",
      "userId": "user-123",
      "product": "MacBook Pro",
      "quantity": 1,
      "status": "pending",
      "createdAt": "2025-10-16T10:00:00.000Z"
    },
    "confirmationSent": true,
    "confirmationTimestamp": "2025-10-16T10:00:01.000Z"
  }
}
```

### 2. Get Order by ID (GET /api/v1/orders/:id)

```bash
curl http://localhost:3000/api/v1/orders/ORD-123
```

**Response:**
```json
{
  "success": true,
  "data": {
    "orderId": "ORD-123",
    "userId": "user-123",
    "product": "MacBook Pro",
    "quantity": 1,
    "status": "delivered",
    "createdAt": "2025-10-15T10:00:00Z",
    "deliveredAt": "2025-10-16T14:30:00Z",
    "formatted": true,
    "fetchedAt": "2025-10-16T10:00:02.000Z"
  }
}
```

### 3. Get All Users (GET /api/v1/users)

```bash
curl http://localhost:3000/api/v1/users
```

**Response:**
```json
{
  "success": true,
  "data": {
    "users": [
      { "userId": "user-1", "name": "Kim Chulsoo", "email": "kim@example.com" },
      { "userId": "user-2", "name": "Lee Younghee", "email": "lee@example.com" },
      { "userId": "user-3", "name": "Park Minsoo", "email": "park@example.com" }
    ],
    "count": 3,
    "metadata": {
      "fetchedAt": "2025-10-16T10:00:03.000Z",
      "version": "v1"
    }
  }
}
```

## 💡 Key Code

### app.js

```javascript
const numbers = require('numflow')
const app = numbers()

// Recursively scan and register all Features in features directory
// Register all APIs with just one line of code!
app.registerFeatures('./features')

// Slight delay until scan completes
setTimeout(() => {
  app.listen(3000, () => {
    console.log('Server running on port 3000')
  })
}, 1000)
```

### features/api/v1/orders/@post/index.js

```javascript
const numbers = require('numflow')

// Auto-inferred by Convention:
// - method: 'POST' (folder name 'post')
// - path: '/api/v1/orders' (folder structure)
// - steps: './steps' (steps directory auto-detected)

module.exports = numbers.feature({
  contextInitializer: (req, res) => ({
    orderData: req.body,
    userId: 'user-123',
  }),

  onError: (error, context, req, res) => {
    console.error('Order creation failed:', error.message)
    res.statusCode = 500
    res.end(JSON.stringify({ error: error.message }))
  },
})
```

## 📚 Learning Points

1. **app.registerFeatures()**: Recursive Feature scanning and auto-registration
2. **Convention over Configuration**: Automatically infer method/path from folder structure
3. **Dynamic Routes**: `[id]` → `:id` automatic conversion
4. **Scalability**: Easily manage hundreds of Features
5. **Maintainability**: Each Feature isolated in its own directory

## 🎯 Next Steps

- **[01-convention-basics](../01-convention-basics/)**: Convention over Configuration basics
- **[02-convention-with-steps](../02-convention-with-steps/)**: Auto-detect steps directory
- **[03-full-convention](../03-full-convention/)**: Full Convention demo
- **[04-transaction](../04-transaction/)**: Transaction pattern

## 📖 Related Docs

- [Feature-First Auto-Orchestration](../../../docs/getting-started/feature-first.md)
- [API Reference](../../../docs/API.md)
