# Project Structure

As your application grows, you need a good project structure.

## Choose Structure Pattern

Numflow provides 3 structure patterns based on project scale:

### 1. Basic Structure (Small Scale)
- Simple prototypes or MVPs
- 1-10 endpoints
- Fast development

```
my-app/
├── src/
│   ├── routes/
│   ├── models/
│   ├── middlewares/
│   └── app.js
└── package.json
```

### 2. 3-Layer Architecture (Medium Scale) ⭐ Recommended
- **Recommended for most projects**
- Controller-Service-Repository pattern
- 10-50 endpoints
- Clear separation of concerns

```
my-app/
├── src/
│   ├── controllers/     # HTTP request/response
│   ├── services/        # Business logic
│   ├── repositories/    # Database
│   ├── routes/
│   ├── middlewares/
│   └── app.js
└── test/
```

### 3. Feature-First Architecture (Large Scale) ⭐ NEW
- **Optimal for complex business logic**
- Auto-orchestration support
- Multi-step processes
- Complete feature isolation
- **Implicit Feature support**: Create features with just folder structure, no index.js needed

```
my-app/
├── features/
│   ├── todos/
│   │   ├── @get/           # GET /todos (implicit feature - no index.js!)
│   │   │   └── steps/
│   │   │       └── 100-list.js
│   │   └── @post/          # POST /todos (explicit feature)
│   │       ├── index.js    # contextInitializer, onError, etc.
│   │       ├── steps/
│   │       │   ├── 100-validate.js
│   │       │   └── 200-create.js
│   │       └── async-tasks/
│   │           └── send-notification.js
│   └── api/
│       └── orders/
│           └── @post/      # POST /api/orders
│               ├── index.js
│               └── steps/
├── shared/                 # Shared modules
└── app.js
```

**💡 Tip**: Use implicit features (@method + steps/) for simple CRUD, explicit features (with index.js) for complex logic!

## Detailed Guides

For detailed guides on project structure, see:
- **[Project Structure Guide](PROJECT_STRUCTURE.md)** - Detailed explanations and example code
- **[Example Projects](../examples/project-structures/)** - Working examples

## Quick Start Example

**Starting with Basic 3-Layer Structure:**

```javascript
// routes/user.routes.js
const router = numflow.Router()
const userController = require('../controllers/user.controller')

router.get('/', userController.getAllUsers)
router.post('/', userController.createUser)

module.exports = router

// controllers/user.controller.js
class UserController {
  async getAllUsers(req, res) {
    const users = await userService.getAllUsers()
    res.json(users)
  }

  async createUser(req, res) {
    const user = await userService.createUser(req.body)
    res.status(201).json(user)
  }
}

module.exports = new UserController()

// services/user.service.js
class UserService {
  async getAllUsers() {
    return userRepository.findAll()
  }

  async createUser(userData) {
    // Business logic (validation, data transformation, etc.)
    this.validateUserData(userData)
    return userRepository.create(userData)
  }

  validateUserData(userData) {
    if (!userData.email?.includes('@')) {
      throw new Error('Invalid email')
    }
  }
}

module.exports = new UserService()

// repositories/user.repository.js
class UserRepository {
  async findAll() {
    return db.query('SELECT * FROM users')
  }

  async create(userData) {
    const result = await db.query('INSERT INTO users SET ?', userData)
    return { id: result.insertId, ...userData }
  }
}

module.exports = new UserRepository()
```

---

**Previous**: [Table of Contents](./README.md)
