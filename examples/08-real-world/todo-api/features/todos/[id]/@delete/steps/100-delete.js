/**
 * Step 100: TODO 삭제
 *
 * @param {Object} ctx - Context 객체
 * @param {import('numflow').Request} req - Request 객체
 * @param {import('numflow').Response} res - Response 객체
 */
const db = require('../../../../../db')

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

  // DB에서 TODO 삭제
  const deleted = db.delete(id)

  // Context에 저장
  ctx.deletedTodo = todo
  ctx.deletedId = id

  // 204 No Content 또는 200 OK 응답
  res.json({
    success: true,
    message: 'TODO가 성공적으로 삭제되었습니다.',
    data: {
      id,
      deletedTodo: todo,
    },
  })
}
