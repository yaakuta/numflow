#!/usr/bin/env node

/**
 * Fixture validation script
 *
 * Tests whether generated fixtures work correctly by starting actual server.
 */

const { spawn } = require('child_process')
const path = require('path')

const SERVER_PORT = 3333
const WARMUP_TIME = 2000

/**
 * Start server
 */
function startServer() {
  return new Promise((resolve, reject) => {
    const serverPath = path.join(__dirname, '..', 'servers', 'numflow.js')
    const server = spawn('node', [serverPath], {
      env: { ...process.env, PORT: SERVER_PORT },
    })

    let started = false

    server.stdout.on('data', (data) => {
      if (data.toString().includes('running on port') && !started) {
        started = true
        resolve(server)
      }
    })

    server.stderr.on('data', (data) => {
      console.error(`Server error: ${data}`)
    })

    server.on('error', reject)

    setTimeout(() => {
      if (!started) {
        reject(new Error('Server failed to start'))
      }
    }, 5000)
  })
}

/**
 * Test HTTP request
 */
async function testRequest(path, body = null) {
  const http = require('http')

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: SERVER_PORT,
      path: path,
      method: body ? 'POST' : 'GET',
      headers: body
        ? {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(JSON.stringify(body)),
          }
        : {},
    }

    const req = http.request(options, (res) => {
      let data = ''

      res.on('data', (chunk) => {
        data += chunk
      })

      res.on('end', () => {
        try {
          const json = JSON.parse(data)
          resolve({ statusCode: res.statusCode, body: json })
        } catch (err) {
          resolve({ statusCode: res.statusCode, body: data })
        }
      })
    })

    req.on('error', reject)

    if (body) {
      req.write(JSON.stringify(body))
    }

    req.end()
  })
}

/**
 * Main function
 */
async function main() {
  console.log('🔍 Starting fixture validation...\n')

  let server = null

  try {
    // 1. Start server
    console.log('  Starting Numflow server...')
    server = await startServer()
    console.log('  ✅ Server started\n')

    // Warmup
    await new Promise((resolve) => setTimeout(resolve, WARMUP_TIME))

    // 2. Test Feature-First (10 Steps)
    console.log('  Testing Feature-First (10 Steps)...')
    const result10 = await testRequest('/api/feature-10-steps', { test: 'data' })

    if (result10.statusCode !== 200) {
      throw new Error(
        `Feature-First (10 Steps) failed with status ${result10.statusCode}: ${JSON.stringify(result10.body)}`
      )
    }

    if (!result10.body.success || !result10.body.result) {
      throw new Error(
        `Feature-First (10 Steps) response invalid: ${JSON.stringify(result10.body)}`
      )
    }

    // Check if all steps are processed
    for (let i = 1; i <= 10; i++) {
      if (!result10.body.result[`step${i}`]) {
        throw new Error(`Feature-First (10 Steps) missing step${i}`)
      }
    }

    console.log('  ✅ Feature-First (10 Steps) validated\n')

    // 3. Test Feature-First (50 Steps)
    console.log('  Testing Feature-First (50 Steps)...')
    const result50 = await testRequest('/api/feature-50-steps', { test: 'data' })

    if (result50.statusCode !== 200) {
      throw new Error(
        `Feature-First (50 Steps) failed with status ${result50.statusCode}: ${JSON.stringify(result50.body)}`
      )
    }

    if (!result50.body.success || !result50.body.result) {
      throw new Error(
        `Feature-First (50 Steps) response invalid: ${JSON.stringify(result50.body)}`
      )
    }

    // Check if all steps are processed
    for (let i = 1; i <= 50; i++) {
      if (!result50.body.result[`step${i}`]) {
        throw new Error(`Feature-First (50 Steps) missing step${i}`)
      }
    }

    console.log('  ✅ Feature-First (50 Steps) validated\n')

    console.log('✅ All fixtures validated successfully!')
  } catch (error) {
    console.error('\n❌ Fixture validation FAILED!')
    console.error(error.message)
    throw error // re-throw to let caller handle it
  } finally {
    if (server) {
      server.kill()
    }
  }
}

// Execute
if (require.main === module) {
  main()
    .then(() => {
      process.exit(0)
    })
    .catch((error) => {
      console.error(error)
      process.exit(1)
    })
}

module.exports = { main }
