/**
 * ESM Step
 */
export default async (ctx, req, res) => {
  ctx.step1 = 'completed'
  return true
}
