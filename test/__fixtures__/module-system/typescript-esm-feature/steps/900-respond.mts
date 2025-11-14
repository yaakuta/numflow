/**
 * TypeScript ESM Response Step (.mts)
 */
import { Request, Response } from '../../../../../src/types/index.js'

interface Context {
  data?: {
    message: string
    moduleType: string
    fileType: string
  }
}

export default async (ctx: Context, req: Request, res: Response): Promise<boolean> => {
  res.json({
    success: true,
    moduleType: 'TypeScript ESM',
    fileType: '.mts',
    data: ctx.data
  })
  return true
}
