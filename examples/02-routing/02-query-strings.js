/**
 * 02-query-strings.js
 *
 * Example of filtering data and pagination using query strings.
 * Automatically parses parameters after ? in the URL.
 *
 * Learning Objectives:
 * - Reading query strings with req.query (automatic parsing!)
 * - Implementing search, filtering, sorting, and pagination
 * - Handling query string default values
 *
 * How to Run:
 * node examples/02-routing/02-query-strings.js
 *
 * Testing:
 * # Basic search
 * curl "http://localhost:3000/api/search?q=javascript"
 *
 * # Pagination
 * curl "http://localhost:3000/api/products?page=2&limit=5"
 *
 * # Filtering
 * curl "http://localhost:3000/api/products?category=electronics&minPrice=100&maxPrice=1000"
 *
 * # Sorting
 * curl "http://localhost:3000/api/products?sortBy=price&order=desc"
 */

const numflow = require("numflow")

const app = numflow()

// ===========================================
// In-memory database
// ===========================================

const products = [
  { id: 1, name: 'MacBook Pro', category: 'electronics', price: 2499, stock: 50 },
  { id: 2, name: 'iPhone 15', category: 'electronics', price: 999, stock: 100 },
  { id: 3, name: 'AirPods Pro', category: 'electronics', price: 249, stock: 200 },
  { id: 4, name: 'Magic Mouse', category: 'accessories', price: 79, stock: 150 },
  { id: 5, name: 'USB-C Cable', category: 'accessories', price: 19, stock: 500 },
  { id: 6, name: 'Desk Lamp', category: 'furniture', price: 45, stock: 80 },
  { id: 7, name: 'Office Chair', category: 'furniture', price: 299, stock: 30 },
  { id: 8, name: 'Monitor Stand', category: 'accessories', price: 59, stock: 120 },
  { id: 9, name: 'Keyboard', category: 'electronics', price: 149, stock: 90 },
  { id: 10, name: 'Mouse Pad', category: 'accessories', price: 15, stock: 300 },
]

const articles = [
  { id: 1, title: 'Getting Started with JavaScript', tags: ['javascript', 'beginner'] },
  { id: 2, title: 'Advanced TypeScript', tags: ['typescript', 'advanced'] },
  { id: 3, title: 'Node.js Best Practices', tags: ['nodejs', 'javascript'] },
  { id: 4, title: 'React Hooks Guide', tags: ['react', 'javascript'] },
  { id: 5, title: 'Vue.js 3 Tutorial', tags: ['vue', 'javascript'] },
]

// ===========================================
// 1. Basic Search (Search Query)
// ===========================================

// /api/search?q=keyword
app.get('/api/search', (req, res) => {
  // Automatically parsed query string is in req.query
  const { q } = req.query

  if (!q) {
    return res.status(400).json({
      success: false,
      error: 'Please provide a search query (q).',
    })
  }

  // Filter by search term (case-insensitive)
  const searchTerm = q.toLowerCase()
  const results = articles.filter(
    (article) =>
      article.title.toLowerCase().includes(searchTerm) ||
      article.tags.some((tag) => tag.toLowerCase().includes(searchTerm))
  )

  res.json({
    success: true,
    query: q,
    count: results.length,
    data: results,
  })
})

// ===========================================
// 2. Pagination
// ===========================================

// /api/products?page=1&limit=10
app.get('/api/products', (req, res) => {
  // Read values from query string (with defaults)
  const page = parseInt(req.query.page) || 1
  const limit = parseInt(req.query.limit) || 5

  // Calculate pagination
  const startIndex = (page - 1) * limit
  const endIndex = page * limit

  // Slice data
  const results = products.slice(startIndex, endIndex)

  res.json({
    success: true,
    pagination: {
      currentPage: page,
      limit: limit,
      totalItems: products.length,
      totalPages: Math.ceil(products.length / limit),
    },
    data: results,
  })
})

// ===========================================
// 3. Filtering
// ===========================================

// /api/filter?category=electronics&minPrice=100&maxPrice=1000
app.get('/api/filter', (req, res) => {
  const { category, minPrice, maxPrice, inStock } = req.query

  let filtered = [...products]

  // Category filter
  if (category) {
    filtered = filtered.filter((p) => p.category === category)
  }

  // Minimum price filter
  if (minPrice) {
    const min = parseFloat(minPrice)
    filtered = filtered.filter((p) => p.price >= min)
  }

  // Maximum price filter
  if (maxPrice) {
    const max = parseFloat(maxPrice)
    filtered = filtered.filter((p) => p.price <= max)
  }

  // In-stock products only (inStock=true)
  if (inStock === 'true') {
    filtered = filtered.filter((p) => p.stock > 0)
  }

  res.json({
    success: true,
    filters: {
      category: category || 'all',
      minPrice: minPrice || 'none',
      maxPrice: maxPrice || 'none',
      inStock: inStock || 'false',
    },
    count: filtered.length,
    data: filtered,
  })
})

// ===========================================
// 4. Sorting
// ===========================================

// /api/sort?sortBy=price&order=desc
app.get('/api/sort', (req, res) => {
  const { sortBy = 'id', order = 'asc' } = req.query

  // Validate sort fields
  const validSortFields = ['id', 'name', 'price', 'stock']
  if (!validSortFields.includes(sortBy)) {
    return res.status(400).json({
      success: false,
      error: `Sort field must be one of: ${validSortFields.join(', ')}.`,
    })
  }

  // Copy and sort data
  const sorted = [...products].sort((a, b) => {
    if (order === 'asc') {
      return a[sortBy] > b[sortBy] ? 1 : -1
    } else {
      return a[sortBy] < b[sortBy] ? 1 : -1
    }
  })

  res.json({
    success: true,
    sorting: {
      sortBy,
      order,
    },
    data: sorted,
  })
})

// ===========================================
// 5. Combined Query
// ===========================================

// Supports filtering + sorting + pagination all together
app.get('/api/products/advanced', (req, res) => {
  const {
    category,
    minPrice,
    maxPrice,
    sortBy = 'id',
    order = 'asc',
    page = 1,
    limit = 5,
  } = req.query

  let result = [...products]

  // 1. Filtering
  if (category) result = result.filter((p) => p.category === category)
  if (minPrice) result = result.filter((p) => p.price >= parseFloat(minPrice))
  if (maxPrice) result = result.filter((p) => p.price <= parseFloat(maxPrice))

  // 2. Sorting
  result.sort((a, b) => {
    if (order === 'asc') {
      return a[sortBy] > b[sortBy] ? 1 : -1
    } else {
      return a[sortBy] < b[sortBy] ? 1 : -1
    }
  })

  // 3. Pagination
  const pageNum = parseInt(page)
  const limitNum = parseInt(limit)
  const startIndex = (pageNum - 1) * limitNum
  const endIndex = pageNum * limitNum
  const paginatedResult = result.slice(startIndex, endIndex)

  res.json({
    success: true,
    filters: { category, minPrice, maxPrice },
    sorting: { sortBy, order },
    pagination: {
      currentPage: pageNum,
      limit: limitNum,
      totalItems: result.length,
      totalPages: Math.ceil(result.length / limitNum),
    },
    data: paginatedResult,
  })
})

// ===========================================
// 6. Query String Debugging
// ===========================================

// Return all query strings as-is (for debugging)
app.get('/debug', (req, res) => {
  res.json({
    query: req.query,
    queryKeys: Object.keys(req.query),
  })
})

// ===========================================
// Start Server
// ===========================================

const PORT = 3000
app.listen(PORT, () => {
  console.log(`✅ Query Strings server is running at http://localhost:${PORT}\n`)
  console.log('Test commands:')

  console.log(`\n  # 1. Search`)
  console.log(`  curl "http://localhost:${PORT}/api/search?q=javascript"`)

  console.log(`\n  # 2. Pagination`)
  console.log(`  curl "http://localhost:${PORT}/api/products?page=1&limit=5"`)
  console.log(`  curl "http://localhost:${PORT}/api/products?page=2&limit=3"`)

  console.log(`\n  # 3. Filtering`)
  console.log(`  curl "http://localhost:${PORT}/api/filter?category=electronics"`)
  console.log(
    `  curl "http://localhost:${PORT}/api/filter?minPrice=100&maxPrice=500"`
  )

  console.log(`\n  # 4. Sorting`)
  console.log(`  curl "http://localhost:${PORT}/api/sort?sortBy=price&order=asc"`)
  console.log(`  curl "http://localhost:${PORT}/api/sort?sortBy=stock&order=desc"`)

  console.log(`\n  # 5. Combined Query`)
  console.log(
    `  curl "http://localhost:${PORT}/api/products/advanced?category=electronics&sortBy=price&order=desc&page=1&limit=3"`
  )

  console.log(`\n  # 6. Debugging`)
  console.log(`  curl "http://localhost:${PORT}/debug?foo=bar&baz=qux"`)
})
