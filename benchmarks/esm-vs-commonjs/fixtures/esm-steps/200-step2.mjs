/**
 * ESM Step
 */
export default async (ctx, req, res) => {
  ctx.step2 = 'completed'
  return true
}
