# Advanced Middleware

Learn advanced middleware patterns commonly used in production.

## 📚 Learning Objectives

- CORS (Cross-Origin Resource Sharing)
- Compression (response compression)
- Static Files (serving static files)
- Cookies (cookie handling)
- Sessions (session management)

## 💡 Core Concepts

### 1. CORS

Bypass browser's Same-Origin Policy to allow requests from different domains.

```javascript
function cors(req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  next()
}

app.use(cors)
```

### 2. Compression

Compress responses to reduce network traffic.

```javascript
// Compatible with Express's compression middleware
const compression = require('compression')
app.use(compression())
```

### 3. Static Files

Serve static files (HTML, CSS, JS, images).

```javascript
const numbers = require('numflow')
const app = numbers()

// Serve files from public directory
app.use('/static', numbers.static('public'))

// Access example:
// http://localhost:3000/static/styles.css
// → serves public/styles.css file
```

### 4. Cookies

Read and set cookies.

```javascript
// Read cookies
app.get('/api/check', (req, res) => {
  const cookies = req.headers.cookie || ''
  // Need to parse "name=value; name2=value2" format

  res.json({ cookies })
})

// Set cookies
app.get('/api/set-cookie', (req, res) => {
  res.setHeader('Set-Cookie', 'user=alice; HttpOnly; Max-Age=3600')
  res.json({ message: 'Cookie set' })
})
```

### 5. Sessions

Manage sessions to maintain user state.

```javascript
// Compatible with Express's express-session
const session = require('express-session')

app.use(
  session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, // true for HTTPS
  })
)

app.get('/api/login', (req, res) => {
  req.session.userId = 123
  res.json({ message: 'Logged in' })
})

app.get('/api/profile', (req, res) => {
  if (req.session.userId) {
    res.json({ userId: req.session.userId })
  } else {
    res.status(401).json({ error: 'Unauthorized' })
  }
})
```

## 📖 Practical Patterns

### Complete Production Setup

```javascript
const numbers = require('numflow')
const compression = require('compression')
const helmet = require('helmet')

const app = numbers()

// 1. Security headers (Helmet)
app.use(helmet())

// 2. CORS
app.use(cors)

// 3. Compression
app.use(compression())

// 4. Static files
app.use('/static', numbers.static('public'))

// 5. Body parsing (automatic)
// Numflow automatically parses JSON body

// 6. Sessions
app.use(session({ /* options */ }))

// 7. Custom middleware
app.use(logger)
app.use(authenticate)

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Hello' })
})

// Error handler (last)
app.use(errorHandler)
```

## 🎯 Express Compatibility

Numflow is 100% compatible with Express middleware:

```javascript
// Express middleware can be used as-is
const helmet = require('helmet')
const morgan = require('morgan')
const multer = require('multer')

app.use(helmet())
app.use(morgan('combined'))

const upload = multer({ dest: 'uploads/' })
app.post('/upload', upload.single('file'), (req, res) => {
  res.json({ file: req.file })
})
```

## 📚 Additional Resources

### Popular Express Middleware

- **helmet**: Set security headers
- **morgan**: HTTP request logging
- **compression**: Gzip compression
- **cors**: CORS configuration
- **express-session**: Session management
- **passport**: Authentication (OAuth, JWT, etc.)
- **multer**: File uploads
- **express-validator**: Input validation

## Next Steps

- **[07-feature-first](../07-feature-first/)** ⭐ - Feature-First architecture (Core!)
- **[08-real-world](../08-real-world/)** - Real-world projects
