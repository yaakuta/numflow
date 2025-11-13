# Feature-First Examples with Convention over Configuration

These examples are structured to help you learn Numflow framework's **Feature-First Architecture** and **Convention over Configuration** step by step.

## 📚 Example List

### 01-convention-basics
**Learn Basic Convention Concepts**

Learn how to automatically infer HTTP method and path from folder structure.

```bash
cd 01-convention-basics
node app.js
```

**Learning Objectives:**
- Basic principles of Convention over Configuration
- Auto-infer method from folder structure (get/post/put/delete/patch)
- Auto-infer path from folder structure
- Using inline steps

**Folder Structure:**
```
features/
  greet/
    @post/
      index.js    ← method: POST, path: /greet auto-inferred!
```

---

### 02-convention-with-steps
**Separating Steps into Files**

Learn how to manage steps as separate files.

```bash
cd 02-convention-with-steps
node app.js
```

**Learning Objectives:**
- Separate steps into individual files
- Automatic detection of `steps/` folder
- Step file naming convention (100-xxx.js, 200-xxx.js)
- Separate complex business logic into steps

**Folder Structure:**
```
features/
  api/
    users/
      @post/
        index.js
        steps/
          100-validate.js
          200-normalize.js
          300-create-user.js
```

---

### 03-full-convention
**Full Convention Usage**

Create a complete Feature that auto-detects both Steps and Async Tasks.

```bash
cd 03-full-convention
node app.js
```

**Learning Objectives:**
- Auto-detect both Steps + Async Tasks
- Automatic detection of `async-tasks/` folder
- Execute async tasks after transaction completion
- Real-world order system example

**Folder Structure:**
```
features/
  api/
    v1/
      orders/
        @post/
          index.js
          steps/
            100-validate-order.js
            200-check-inventory.js
            300-create-order.js
          async-tasks/
            send-email.js
            update-analytics.js
```

---

### 04-transaction
**Real-World Transaction Management**

Learn transaction management through onError handler.

```bash
cd 04-transaction
node app.js
```

**Learning Objectives:**
- Handle errors with onError handler
- Start transaction in contextInitializer
- Automatic rollback on error
- Real-world transfer system example

**Folder Structure:**
```
features/
  api/
    transfer/
      @post/
        index.js
        steps/
          100-validate.js
          200-check-accounts.js
          300-withdraw.js
          400-deposit.js
          500-record-history.js
```

---

## 🎯 Learning Order

1. **01-convention-basics** → Basic convention concepts
2. **02-convention-with-steps** → Separate steps into files
3. **03-full-convention** → Full convention (Steps + Async Tasks)
4. **04-transaction** → Real-world transaction management

---

## 💡 Convention Rules Summary

### 1. HTTP Method Inference
Automatically infer HTTP method from folder name:

| Folder Name | HTTP Method |
|-------------|-------------|
| `@get/` | GET |
| `@post/` | POST |
| `@put/` | PUT |
| `@patch/` | PATCH |
| `@delete/` | DELETE |

### 2. Path Inference
Automatically infer API path from folder structure:

| Folder Structure | API Path |
|-----------------|----------|
| `/features/users/@get/` | `/users` |
| `/features/api/v1/users/@post/` | `/api/v1/users` |
| `/features/users/[id]/@get/` | `/users/:id` (dynamic route) |

### 3. Auto-detect Steps
Automatically detect and load `steps/` folder if present:

```
features/users/@post/
  index.js
  steps/           ← Auto-detected!
    100-xxx.js
    200-xxx.js
```

### 4. Auto-detect Async Tasks
Automatically detect and load `async-tasks/` folder if present:

```
features/orders/@post/
  index.js
  steps/
    ...
  async-tasks/     ← Auto-detected!
    send-email.js
    update-stats.js
```

---

## 🔧 Manual Configuration (Override Convention)

If you don't like the convention, you can manually configure:

```javascript
module.exports = numbers.feature({
  // Ignore convention and configure manually
  method: 'POST',
  path: '/custom/path',
  steps: './my-steps',
  asyncTasks: './my-async-tasks',

  // Rest remains the same
  contextInitializer: (req, res) => ({ ... }),
  onError: async (error, context, req, res) => { ... },
})
```

---

## 📖 Additional Learning Resources

- [Feature-First Architecture Guide](../../docs/FEATURES.md)
- [Convention over Configuration Documentation](../../docs/CONVENTIONS.md)
- [API Reference](../../docs/API.md)
