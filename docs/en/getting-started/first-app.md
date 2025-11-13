# Installation & First Application

## Installation

### Requirements

Environment requirements for using Numflow:

- **Node.js**: 16.0.0 or higher
- **npm** or **yarn**

Check your current Node.js version:

```bash
node --version
```

### Package Installation

Install Numflow using npm:

```bash
npm install numflow
```

Or using yarn:

```bash
yarn add numflow
```

---

## First Application

Let's create the simplest Numflow application.

### JavaScript (CommonJS)

Create an `app.js` file:

```javascript
const numflow = require('numflow')

// Create Numflow application
const app = numflow()

// Start server
app.listen(3000, () => {
  console.log('Server running on http://localhost:3000')
})
```

Run the application:

```bash
node app.js
```

Open `http://localhost:3000` in your browser to see the "Numflow Framework" message.

### JavaScript (ESM)

To use ESM, add `"type": "module"` to your `package.json` or use the `.mjs` file extension.

Create an `app.mjs` file:

```javascript
import numflow from 'numflow'

// Create Numflow application
const app = numflow()

// Start server
app.listen(3000, () => {
  console.log('Server running on http://localhost:3000')
})
```

Run the application:

```bash
node app.mjs
```

---

## Choosing a Module System

Numflow fully supports both CommonJS and ESM. Choose the approach that fits your project.

### CommonJS Approach

```javascript
// Using require
const numflow = require('numflow')
const app = numflow()
```

**Advantages:**
- Node.js default approach
- Compatible with most existing projects
- No build process required

**Recommended for:**
- Existing Node.js projects
- Rapid prototyping

### ESM Approach

```javascript
// Using import
import numflow from 'numflow'
const app = numflow()
```

**Advantages:**
- Modern JavaScript standard
- Static analysis support
- Tree-shaking support

**Recommended for:**
- New projects
- Leveraging latest JavaScript features

---

## Server Configuration

Numflow allows you to manage application settings through `set()` and `get()` methods.

### Storing and Retrieving Settings

```javascript
const numflow = require('numflow')
const app = numflow()

// Store settings
app.set('title', 'My Numflow App')
app.set('port', 3000)
app.set('env', 'development')

// Retrieve settings
const title = app.get('title')
const port = app.get('port')
const env = app.get('env')

console.log(`${title} is running on port ${port} in ${env} mode`)

// Start server using settings
app.listen(app.get('port'), () => {
  console.log(`Server running on http://localhost:${app.get('port')}`)
})
```

### Chaining

The `set()` method supports chaining:

```javascript
app
  .set('title', 'My App')
  .set('port', 3000)
  .set('env', 'development')
```

### Common Configuration Items

```javascript
// Port number
app.set('port', process.env.PORT || 3000)

// Environment (development, production, etc.)
app.set('env', process.env.NODE_ENV || 'development')

// Application name
app.set('title', 'My Application')

// Custom settings
app.set('api-version', 'v1')
app.set('max-upload-size', '10mb')
```

---

**Previous**: [Table of Contents](./README.md)
