/**
 * TypeScript ESM Async Task (.mts)
 * Tests that AsyncTask files can be .mts
 */
import { Request, Response } from '../../../../../src/types/index.js'

interface Context {
  asyncTaskExecuted?: boolean
  notificationSent?: boolean
}

export default async (ctx: Context, req: Request, res: Response): Promise<void> => {
  // Simulate async task execution
  ctx.asyncTaskExecuted = true
  ctx.notificationSent = true

  console.log('[AsyncTask] TypeScript ESM async task executed')
}
