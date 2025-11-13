module.exports = async (ctx, req, res) => {

  ctx.users = ['user1', 'user2']
  ctx.count = 2

  res.json(ctx)
  return
}
