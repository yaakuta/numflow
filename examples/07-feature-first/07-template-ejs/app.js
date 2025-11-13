/**
 * 07-template-ejs
 *
 * Example combining Feature-First with EJS template engine.
 * Learn how to render templates from Feature steps.
 *
 * Learning Objectives:
 * - Using template engine with Feature-First
 * - Using res.render() in steps
 * - Simple blog post list and detail pages
 * - Route parameters and template rendering
 *
 * How to Run:
 * cd examples/07-feature-first/07-template-ejs
 * node app.js
 *
 * Testing:
 * Browser: http://localhost:3000/posts
 * Browser: http://localhost:3000/posts/1
 */

const numflow = require('../../../dist/cjs/index.js')
const path = require('path')
const serveStatic = require('serve-static')

const app = numflow()

// ===========================================
// Template Engine Configuration
// ===========================================

// Configure EJS template engine
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))

// Serve static files
app.use(serveStatic(path.join(__dirname, 'public')))

// ===========================================
// Global Data (Use database in production)
// ===========================================

global.posts = [
  {
    id: 1,
    title: 'Introducing Numflow Framework',
    author: 'Alice',
    content:
      'Numflow is an innovative framework that is Express-compatible while supporting Feature-First architecture. Following Convention over Configuration principles, it helps developers focus solely on business logic.',
    tags: ['numflow', 'framework', 'nodejs'],
    createdAt: new Date('2024-01-15'),
  },
  {
    id: 2,
    title: 'Benefits of Feature-First Pattern',
    author: 'Bob',
    content:
      'The Feature-First pattern organizes code by features, greatly improving maintainability and scalability. Each Feature is independently testable, making team collaboration much easier.',
    tags: ['architecture', 'best-practice', 'feature-first'],
    createdAt: new Date('2024-02-20'),
  },
  {
    id: 3,
    title: 'Using EJS Template Engine',
    author: 'Charlie',
    content:
      'EJS is a simple yet powerful template engine that allows you to use JavaScript directly. When used with Numflow, you can easily render HTML from Feature steps.',
    tags: ['ejs', 'template', 'view'],
    createdAt: new Date('2024-03-10'),
  },
]

// ===========================================
// Register Features
// ===========================================
//
// Folder structure:
//   features/posts/@get/          → GET /posts (list)
//   features/posts/[id]/@get/     → GET /posts/:id (detail)
//
// Each Feature renders templates from steps/.
// ===========================================

app.registerFeatures('./features')

// ===========================================
// Start Server
// ===========================================

const PORT = 3000
app.listen(PORT, () => {
  console.log(
    `✅ Feature-First + EJS server is running at http://localhost:${PORT}\n`
  )

  console.log('📖 Feature-First + Template Engine:')
  console.log('  - Use res.render() in Feature steps')
  console.log('  - Separate business logic and view rendering')
  console.log('  - Reusable template components\n')

  console.log('📁 Folder Structure:')
  console.log('  features/')
  console.log('    posts/')
  console.log('      @get/                    # GET /posts (list)')
  console.log('        steps/')
  console.log('          100-fetch-posts.js')
  console.log('          200-render.js        # Use res.render()!')
  console.log('      [id]/')
  console.log('        @get/                  # GET /posts/:id (detail)')
  console.log('          steps/')
  console.log('            100-fetch-post.js')
  console.log('            200-render.js      # Use res.render()!\n')

  console.log('  views/')
  console.log('    posts/')
  console.log('      index.ejs                # List template')
  console.log('      show.ejs                 # Detail template\n')

  console.log('🔄 Execution Flow (GET /posts):')
  console.log('  1. 100-fetch-posts.js: Fetch post list')
  console.log('  2. 200-render.js: Render views/posts/index.ejs\n')

  console.log('🔄 Execution Flow (GET /posts/:id):')
  console.log('  1. 100-fetch-post.js: Fetch post detail')
  console.log('  2. 200-render.js: Render views/posts/show.ejs\n')

  console.log('Testing:')
  console.log(`  Browser: http://localhost:${PORT}/posts`)
  console.log(`  Browser: http://localhost:${PORT}/posts/1`)
  console.log(`  Browser: http://localhost:${PORT}/posts/2`)
  console.log(`  Browser: http://localhost:${PORT}/posts/3\n`)

  console.log(`💡 You can render templates from Feature steps!`)
  console.log(
    `💡 Separate business logic (data fetching) and view rendering into different steps!`
  )
})
