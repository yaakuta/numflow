/**
 * CommonJS Response Step
 */
module.exports = async (ctx, req, res) => {
  res.json({ success: true, moduleType: 'CommonJS', data: ctx })
  return true
}
