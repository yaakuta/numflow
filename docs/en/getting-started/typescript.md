# Using TypeScript

Numflow fully supports TypeScript.

## 1. Install TypeScript

```bash
npm install --save-dev typescript @types/node
```

## 2. Create tsconfig.json

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

## 3. Write TypeScript Application

Create `src/app.ts`:

```typescript
import numflow from 'numflow'

const app = numflow()

// Type-safe configuration
app.set('port', 3000)
app.set('title', 'TypeScript Numflow App')

const port = app.get('port') as number
const title = app.get('title') as string

app.listen(port, () => {
  console.log(`${title} running on http://localhost:${port}`)
})
```

## 4. Build and Run

```bash
# Compile TypeScript
npx tsc

# Run compiled JavaScript
node dist/app.js
```

## 5. Development Mode (ts-node)

To run directly without building, use `ts-node`:

```bash
npm install --save-dev ts-node

# Run directly
npx ts-node src/app.ts
```

---

**Previous**: [Table of Contents](./README.md)
