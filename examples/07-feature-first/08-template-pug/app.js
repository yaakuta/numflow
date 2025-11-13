/**
 * 08-template-pug
 *
 * Example combining Feature-First with Pug template engine.
 *
 * Learning Objectives:
 * - Using Pug template engine
 * - Rendering Pug templates in Feature-First
 * - Implementing simple product catalog
 *
 * How to Run:
 * cd examples/07-feature-first/08-template-pug
 * node app.js
 *
 * Testing:
 * Browser: http://localhost:3000/products
 */

const numflow = require('../../../dist/cjs/index.js')
const path = require('path')
const serveStatic = require('serve-static')

const app = numflow()

// Configure Pug template engine
app.set('view engine', 'pug')
app.set('views', path.join(__dirname, 'views'))
app.use(serveStatic(path.join(__dirname, 'public')))

// Global data
global.products = [
  {
    id: 1,
    name: 'Numflow Framework',
    category: 'Software',
    price: 0,
    description: 'Node.js framework supporting Feature-First architecture',
    inStock: true,
  },
  {
    id: 2,
    name: 'Express Migration Guide',
    category: 'Documentation',
    price: 29.99,
    description: 'Complete guide for migrating from Express to Numflow',
    inStock: true,
  },
  {
    id: 3,
    name: 'Convention Patterns Book',
    category: 'Book',
    price: 49.99,
    description:
      'Practical guide to mastering Convention over Configuration patterns',
    inStock: false,
  },
]

app.registerFeatures('./features')

const PORT = 3000
app.listen(PORT, () => {
  console.log(
    `✅ Pug template server is running at http://localhost:${PORT}\n`
  )
  console.log('📖 Pug Template Engine Features:')
  console.log('  - Concise syntax (no HTML tags)')
  console.log('  - Indentation-based')
  console.log('  - JavaScript expression support\n')
  console.log('Testing:')
  console.log(`  http://localhost:${PORT}/products`)
  console.log(`  http://localhost:${PORT}/products/1`)
})
