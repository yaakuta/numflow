/**
 * Step 100: 업데이트 데이터 검증
 *
 * @param {Object} ctx - Context 객체
 * @param {import('numflow').Request} req - Request 객체
 * @param {import('numflow').Response} res - Response 객체
 */
const db = require('../../../../../db')

module.exports = async (ctx, req, res) => {
  const { id } = req.params
  const { title, description, completed } = req.body

  // TODO 존재 여부 확인
  const existingTodo = db.findById(id)
  if (!existingTodo) {
    return res.status(404).json({
      success: false,
      error: `ID ${id}인 TODO를 찾을 수 없습니다.`,
    })
  }

  // 업데이트할 데이터 준비
  const updateData = {}

  // title 검증
  if (title !== undefined) {
    if (typeof title !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'title은 문자열이어야 합니다.',
      })
    }

    if (title.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'title은 비어있을 수 없습니다.',
      })
    }

    if (title.length > 200) {
      return res.status(400).json({
        success: false,
        error: 'title은 200자를 초과할 수 없습니다.',
      })
    }

    updateData.title = title.trim()
  }

  // description 검증
  if (description !== undefined) {
    if (typeof description !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'description은 문자열이어야 합니다.',
      })
    }

    if (description.length > 1000) {
      return res.status(400).json({
        success: false,
        error: 'description은 1000자를 초과할 수 없습니다.',
      })
    }

    updateData.description = description.trim()
  }

  // completed 검증
  if (completed !== undefined) {
    if (typeof completed !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'completed는 boolean이어야 합니다.',
      })
    }

    updateData.completed = completed
  }

  // 업데이트할 데이터가 없는 경우
  if (Object.keys(updateData).length === 0) {
    return res.status(400).json({
      success: false,
      error: '업데이트할 데이터가 없습니다.',
    })
  }

  // Context에 저장
  ctx.todoId = id
  ctx.updateData = updateData

  // 다음 Step으로 진행
}
