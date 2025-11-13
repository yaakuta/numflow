/**
 * Numbers Framework - Basic Example (JavaScript ESM)
 *
 * 이 예제는 JavaScript (ESM)를 사용한 기본적인 서버 시작 예제입니다.
 * TypeScript 없이도 완벽하게 동작합니다.
 */

// Numbers 프레임워크 불러오기 (ESM import)
import numbers from '../dist/esm/index.js'

// Application 인스턴스 생성
const app = numbers()

// 포트 설정
const PORT = 3001

// 서버 시작
app.listen(PORT, () => {
  console.log(`✨ Numbers server is running on http://localhost:${PORT}`)
  console.log('📝 This is Phase 0 - Basic server startup (ESM)')
  console.log('🔥 Press Ctrl+C to stop the server')
})
