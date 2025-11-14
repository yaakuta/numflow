/**
 * TypeScript ESM Step (.mts)
 */
export default async (ctx: any, req: any, res: any): Promise<boolean> => {
  ctx.step1 = 'completed'
  return true
}
