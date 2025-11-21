/**
 * Step 200: TODO 업데이트 실행
 *
 * @param {Object} ctx - Context 객체
 * @param {import('numflow').Request} req - Request 객체
 * @param {import('numflow').Response} res - Response 객체
 */
const db = require('../../../../../db')

module.exports = async (ctx, req, res) => {
  const { todoId, updateData } = ctx

  // DB에서 TODO 업데이트
  const updatedTodo = db.update(todoId, updateData)

  // Context에 저장
  ctx.updatedTodo = updatedTodo

  // 응답 전송
  res.json({
    success: true,
    message: 'TODO가 성공적으로 업데이트되었습니다.',
    data: updatedTodo,
  })
}
