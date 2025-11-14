/**
 * ESM Response Step
 */
export default async (ctx, req, res) => {
  res.json({ success: true, moduleType: 'ESM', data: ctx })
  return true
}
