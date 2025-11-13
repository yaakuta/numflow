module.exports = async (ctx, req, res) => {

  ctx.order = 'created'
  ctx.orderId = '123'

  res.json(ctx)
  return
}
