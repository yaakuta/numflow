/**
 * TypeScript ESM Step (.mts)
 * Tests that Step files can be .mts
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
  ctx.data = {
    message: 'TypeScript ESM Step loaded successfully',
    moduleType: 'ESM',
    fileType: '.mts'
  }
  return true
}
