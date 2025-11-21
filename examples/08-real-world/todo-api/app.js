/**
 * TODO API Server
 *
 * Feature-First 아키텍처로 구현된 RESTful API 서버입니다.
 * Convention over Configuration을 따라 폴더 구조만으로 API를 자동 생성합니다.
 */

const numflow = require('../../../dist/cjs/index.js')
const path = require('path')

// Numflow 애플리케이션 생성
const app = numflow()

// 전역 미들웨어 설정
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`)
  next()
})

// CORS 활성화 (선택사항)
// app.use(numflow.cors())

// Feature 자동 등록
// features/ 디렉토리를 스캔하여 모든 Feature를 자동으로 등록합니다.
// 폴더 구조만으로 다음 API들이 자동 생성됩니다:
//
// GET    /todos              - 모든 TODO 조회
// POST   /todos              - 새 TODO 생성
// GET    /todos/:id          - 특정 TODO 조회
// PUT    /todos/:id          - TODO 업데이트
// DELETE /todos/:id          - TODO 삭제
// PATCH  /todos/:id/complete - TODO 완료 처리
app.registerFeatures(path.join(__dirname, 'features'))

// 루트 엔드포인트
app.get('/', (req, res) => {
  res.json({
    message: 'TODO API 서버에 오신 것을 환영합니다!',
    version: '1.0.0',
    endpoints: {
      'GET /todos': '모든 TODO 조회 (쿼리: ?completed=true/false)',
      'POST /todos': '새 TODO 생성 (body: { title, description })',
      'GET /todos/:id': '특정 TODO 조회',
      'PUT /todos/:id': 'TODO 업데이트 (body: { title?, description?, completed? })',
      'DELETE /todos/:id': 'TODO 삭제',
      'PATCH /todos/:id/complete': 'TODO 완료 처리',
    },
    docs: 'https://github.com/your-username/numflow',
  })
})

// 404 핸들러
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: '요청하신 엔드포인트를 찾을 수 없습니다.',
    path: req.url,
  })
})

// 글로벌 에러 핸들러
app.onError((err, req, res) => {
  console.error('Error:', err)

  res.status(err.statusCode || 500).json({
    success: false,
    error: err.message || '서버 내부 오류가 발생했습니다.',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  })
})

// 서버 시작
const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   TODO API Server with Numflow Framework                  ║
║                                                            ║
║   🚀 Server is running on http://localhost:${PORT}        ║
║                                                            ║
║   📚 API Endpoints:                                        ║
║      GET    /todos              - 모든 TODO 조회           ║
║      POST   /todos              - 새 TODO 생성             ║
║      GET    /todos/:id          - 특정 TODO 조회          ║
║      PUT    /todos/:id          - TODO 업데이트           ║
║      DELETE /todos/:id          - TODO 삭제               ║
║      PATCH  /todos/:id/complete - TODO 완료 처리          ║
║                                                            ║
║   🎯 Feature-First Architecture                            ║
║   📁 Convention over Configuration                         ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
  `)
})

module.exports = app
