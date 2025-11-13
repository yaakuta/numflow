module.exports = async (ctx, _req, res) => {
  res.status(201).json({
    success: true,
    data: { created: ctx.created }
  })
}
