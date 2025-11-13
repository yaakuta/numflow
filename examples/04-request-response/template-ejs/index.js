/**
 * EJS Template Rendering Example
 *
 * Demonstrates how to use the EJS template engine in the Numflow framework.
 */

const numflow = require('../../../dist/cjs/index.js')

const app = numflow()

// Configure template engine
app.set('view engine', 'ejs')
app.set('views', __dirname + '/views')

// Static files (CSS, JS, images)
app.use('/static', numflow.static(__dirname + '/public'))

// Mock user data
const users = [
  { id: 1, name: 'Alice', email: 'alice@example.com', role: 'Admin' },
  { id: 2, name: 'Bob', email: 'bob@example.com', role: 'User' },
  { id: 3, name: 'Charlie', email: 'charlie@example.com', role: 'User' },
  { id: 4, name: 'Diana', email: 'diana@example.com', role: 'Moderator' },
]

// Homepage
app.get('/', (req, res) => {
  res.render('index', {
    title: 'EJS Template Example',
    message: 'Welcome to Numflow with EJS!',
    features: [
      'Fast and lightweight',
      'Express-compatible',
      'Easy template rendering',
      'Built-in EJS support'
    ]
  })
})

// User list
app.get('/users', (req, res) => {
  res.render('users', {
    title: 'User List',
    users: users,
    totalUsers: users.length
  })
})

// User detail
app.get('/users/:id', (req, res) => {
  const userId = parseInt(req.params.id)
  const user = users.find(u => u.id === userId)

  if (!user) {
    return res.status(404).render('404', {
      title: '404 - User Not Found',
      message: `User with ID ${userId} not found`
    })
  }

  res.render('user-detail', {
    title: `User: ${user.name}`,
    user: user
  })
})

// About page
app.get('/about', (req, res) => {
  res.render('about', {
    title: 'About Numflow',
    framework: 'Numflow',
    version: '0.1.0',
    description: 'Express-compatible high-performance web framework for Node.js'
  })
})

// 404 page
app.use((req, res) => {
  res.status(404).render('404', {
    title: '404 - Page Not Found',
    message: `Page "${req.url}" not found`
  })
})

// Start server
const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`🚀 EJS Example Server running on http://localhost:${PORT}`)
  console.log(`   - Home: http://localhost:${PORT}/`)
  console.log(`   - Users: http://localhost:${PORT}/users`)
  console.log(`   - About: http://localhost:${PORT}/about`)
})
