/**
 * Test step: Create user
 */
import { StepFunction } from '../../../../../../src/feature/types.js'

const step: StepFunction = async (ctx, req, res) => {
  ctx.userCreated = true
  res.statusCode = 201
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify({ success: true }))
}

export default step
