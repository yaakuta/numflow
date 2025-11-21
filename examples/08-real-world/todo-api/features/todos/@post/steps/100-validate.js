/**
 * Step 100: 입력 데이터 검증
 *
 * @param {Object} ctx - Context 객체
 * @param {import('numflow').Request} req - Request 객체
 * @param {import('numflow').Response} res - Response 객체
 */
module.exports = async (ctx, req, res) => {
  const { title, description } = req.body

  // 필수 필드 검증
  if (!title || typeof title !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'title은 필수 필드입니다.',
    })
  }

  // 제목 길이 검증
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

  // 설명 검증 (선택 필드)
  if (description !== undefined && typeof description !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'description은 문자열이어야 합니다.',
    })
  }

  if (description && description.length > 1000) {
    return res.status(400).json({
      success: false,
      error: 'description은 1000자를 초과할 수 없습니다.',
    })
  }

  // 검증된 데이터를 Context에 저장
  ctx.todoData = {
    title: title.trim(),
    description: description ? description.trim() : '',
  }

  // 다음 Step으로 진행 (조기 응답하지 않음)
}
