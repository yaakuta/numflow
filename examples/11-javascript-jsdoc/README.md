# JavaScript + JSDoc Examples

Examples of using Numflow with JavaScript and JSDoc without TypeScript.

## 📋 Table of Contents

1. [Basic Usage](./01-basic/) - Hello World with JSDoc
2. [REST API](./02-rest-api/) - Complete REST API with JSDoc
3. [Feature-First](./03-feature-first/) - Feature-First Pattern with JSDoc

## 🚀 Getting Started

### 1. JSDoc Configuration

Create `jsconfig.json` in project root:

```json
{
  "compilerOptions": {
    "checkJs": true,
    "strictNullChecks": true,
    "target": "ES2020",
    "module": "commonjs"
  }
}
```

### 2. VSCode Configuration

Create `.vscode/settings.json`:

```json
{
  "javascript.validate.enable": true,
  "javascript.suggestionActions.enabled": true
}
```

### 3. Run Examples

```bash
cd examples/11-javascript-jsdoc/01-basic
node app.js
```

## 📖 Additional Resources

- [JSDoc Guide](../../../docs/JSDOC_GUIDE.md) - Detailed JSDoc usage
- [Getting Started](../../../docs/GETTING_STARTED.md) - Numflow getting started guide

## 💡 Key Points

### ✅ Type Safety

JSDoc provides type safety without TypeScript:

```javascript
/**
 * @typedef {import('numflow').Request} Request
 * @typedef {import('numflow').Response} Response
 */

/**
 * @param {Request} req
 * @param {Response} res
 */
app.get('/', (req, res) => {
  // Both req and res have auto-completion!
  res.json({ message: 'Hello' })
})
```

### ✅ VSCode Autocomplete

JSDoc enables full IntelliSense in VSCode:

- Method autocomplete
- Parameter type checking
- Return type validation
- Documentation hints

### ✅ No Runtime Overhead

JSDoc is just comments, so no runtime performance impact.

---

**Last Updated**: 2025-10-20
