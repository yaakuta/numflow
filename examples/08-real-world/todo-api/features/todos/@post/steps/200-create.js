/**
 * Step 200: 새 TODO 생성
 *
 * @param {Object} ctx - Context 객체
 * @param {import('numflow').Request} req - Request 객체
 * @param {import('numflow').Response} res - Response 객체
 */
const db = require('../../../../db')

module.exports = async (ctx, req, res) => {
  // 이전 Step에서 검증된 데이터 사용
  const { todoData } = ctx

  // DB에 새 TODO 생성
  const newTodo = db.create(todoData)

  // Context에 저장
  ctx.createdTodo = newTodo

  // 201 Created 응답
  res.status(201).json({
    success: true,
    message: 'TODO가 성공적으로 생성되었습니다.',
    data: newTodo,
  })
}
