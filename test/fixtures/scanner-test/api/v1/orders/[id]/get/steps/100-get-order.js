module.exports = async (ctx, req, res) => {

  ctx.order = 'found'
  ctx.orderId = req.params?.id

  res.json(ctx)
  return
}
