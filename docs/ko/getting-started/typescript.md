# TypeScript 사용

Numflow는 TypeScript를 완벽하게 지원합니다.

## 1. TypeScript 설치

```bash
npm install --save-dev typescript @types/node
```

## 2. tsconfig.json 생성

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

## 3. TypeScript 애플리케이션 작성

`src/app.ts` 파일을 생성합니다:

```typescript
import numflow from 'numflow'

const app = numflow()

// 타입 안전한 설정
app.set('port', 3000)
app.set('title', 'TypeScript Numflow App')

const port = app.get('port') as number
const title = app.get('title') as string

app.listen(port, () => {
  console.log(`${title} running on http://localhost:${port}`)
})
```

## 4. 빌드 및 실행

```bash
# TypeScript 컴파일
npx tsc

# 컴파일된 JavaScript 실행
node dist/app.js
```

## 5. 개발 모드 (ts-node)

빌드 없이 바로 실행하려면 `ts-node`를 사용할 수 있습니다:

```bash
npm install --save-dev ts-node

# 직접 실행
npx ts-node src/app.ts
```

---

**이전**: [목차](./README.md)
