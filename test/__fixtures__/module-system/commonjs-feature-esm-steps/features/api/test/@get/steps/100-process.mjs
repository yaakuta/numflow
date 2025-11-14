/**
 * ESM Step (.mjs with export default)
 * Tests that dynamic import() correctly loads ESM modules
 */
export default async (ctx, _req, _res) => {
  ctx.data = {
    message: 'ESM Step loaded successfully',
    moduleType: 'ESM'
  }
  return true
}
