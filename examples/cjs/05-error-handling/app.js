const numflow = require('numflow')
const app = numflow()

app.use(numflow.json())
app.registerFeatures('./features')

// Express-style Error Middleware
app.use((err, req, res, next) => {
  console.error('Global Error Handler:', err.message)

  if (!res.headersSent) {
    const statusCode = err.statusCode || 500
    res.status(statusCode).json({
      error: err.message || 'Internal Server Error'
    })
  }
})

if (require.main === module) {
  const PORT = process.env.PORT || 3000

  app.listen(PORT, () => {
    console.log(`\nServer running on http://localhost:${PORT}\n`)
    console.log('Error Handling Example:')
    console.log('   POST /payments')
    console.log('\n   Feature.onError() -> Retry -> Express Error Middleware')
    console.log('\n70% chance of network error')
    console.log('   Auto-retry up to 3 times!\n')
  })
}

module.exports = app
