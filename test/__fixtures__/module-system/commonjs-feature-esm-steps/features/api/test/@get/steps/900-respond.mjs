/**
 * ESM Response Step
 */
export default async (ctx, _req, res) => {
  res.json({
    success: true,
    ...ctx.data
  })
  return true
}
