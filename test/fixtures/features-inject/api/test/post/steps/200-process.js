/**
 * Step 2: Process and respond
 */

module.exports = (req, res) => {
  res.status(200).json({
    success: true,
    received: req.body.test,
    processedAt: new Date().toISOString()
  })
}
