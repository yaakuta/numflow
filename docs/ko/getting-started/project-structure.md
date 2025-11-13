# 프로젝트 구조

애플리케이션이 커지면 좋은 프로젝트 구조가 필요합니다.

## 구조 패턴 선택

Numflow는 프로젝트 규모에 따라 3가지 구조 패턴을 제공합니다:

### 1. 기본 구조 (소규모)
- 간단한 프로토타입이나 MVP
- 1-10개 엔드포인트
- 빠른 개발 가능

```
my-app/
├── src/
│   ├── routes/
│   ├── models/
│   ├── middlewares/
│   └── app.js
└── package.json
```

### 2. 3-Layer 구조 (중규모) ⭐ 권장
- **대부분의 프로젝트에 권장**
- Controller-Service-Repository 패턴
- 10-50개 엔드포인트
- 명확한 관심사 분리

```
my-app/
├── src/
│   ├── controllers/     # HTTP 요청/응답
│   ├── services/        # 비즈니스 로직
│   ├── repositories/    # 데이터베이스
│   ├── routes/
│   ├── middlewares/
│   └── app.js
└── test/
```

### 3. Feature-First 아키텍처 (대규모) ⭐ NEW
- **복잡한 비즈니스 로직에 최적**
- Auto-orchestration 지원
- 여러 단계를 거치는 프로세스
- 기능별 완전 격리
- **암묵적 Feature 지원**: index.js 없이 폴더 구조만으로 Feature 생성 가능

```
my-app/
├── features/
│   ├── todos/
│   │   ├── @get/           # GET /todos (암묵적 Feature - index.js 없음!)
│   │   │   └── steps/
│   │   │       └── 100-list.js
│   │   └── @post/          # POST /todos (명시적 Feature)
│   │       ├── index.js    # contextInitializer, onError 등 설정
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
├── shared/                 # 공유 모듈
└── app.js
```

**💡 Tip**: 간단한 CRUD는 암묵적 Feature(@method + steps/)로, 복잡한 로직은 명시적 Feature(index.js 추가)로!

## 자세한 가이드

프로젝트 구조에 대한 상세한 가이드는 다음 문서를 참고하세요:
- **[프로젝트 구조 가이드](PROJECT_STRUCTURE.md)** - 상세한 설명과 예제 코드
- **[예제 프로젝트](../examples/project-structures/)** - 실제 동작하는 예제

## 빠른 시작 예제

**기본 3-Layer 구조로 시작하기:**

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
    // 비즈니스 로직 (유효성 검증, 데이터 변환 등)
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

**이전**: [목차](./README.md)
