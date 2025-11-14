/**
 * TypeScript ESM Response Step (.mts)
 */
export default async (ctx: any, req: any, res: any): Promise<boolean> => {
  res.json({ success: true, moduleType: 'TypeScript ESM', data: ctx })
  return true
}
