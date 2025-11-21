/**
 * Step 100: 모든 TODO 조회
 *
 * @param {Object} ctx - Context 객체
 * @param {import('numflow').Request} req - Request 객체
 * @param {import('numflow').Response} res - Response 객체
 */
const db = require('../../../../db')

module.exports = async (ctx, req, res) => {
  // 쿼리 파라미터에서 필터 옵션 추출
  const { completed } = req.query

  const options = {}

  // completed=true 또는 completed=false인 경우만 필터링
  if (completed === 'true') {
    options.completed = true
  } else if (completed === 'false') {
    options.completed = false
  }

  // DB에서 TODO 목록 조회
  const todos = db.findAll(options)

  // Context에 저장 (다른 Step에서 사용 가능)
  ctx.todos = todos

  // 응답 전송
  res.json({
    success: true,
    count: todos.length,
    data: todos,
  })
}
