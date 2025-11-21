/**
 * Step 100: 특정 TODO 조회
 *
 * @param {Object} ctx - Context 객체
 * @param {import('numflow').Request} req - Request 객체
 * @param {import('numflow').Response} res - Response 객체
 */
const db = require('../../../../../db')

module.exports = async (ctx, req, res) => {
  const { id } = req.params

  // DB에서 TODO 조회
  const todo = db.findById(id)

  // TODO가 없는 경우
  if (!todo) {
    return res.status(404).json({
      success: false,
      error: `ID ${id}인 TODO를 찾을 수 없습니다.`,
    })
  }

  // Context에 저장
  ctx.todo = todo

  // 응답 전송
  res.json({
    success: true,
    data: todo,
  })
}
