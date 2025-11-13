#!/usr/bin/env node

/**
 * 문서-코드 일치성 검증 스크립트
 *
 * 목적: 문서에 작성된 API가 실제로 구현되어 있는지 자동으로 검증
 *
 * 검증 단계:
 * 1. API 문서에서 메서드 목록 추출
 * 2. 소스 코드에서 실제 구현 확인
 * 3. 테스트 코드 존재 확인
 * 4. 예제 코드 확인
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

// 색상 코드
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

// API 문서에서 메서드 추출
function extractAPIsFromDoc(docPath) {
  const content = fs.readFileSync(docPath, 'utf-8')
  const apis = []

  // 방법 1: 마크다운 헤딩에서 API 추출 (### app.method(), ### method())
  const headingRegex = /^###\s+([a-zA-Z0-9_.]+(?:\([^)]*\))?)/gm
  let match

  while ((match = headingRegex.exec(content)) !== null) {
    const api = match[1].trim()
    // 일반적인 섹션 헤더 제외
    if (api &&
        !api.includes('(req, res') &&
        !api.includes('(err, req, res') &&
        api !== 'Overview' &&
        api !== 'Examples' &&
        api.includes('.') &&  // 반드시 객체.메서드 형식이어야 함
        api.length > 3) {     // 너무 짧은 이름 제외
      apis.push(api)
    }
  }

  // 방법 2: 마크다운 테이블에서 API 추출 (| API | Status | ...)
  const tableRegex = /\|\s*([a-zA-Z0-9_.()[\]]+)\s*\|/g

  while ((match = tableRegex.exec(content)) !== null) {
    const api = match[1].trim()
    // 헤더나 상태 컬럼 제외
    if (api &&
        api !== 'API' &&
        api !== 'Status' &&
        api !== 'Compatibility' &&
        api !== 'Notes' &&
        api !== '상태' &&
        api !== '호환성' &&
        api !== '비고' &&
        api !== 'Lifecycle' &&
        api !== 'Configuration' &&
        api !== 'Routing' &&
        api !== 'Middleware' &&
        api !== 'Template' &&
        api !== 'Others' &&
        api !== 'Events' &&
        api !== 'Properties' &&
        api !== 'Methods' &&
        !api.includes('---') &&
        !api.includes('**')) {
      apis.push(api)
    }
  }

  // 잘못 추출된 API 제외
  const excludeList = [
    'RESTful', 'HTTP', 'Best', 'Dynamic', 'AutoExecutor', 'Debug',
    'false', 'Option', 'Description', 'Variable', 'Performance', 'ErrorHandler',
    'router.METHOD', 'METHOD'
  ]

  const filteredApis = apis.filter(api => {
    const fullName = api.replace(/\(.*\)/, '').replace(/\[.*\]/, '')
    // 숫자나 너무 짧은 이름 제외
    if (/^\d+\.$/.test(fullName) || fullName.length <= 2) {
      return false
    }
    // Exclude 리스트 제외
    if (excludeList.includes(fullName) || excludeList.some(ex => fullName.includes(ex))) {
      return false
    }
    return true
  })

  return [...new Set(filteredApis)] // 중복 제거
}

// 소스 코드에서 메서드 구현 확인
function checkImplementation(api, sourceDir) {
  try {
    // API 이름에서 실제 메서드명 추출
    const fullName = api.replace(/\(.*\)/, '').replace(/\[.*\]/, '')

    // 숫자나 너무 짧은 이름은 건너뛰기 (섹션 제목일 가능성)
    if (/^\d+\.$/.test(fullName) || fullName.length <= 2) {
      return { exists: false, locations: 0 }
    }

    // 일반적인 섹션 제목 제외
    const excludeList = [
      'RESTful', 'HTTP', 'Best', 'Dynamic', 'AutoExecutor', 'Debug',
      'false', 'Option', 'Description', 'Variable', 'Performance', 'ErrorHandler',
      'router.METHOD', 'METHOD'
    ]
    if (excludeList.includes(fullName) || excludeList.some(ex => fullName.includes(ex))) {
      return { exists: false, locations: 0 }
    }

    // 객체.메서드 형식 분리 (예: req.get → get)
    const parts = fullName.split('.')
    const methodName = parts.length > 1 ? parts[parts.length - 1] : fullName

    // 간단한 검색: 메서드/프로퍼티 이름으로 검색
    const grepCmd = `grep -r "${methodName}" ${sourceDir} --include="*.ts" --include="*.js" 2>/dev/null || true`
    const result = execSync(grepCmd, { encoding: 'utf-8' })

    // 결과가 있고, 실제로 정의하는 코드가 있는지 확인
    if (result.length > 10) {
      const lines = result.split('\n').filter(line => {
        const trimmed = line.trim()
        return trimmed &&
               // 함수나 프로퍼티 정의로 보이는 패턴
               (trimmed.includes(`${methodName} =`) ||
                trimmed.includes(`${methodName}:`) ||
                trimmed.includes(`${methodName}(`) ||
                trimmed.includes(`.${methodName}`) ||
                trimmed.includes(`'${methodName}'`) ||
                trimmed.includes(`"${methodName}"`))
      })

      return {
        exists: lines.length > 0,
        locations: lines.length
      }
    }

    return { exists: false, locations: 0 }
  } catch (error) {
    return { exists: false, locations: 0 }
  }
}

// 테스트 코드 존재 확인
function checkTests(api, testDir) {
  try {
    const methodName = api.replace(/\(.*\)/, '').replace(/\[.*\]/, '')

    const grepCmd = `grep -r "${methodName}" ${testDir} --include="*.test.ts" --include="*.test.js" --include="*.spec.ts" 2>/dev/null || true`
    const result = execSync(grepCmd, { encoding: 'utf-8' })

    return {
      exists: result.length > 0,
      count: result.split('\n').filter(line => line.includes('it(') || line.includes('test(')).length
    }
  } catch (error) {
    return { exists: false, count: 0 }
  }
}

// 예제 코드 확인
function checkExamples(api, examplesDir) {
  try {
    const methodName = api.replace(/\(.*\)/, '').replace(/\[.*\]/, '')

    const grepCmd = `grep -r "${methodName}" ${examplesDir} --include="*.js" --include="*.ts" 2>/dev/null || true`
    const result = execSync(grepCmd, { encoding: 'utf-8' })

    return {
      exists: result.length > 0,
      count: result.split('\n').filter(line => line.trim()).length
    }
  } catch (error) {
    return { exists: false, count: 0 }
  }
}

// 메인 검증 함수
function verifyDocumentation(docsLang = 'ko') {
  log('\n═══════════════════════════════════════════════════', 'cyan')
  log(`   문서-코드 일치성 검증 시작 (${docsLang})`, 'cyan')
  log('═══════════════════════════════════════════════════\n', 'cyan')

  const rootDir = path.join(__dirname, '..')
  const docsDir = path.join(rootDir, `docs/${docsLang}`)
  const sourceDir = path.join(rootDir, 'src')
  const testDir = path.join(rootDir, 'test')
  const examplesDir = path.join(rootDir, 'examples')

  // API 문서 목록
  const apiDocs = [
    { name: 'Application', path: path.join(docsDir, 'api/application.md') },
    { name: 'Request', path: path.join(docsDir, 'api/request.md') },
    { name: 'Response', path: path.join(docsDir, 'api/response.md') },
    { name: 'Router', path: path.join(docsDir, 'api/router.md') },
    { name: 'Feature', path: path.join(docsDir, 'api/feature.md') }
  ]

  const results = []
  let totalAPIs = 0
  let implementedAPIs = 0
  let testedAPIs = 0
  let exampleAPIs = 0

  for (const doc of apiDocs) {
    if (!fs.existsSync(doc.path)) {
      log(`⚠️  문서 없음: ${doc.name}`, 'yellow')
      continue
    }

    log(`\n📄 검증 중: ${doc.name}`, 'blue')
    log('─'.repeat(50), 'blue')

    const apis = extractAPIsFromDoc(doc.path)
    totalAPIs += apis.length

    log(`   추출된 API 개수: ${apis.length}`, 'cyan')

    const docResults = []

    for (const api of apis) {
      const impl = checkImplementation(api, sourceDir)
      const tests = checkTests(api, testDir)
      const examples = checkExamples(api, examplesDir)

      if (impl.exists) implementedAPIs++
      if (tests.exists) testedAPIs++
      if (examples.exists) exampleAPIs++

      const result = {
        api,
        implemented: impl.exists,
        implLocations: impl.locations,
        tested: tests.exists,
        testCount: tests.count,
        hasExamples: examples.exists,
        exampleCount: examples.count
      }

      docResults.push(result)

      // 결과 출력
      const implStatus = impl.exists ? '✅' : '❌'
      const testStatus = tests.exists ? '✅' : '⚠️ '
      const exampleStatus = examples.exists ? '✅' : '  '

      log(`   ${implStatus} ${testStatus} ${exampleStatus} ${api}`,
          impl.exists ? 'green' : 'red')
    }

    results.push({ doc: doc.name, apis: docResults })
  }

  // 요약 리포트
  log('\n═══════════════════════════════════════════════════', 'cyan')
  log('   검증 결과 요약', 'cyan')
  log('═══════════════════════════════════════════════════\n', 'cyan')

  log(`총 API 개수:        ${totalAPIs}`, 'bold')
  log(`구현된 API:         ${implementedAPIs} (${Math.round(implementedAPIs/totalAPIs*100)}%)`,
      implementedAPIs === totalAPIs ? 'green' : 'yellow')
  log(`테스트된 API:       ${testedAPIs} (${Math.round(testedAPIs/totalAPIs*100)}%)`,
      testedAPIs > totalAPIs * 0.8 ? 'green' : 'yellow')
  log(`예제가 있는 API:    ${exampleAPIs} (${Math.round(exampleAPIs/totalAPIs*100)}%)`,
      exampleAPIs > totalAPIs * 0.5 ? 'green' : 'yellow')

  // 상세 리포트
  log('\n📊 카테고리별 상세 리포트\n', 'cyan')

  for (const { doc, apis } of results) {
    const implemented = apis.filter(a => a.implemented).length
    const tested = apis.filter(a => a.tested).length
    const withExamples = apis.filter(a => a.hasExamples).length

    log(`${doc}:`, 'bold')
    log(`  ├─ 구현: ${implemented}/${apis.length} (${Math.round(implemented/apis.length*100)}%)`)
    log(`  ├─ 테스트: ${tested}/${apis.length} (${Math.round(tested/apis.length*100)}%)`)
    log(`  └─ 예제: ${withExamples}/${apis.length} (${Math.round(withExamples/apis.length*100)}%)`)
  }

  // 경고 및 권장사항
  log('\n⚠️  권장사항\n', 'yellow')

  if (implementedAPIs < totalAPIs) {
    log(`   • ${totalAPIs - implementedAPIs}개 API가 문서에만 있고 구현되지 않았습니다.`, 'yellow')
    log(`   • 문서를 업데이트하거나 API를 구현하세요.`, 'yellow')
  }

  if (testedAPIs < totalAPIs * 0.9) {
    log(`   • ${totalAPIs - testedAPIs}개 API에 테스트가 없습니다.`, 'yellow')
    log(`   • 최소 90% 테스트 커버리지를 권장합니다.`, 'yellow')
  }

  if (exampleAPIs < totalAPIs * 0.5) {
    log(`   • ${totalAPIs - exampleAPIs}개 API에 예제가 없습니다.`, 'yellow')
    log(`   • 주요 API는 examples/ 디렉토리에 예제를 추가하세요.`, 'yellow')
  }

  log('\n═══════════════════════════════════════════════════\n', 'cyan')

  // 종료 코드
  if (implementedAPIs === totalAPIs && testedAPIs > totalAPIs * 0.9) {
    log('✅ 검증 완료: 문서와 코드가 일치합니다!\n', 'green')
    process.exit(0)
  } else {
    log('⚠️  검증 완료: 일부 불일치가 발견되었습니다.\n', 'yellow')
    process.exit(1)
  }
}

// 스크립트 실행
if (require.main === module) {
  // 명령줄 인자로 언어 지정 가능: node verify-docs.js en
  const docsLang = process.argv[2] || 'ko'
  verifyDocumentation(docsLang)
}

module.exports = { verifyDocumentation, extractAPIsFromDoc, checkImplementation }
