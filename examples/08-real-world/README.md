# Real World Projects

Complete examples that can be used in real-world projects.

## 📚 Project List

### 1. Todo API

Complete Todo application with RESTful API pattern.

**Features**:
- CRUD operations (Create, Read, Update, Delete)
- User authentication
- Input validation
- Error handling
- Pagination
- Filtering and sorting

**Directory**: `todo-api/`

### 2. Blog API (Planned)

Blog system with user authentication and permission management.

**Features**:
- User registration/login
- Post CRUD
- Comment system
- Tags and categories
- Authentication/authorization
- File upload

### 3. E-commerce API (Planned)

E-commerce system utilizing Feature-First architecture.

**Features**:
- Product management
- Shopping cart
- Order processing (Feature-First)
- Payment integration
- Inventory management
- Transaction management

## 🚀 Getting Started

### Run Todo API

```bash
cd examples/08-real-world/todo-api
node server.js
```

Test:
```bash
# List all todos
curl http://localhost:3000/api/todos

# Create todo
curl -X POST http://localhost:3000/api/todos \
  -H "Content-Type: application/json" \
  -d '{"title":"Learn Numflow","description":"Study Feature-First"}'

# Update todo
curl -X PUT http://localhost:3000/api/todos/1 \
  -H "Content-Type: application/json" \
  -d '{"completed":true}'

# Delete todo
curl -X DELETE http://localhost:3000/api/todos/1
```

## 📖 Learning Points

### RESTful API Design

```
GET    /api/todos          - List
GET    /api/todos/:id      - Get single
POST   /api/todos          - Create
PUT    /api/todos/:id      - Full update
PATCH  /api/todos/:id      - Partial update
DELETE /api/todos/:id      - Delete
```

### Project Structure

```
todo-api/
├── server.js           # Entry point
├── routes/             # Route definitions
│   └── todos.js
├── middleware/         # Middleware
│   ├── auth.js
│   └── validate.js
├── models/             # Data models
│   └── todo.js
└── utils/              # Utilities
    └── errors.js
```

## 🎯 Feature-First Project Structure

Example project structure using Feature-First architecture:

```
project-structures/feature-first/
├── src/
│   ├── features/
│   │   ├── orders/
│   │   │   ├── create-order/
│   │   │   │   ├── index.js          # Feature definition
│   │   │   │   ├── steps/            # Step files
│   │   │   │   │   ├── 100-validate.js
│   │   │   │   │   ├── 200-check-stock.js
│   │   │   │   │   ├── 300-reserve.js
│   │   │   │   │   ├── 400-payment.js
│   │   │   │   │   └── 500-create.js
│   │   │   │   └── async-tasks/     # Async tasks
│   │   │   │       ├── send-email.js
│   │   │   │       └── send-sms.js
│   │   │   └── get-orders/
│   │   └── users/
│   ├── middleware/
│   └── utils/
├── server.js
└── package.json
```

Detailed example: `../project-structures/feature-first/`

## 💡 Learning Guide

### Step 1: Understand Todo API

First, learn RESTful patterns with simple Todo API.

### Step 2: Apply Feature-First

Apply Feature-First to features with complex business logic.

### Step 3: Real Project

Build your own project based on what you learned.

## Next Steps

- **[09-express-migration](../09-express-migration/)** - Migrate Express project to Numflow
- **[project-structures/feature-first](../project-structures/feature-first/)** - Complete Feature-First project structure
