/**
 * Step 1: Validate request body
 */

module.exports = (req, res, next) => {
  if (!req.body || !req.body.test) {
    return res.status(400).json({ error: 'Missing test field' })
  }
  next()
}
