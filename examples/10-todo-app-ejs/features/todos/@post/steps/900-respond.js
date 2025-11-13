/**
 * Step 900: Send response
 *
 * TODO creation success response (JSON)
 */

async function sendResponse(ctx, req, res) {
  // v0.3.0: ctx contains only pure business data
  const data = ctx

  // JSON response for fetch API request
  // Client calls location.reload()
  res.status(201).json({
    success: true,
    data,
  })
}

module.exports = sendResponse
