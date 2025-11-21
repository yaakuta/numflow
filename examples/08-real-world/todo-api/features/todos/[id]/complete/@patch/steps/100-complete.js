/**
 * Step 100: TODO 완료 처리
 *
 * @param {Object} ctx - Context 객체
 * @param {import('numflow').Request} req - Request 객체
 * @param {import('numflow').Response} res - Response 객체
 */
const db = require('../../../../../../db')

module.exports = async (ctx, req, res) => {
  const { id } = req.params

  // TODO 존재 여부 확인
  const todo = db.findById(id)
  if (!todo) {
    return res.status(404).json({
      success: false,
      error: `ID ${id}인 TODO를 찾을 수 없습니다.`,
    })
  }

  // 이미 완료된 경우
  if (todo.completed) {
    return res.status(400).json({
      success: false,
      error: '이미 완료된 TODO입니다.',
    })
  }

  // TODO 완료 처리
  const completedTodo = db.complete(id)

  // Context에 저장
  ctx.completedTodo = completedTodo

  // 응답 전송
  res.json({
    success: true,
    message: 'TODO가 완료 처리되었습니다.',
    data: completedTodo,
  })
}
