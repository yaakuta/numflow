# TODO App with Numflow Framework

Full-stack TODO application demonstrating **Bulk Registration**, **Feature-First Auto-Orchestration**, and **EJS Template Engine**.

## ✨ Features

- ✅ **Bulk Registration** - Register all Features with one line!
- ✅ **Convention over Configuration** - Auto-generate API from folder structure
- ✅ **Feature-First Pattern** - Auto-execute Step-based business logic
- ✅ **EJS Template Engine** - Server-side rendering with res.render()
- ✅ **REST API** - Full support for GET, POST, PUT, DELETE
- ✅ **Beautiful UI** - Responsive design

## 📁 Project Structure

```
10-todo-app-ejs/
├── app.js                          # Main application (Bulk Registration!)
├── package.json
├── features/                       # Feature folder (Convention!)
│   └── todos/
│       ├── @get/                   # GET /todos - List
│       │   └── index.js
│       ├── @post/                  # POST /todos - Add TODO
│       │   ├── index.js
│       │   └── steps/
│       │       ├── 100-validate.js
│       │       └── 200-create-todo.js
│       └── [id]/
│           ├── @put/               # PUT /todos/:id - Toggle
│           │   ├── index.js
│           │   └── steps/
│           │       └── 100-toggle-todo.js
│           └── @delete/            # DELETE /todos/:id - Delete
│               ├── index.js
│               └── steps/
│                   └── 100-delete-todo.js
├── views/
│   └── index.ejs                   # EJS template
└── public/
    └── style.css                   # Stylesheet
```

## 🚀 Getting Started

### 1. Install Dependencies

```bash
cd examples/10-todo-app-ejs
npm install
```

### 2. Run Server

```bash
npm start
```

Or development mode (auto-restart):

```bash
npm run dev
```

### 3. Open in Browser

```
http://localhost:3000/todos
```

## 🎯 Core Code Explanation

### 1. app.js - Bulk Registration!

```javascript
const numbers = require('numflow')
const app = numbers()

// ===== EJS Configuration =====
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))

// ===== Serve Static Files =====
app.use(serveStatic(path.join(__dirname, 'public')))

// ===== Core! Bulk Registration =====
// Register all Features with one line!
app.registerFeatures('./features')

app.listen(3000)
```

**Done!** That's all. Everything else is handled automatically!

### 2. Convention over Configuration

Create folder structure and API is auto-generated:

| Folder Path | API Endpoint | HTTP Method |
|----------|----------------|-------------|
| `features/todos/@get/` | `/todos` | GET |
| `features/todos/@post/` | `/todos` | POST |
| `features/todos/[id]/@put/` | `/todos/:id` | PUT |
| `features/todos/[id]/@delete/` | `/todos/:id` | DELETE |

**Rules:**
- Folder name (`@get`, `@post`, `@put`, `@delete`) → HTTP Method
- Folder structure → API Path
- `[id]` → `:id` (Dynamic Route)

### 3. Feature File - Almost Empty!

```javascript
// features/todos/@post/index.js
const numbers = require('numflow')

module.exports = numbers.feature({
  // Everything is auto-inferred!
  // method: 'POST' (from folder name)
  // path: '/todos' (from folder structure)
  // steps: './steps' (auto-detected directory)

  // Only extract request data
  contextInitializer: (req, res) => ({
    todoText: req.body.text,
  }),
})
```

### 4. Step Functions - Business Logic

```javascript
// features/todos/@post/steps/100-validate.js
async function validate(context) {
  const { todoText } = context

  if (!todoText || todoText.trim() === '') {
    throw new Error('Please enter TODO content')
  }

  ctx.validation = {
    isValid: true,
    validatedText: todoText.trim(),
  }

  return true
}

module.exports = validate
```

```javascript
// features/todos/@post/steps/200-create-todo.js
async function createTodo(context) {
  const { validatedText } = ctx.validation

  const newTodo = {
    id: global.nextId++,
    text: validatedText,
    completed: false,
  }

  global.todos.push(newTodo)
  ctx.todo = newTodo

  return true
}

module.exports = createTodo
```

**Auto-Execute!** Steps run automatically in filename order:
1. `100-validate.js` → Validate
2. `200-create-todo.js` → Create

### 5. EJS Rendering - res.render()

```javascript
// app.js - Use regular route
app.get('/todos', (req, res) => {
  const todos = global.todos || []
  res.render('index', { todos })
})
```

> 💡 **Note**: GET requests are simple, so use regular routes. Use Features for POST/PUT/DELETE which need complex business logic.

## 📡 API Endpoints

| Method | Endpoint | Description | Request Body |
|--------|----------|-------------|--------------|
| GET | `/todos` | List all TODOs (HTML) | - |
| POST | `/todos` | Add new TODO | `{ "text": "Task" }` |
| PUT | `/todos/:id` | Toggle TODO completion | - |
| DELETE | `/todos/:id` | Delete TODO | - |

### API Testing (curl)

```bash
# List TODOs
curl http://localhost:3000/todos

# Add TODO
curl -X POST http://localhost:3000/todos \
  -H "Content-Type: application/json" \
  -d '{"text":"Learn Numflow Framework"}'

# Toggle TODO completion
curl -X PUT http://localhost:3000/todos/1

# Delete TODO
curl -X DELETE http://localhost:3000/todos/1
```

## 🎨 UI Components

1. **Header** - App title and tech stack badges
2. **Input Form** - Add new TODO
3. **TODO List** - Checkboxes, delete buttons
4. **Statistics** - Total/Completed/Remaining counts
5. **Footer** - Framework info

## 💡 Core Concepts

### Convention over Configuration

Define API with folder structure only, no configuration files.

**Before (Express):**
```javascript
// 100+ lines of route definition code...
app.get('/todos', getTodos)
app.post('/todos', createTodo)
app.put('/todos/:id', updateTodo)
app.delete('/todos/:id', deleteTodo)
```

**After (Numflow):**
```javascript
// Just one line!
app.registerFeatures('./features')
```

### Feature-First Auto-Orchestration

Separate business logic into Steps and they execute sequentially automatically.

**Benefits:**
- ✅ Each Step testable independently
- ✅ Easy to add/remove Steps in the middle
- ✅ Improved code readability
- ✅ Automated error handling

## 🔧 Extensibility

### Database Connection

```javascript
// features/todos/@post/steps/200-create-todo.js
async function createTodo(context) {
  const { validatedText } = ctx.validation

  // Save to database
  const newTodo = await db.todos.create({
    text: validatedText,
    completed: false,
  })

  ctx.todo = newTodo
  return true
}
```

### Add Async Tasks

```javascript
// features/todos/@post/index.js
module.exports = numbers.feature({
  steps: './steps',
  asyncTasks: './async-tasks',  // Auto-detected!
})

// features/todos/@post/async-tasks/send-notification.js
async function sendNotification(context) {
  const { todo } = ctx
  await notificationService.send({
    message: `New TODO added: ${todo.text}`,
  })
}
module.exports = sendNotification
```

### Add Authentication/Authorization

```javascript
// features/todos/@post/index.js
module.exports = numbers.feature({
  middlewares: [authenticate, authorize],  // Feature-level middleware
  contextInitializer: (req, res) => ({
    userId: req.user.id,
    todoText: req.body.text,
  }),
})
```

## 📚 Learning Points

What you can learn from this example:

1. ✅ **Bulk Registration** - Managing Features in large projects
2. ✅ **Convention over Configuration** - Develop with folder structure, no config
3. ✅ **Feature-First Pattern** - Structure Step-based business logic
4. ✅ **EJS Template** - How to use res.render()
5. ✅ **REST API** - Complete CRUD implementation
6. ✅ **Error Handling** - Auto-catch Feature errors

## 🎯 Next Steps

- [ ] Database integration (MongoDB, PostgreSQL)
- [ ] Add user authentication
- [ ] TODO categories feature
- [ ] TODO priorities
- [ ] Search functionality
- [ ] Pagination

## 📖 Related Documentation

- [Feature-First API Documentation](../../docs/api/feature.md)
- [Bulk Registration Guide](../../docs/getting-started/feature-first.md)
- [Numflow Framework Documentation](../../docs/README.md)

---

**Built with ❤️ using Numflow Framework**
