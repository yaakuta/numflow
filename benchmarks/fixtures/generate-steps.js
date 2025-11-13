/**
 * Automatic Steps generation script
 */

const fs = require('fs')
const path = require('path')

/**
 * Generate Step files
 * @param {string} dir - Directory path
 * @param {number} count - Number of steps to generate
 */
function generateSteps(dir, count) {
  // Create directory
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  // Generate Step files
  for (let i = 1; i <= count; i++) {
    const stepNumber = i * (count <= 10 ? 100 : 10)
    const filename = `${stepNumber}-step-${i}.js`
    const filePath = path.join(dir, filename)

    // Last step sends response
    const isLastStep = i === count
    const content = isLastStep
      ? `module.exports = async (context, req, res) => {
  context.step${i} = 'processed-${i}'

  // Send response (last step)
  res.json({ success: true, result: context })
}
`
      : `module.exports = async (context, req, res) => {
  context.step${i} = 'processed-${i}'
}
`

    fs.writeFileSync(filePath, content)
  }

  console.log(`✓ Generated ${count} steps in ${dir}`)
}

// Generate 10 steps
generateSteps(path.join(__dirname, 'steps-10'), 10)

// Generate 50 steps
generateSteps(path.join(__dirname, 'steps-50'), 50)

console.log('\n✅ All fixtures generated!')

/**
 * Validate generated fixtures
 */
async function validateFixtures() {
  console.log('\n🔍 Validating generated fixtures...')

  const dirsToValidate = [
    { dir: path.join(__dirname, 'steps-10'), count: 10 },
    { dir: path.join(__dirname, 'steps-50'), count: 50 },
  ]

  let allValid = true

  for (const { dir, count } of dirsToValidate) {
    console.log(`\n  Checking ${dir}...`)

    // 1. Check file count
    const files = fs.readdirSync(dir).filter((f) => f.endsWith('.js'))
    if (files.length !== count) {
      console.error(`    ❌ Expected ${count} files, found ${files.length}`)
      allValid = false
      continue
    }

    // 2. Check if last step sends response
    const lastStepNumber = count * (count <= 10 ? 100 : 10)
    const lastStepFile = path.join(dir, `${lastStepNumber}-step-${count}.js`)
    const lastStepContent = fs.readFileSync(lastStepFile, 'utf-8')

    if (!lastStepContent.includes('res.json(')) {
      console.error(
        `    ❌ Last step (${lastStepNumber}-step-${count}.js) does NOT send response!`
      )
      console.error(`       Missing: res.json({ success: true, result: context })`)
      allValid = false
      continue
    }

    // 3. Check that middle steps don't send response
    for (let i = 1; i < count; i++) {
      const stepNumber = i * (count <= 10 ? 100 : 10)
      const stepFile = path.join(dir, `${stepNumber}-step-${i}.js`)
      const stepContent = fs.readFileSync(stepFile, 'utf-8')

      if (stepContent.includes('res.json(') || stepContent.includes('res.send(')) {
        console.error(
          `    ❌ Middle step (${stepNumber}-step-${i}.js) should NOT send response!`
        )
        allValid = false
      }
    }

    console.log(`    ✅ ${count} steps validated successfully`)
  }

  if (!allValid) {
    console.error('\n❌ Fixture validation FAILED!')
    process.exit(1)
  }

  console.log('\n✅ All fixtures validated successfully!')
}

// Run validation
validateFixtures()
