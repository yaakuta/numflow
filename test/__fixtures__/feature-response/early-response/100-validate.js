/**
 * Validation step - Early response based on condition

 */
module.exports = async (ctx, req, res) => {
  const fail = req.query?.fail === 'true'

  if (fail) {
    // Early response - remaining steps will not execute
    res.status(400).json({
      success: false,
      error: 'Validation failed'
    })
    return
  }

  ctx.validated = true
  return true
}
