/**
 * Auto-Discovery Engine Tests

 */

import * as fs from 'fs'
import * as path from 'path'
import { AutoDiscovery } from '../src/feature/auto-discovery'

describe('Auto-Discovery Engine', () => {
  const testDir = path.join(__dirname, '__test-steps__')

  beforeEach(() => {
    // Create test directory
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true })
    }
  })

  afterEach(() => {
    // Clean up test directory
    if (fs.existsSync(testDir)) {
      const files = fs.readdirSync(testDir)
      files.forEach(file => {
        fs.unlinkSync(path.join(testDir, file))
      })
      fs.rmdirSync(testDir)
    }
  })

  describe('Filename Pattern Validation', () => {
    it('should correctly recognize files with valid patterns', async () => {
      // Create valid files
      createStepFile('100-validate.js', 'module.exports = async (ctx, req, res) => true')
      createStepFile('200-process.js', 'module.exports = async (ctx, req, res) => true')
      createStepFile('300-complete.js', 'module.exports = async (ctx, req, res) => true')

      const discovery = new AutoDiscovery({
        directory: testDir,
        pattern: /^\d+-.*\.(js|ts)$/,
        allowDuplicates: false,
      })

      const steps = await discovery.discoverSteps()

      expect(steps).toHaveLength(3)
      expect(steps[0].number).toBe(100)
      expect(steps[1].number).toBe(200)
      expect(steps[2].number).toBe(300)
    })

    it('should ignore files with invalid patterns (no number)', async () => {
      createStepFile('validate.js', 'module.exports = async (ctx, req, res) => true')
      createStepFile('process.js', 'module.exports = async (ctx, req, res) => true')

      const discovery = new AutoDiscovery({
        directory: testDir,
        pattern: /^\d+-.*\.(js|ts)$/,
        allowDuplicates: false,
      })

      await expect(discovery.discoverSteps()).rejects.toThrow('No valid step files found')
    })

    it('should ignore files with invalid patterns (number at end)', async () => {
      createStepFile('validate-100.js', 'module.exports = async (ctx, req, res) => true')
      createStepFile('200-process.js', 'module.exports = async (ctx, req, res) => true')

      const discovery = new AutoDiscovery({
        directory: testDir,
        pattern: /^\d+-.*\.(js|ts)$/,
        allowDuplicates: false,
      })

      const steps = await discovery.discoverSteps()

      // validate-100.js is ignored, only 200-process.js is recognized
      expect(steps).toHaveLength(1)
      expect(steps[0].number).toBe(200)
    })

    it('should only recognize .js and .ts files', async () => {
      createStepFile('100-validate.js', 'module.exports = async (ctx, req, res) => true')
      createStepFile('200-process.ts', 'export default async (_ctx: any) => true')
      createStepFile('300-complete.txt', 'invalid')
      createStepFile('400-finish.md', 'invalid')

      const discovery = new AutoDiscovery({
        directory: testDir,
        pattern: /^\d+-.*\.(js|ts)$/,
        allowDuplicates: false,
      })

      const steps = await discovery.discoverSteps()

      // .txt and .md are ignored
      expect(steps).toHaveLength(2)
      expect(steps[0].number).toBe(100)
      expect(steps[1].number).toBe(200)
    })
  })

  describe('Number Extraction and Size-Based Sorting', () => {
    it('should correctly extract numbers from filenames', async () => {
      createStepFile('100-validate.js', 'module.exports = async (ctx, req, res) => true')
      createStepFile('200-process.js', 'module.exports = async (ctx, req, res) => true')
      createStepFile('1500-notify.js', 'module.exports = async (ctx, req, res) => true')

      const discovery = new AutoDiscovery({
        directory: testDir,
        pattern: /^\d+-.*\.(js|ts)$/,
        allowDuplicates: false,
      })

      const steps = await discovery.discoverSteps()

      expect(steps[0].number).toBe(100)
      expect(steps[1].number).toBe(200)
      expect(steps[2].number).toBe(1500)
    })

    it('should correctly perform size-based sorting (order agnostic)', async () => {
      // File creation order differs from execution order
      createStepFile('300-complete.js', 'module.exports = async (ctx, req, res) => true')
      createStepFile('100-validate.js', 'module.exports = async (ctx, req, res) => true')
      createStepFile('200-process.js', 'module.exports = async (ctx, req, res) => true')
      createStepFile('50-init.js', 'module.exports = async (ctx, req, res) => true')

      const discovery = new AutoDiscovery({
        directory: testDir,
        pattern: /^\d+-.*\.(js|ts)$/,
        allowDuplicates: false,
      })

      const steps = await discovery.discoverSteps()

      // Size order: 50, 100, 200, 300
      expect(steps).toHaveLength(4)
      expect(steps[0].number).toBe(50)
      expect(steps[1].number).toBe(100)
      expect(steps[2].number).toBe(200)
      expect(steps[3].number).toBe(300)
    })

    it('should correctly sort large numbers', async () => {
      createStepFile('10-init.js', 'module.exports = async (ctx, req, res) => true')
      createStepFile('100-validate.js', 'module.exports = async (ctx, req, res) => true')
      createStepFile('1000-notify.js', 'module.exports = async (ctx, req, res) => true')
      createStepFile('50-prepare.js', 'module.exports = async (ctx, req, res) => true')

      const discovery = new AutoDiscovery({
        directory: testDir,
        pattern: /^\d+-.*\.(js|ts)$/,
        allowDuplicates: false,
      })

      const steps = await discovery.discoverSteps()

      expect(steps[0].number).toBe(10)
      expect(steps[1].number).toBe(50)
      expect(steps[2].number).toBe(100)
      expect(steps[3].number).toBe(1000)
    })

    it('size-based sorting allows easy middle insertion', async () => {
      // Can add 150 between 100, 200, 300
      createStepFile('100-validate.js', 'module.exports = async (ctx, req, res) => true')
      createStepFile('200-process.js', 'module.exports = async (ctx, req, res) => true')
      createStepFile('150-check.js', 'module.exports = async (ctx, req, res) => true')
      createStepFile('300-complete.js', 'module.exports = async (ctx, req, res) => true')

      const discovery = new AutoDiscovery({
        directory: testDir,
        pattern: /^\d+-.*\.(js|ts)$/,
        allowDuplicates: false,
      })

      const steps = await discovery.discoverSteps()

      expect(steps[0].number).toBe(100)
      expect(steps[1].number).toBe(150) // Inserted in middle
      expect(steps[2].number).toBe(200)
      expect(steps[3].number).toBe(300)
    })
  })

  describe('Duplicate Number Validation', () => {
    it('should throw error when duplicate step numbers exist', async () => {
      createStepFile('100-validate.js', 'module.exports = async (ctx, req, res) => true')
      createStepFile('100-check.js', 'module.exports = async (ctx, req, res) => true')

      const discovery = new AutoDiscovery({
        directory: testDir,
        pattern: /^\d+-.*\.(js|ts)$/,
        allowDuplicates: false,
      })

      await expect(discovery.discoverSteps()).rejects.toThrow('Duplicate step number found: 100')
    })

    it('should allow duplicates when allowDuplicates=true', async () => {
      createStepFile('100-validate.js', 'module.exports = async (ctx, req, res) => true')
      createStepFile('100-check.js', 'module.exports = async (ctx, req, res) => true')

      const discovery = new AutoDiscovery({
        directory: testDir,
        pattern: /^\d+-.*\.(js|ts)$/,
        allowDuplicates: true,
      })

      const steps = await discovery.discoverSteps()

      // Duplicates allowed, so both are recognized
      expect(steps).toHaveLength(2)
      expect(steps[0].number).toBe(100)
      expect(steps[1].number).toBe(100)
    })

    it('should detect 3 or more duplicate numbers', async () => {
      createStepFile('200-a.js', 'module.exports = async (ctx, req, res) => true')
      createStepFile('200-b.js', 'module.exports = async (ctx, req, res) => true')
      createStepFile('200-c.js', 'module.exports = async (ctx, req, res) => true')

      const discovery = new AutoDiscovery({
        directory: testDir,
        pattern: /^\d+-.*\.(js|ts)$/,
        allowDuplicates: false,
      })

      await expect(discovery.discoverSteps()).rejects.toThrow('Duplicate step number found: 200')
    })
  })

  describe('Directory Validation', () => {
    it('should throw error when directory does not exist', async () => {
      const nonExistentDir = path.join(__dirname, '__non-existent__')

      const discovery = new AutoDiscovery({
        directory: nonExistentDir,
        pattern: /^\d+-.*\.(js|ts)$/,
        allowDuplicates: false,
      })

      await expect(discovery.discoverSteps()).rejects.toThrow(`Steps directory not found: ${nonExistentDir}`)
    })

    it('should throw error when directory is empty', async () => {
      // Empty directory
      const discovery = new AutoDiscovery({
        directory: testDir,
        pattern: /^\d+-.*\.(js|ts)$/,
        allowDuplicates: false,
      })

      await expect(discovery.discoverSteps()).rejects.toThrow('No valid step files found')
    })
  })

  describe('Async Tasks Discovery', () => {
    it('should discover files in async tasks directory', async () => {
      createStepFile('send-email.js', 'module.exports = async (ctx, req, res) => {}')
      createStepFile('send-sms.js', 'module.exports = async (ctx, req, res) => {}')

      const discovery = new AutoDiscovery({
        directory: testDir,
        pattern: /.*\.(js|ts)$/,
        allowDuplicates: true,
      })

      const tasks = await discovery.discoverAsyncTasks()

      expect(tasks).toHaveLength(2)
      expect(tasks[0].name).toBe('send-email')
      expect(tasks[1].name).toBe('send-sms')
    })

    it('should return empty array when async tasks directory does not exist', async () => {
      const nonExistentDir = path.join(__dirname, '__non-existent-tasks__')

      const discovery = new AutoDiscovery({
        directory: nonExistentDir,
        pattern: /.*\.(js|ts)$/,
        allowDuplicates: true,
      })

      const tasks = await discovery.discoverAsyncTasks()

      expect(tasks).toEqual([])
    })

    it('async tasks have no order so are not sorted', async () => {
      createStepFile('z-last.js', 'module.exports = async (ctx, req, res) => {}')
      createStepFile('a-first.js', 'module.exports = async (ctx, req, res) => {}')

      const discovery = new AutoDiscovery({
        directory: testDir,
        pattern: /.*\.(js|ts)$/,
        allowDuplicates: true,
      })

      const tasks = await discovery.discoverAsyncTasks()

      expect(tasks).toHaveLength(2)
      // Filesystem order (no sorting)
    })
  })

  describe('Step Function Loading', () => {
    it('should load functions exported with module.exports', async () => {
      // Use separate directory
      const testDir2 = path.join(__dirname, '__test-step-load__')
      if (!fs.existsSync(testDir2)) {
        fs.mkdirSync(testDir2, { recursive: true })
      }

      fs.writeFileSync(
        path.join(testDir2, '100-validate.js'),
        'module.exports = async (ctx, req, res) => { ctx.validated = true }'
      )

      const discovery = new AutoDiscovery({
        directory: testDir2,
        pattern: /^\d+-.*\.(js|ts)$/,
        allowDuplicates: false,
      })

      const steps = await discovery.discoverSteps()

      expect(steps[0].fn).toBeInstanceOf(Function)

      // Test function execution
      const ctx: any = {}
      const req: any = {}
      const res: any = {}
      await steps[0].fn(ctx, req, res)
      expect(ctx.validated).toBe(true)

      // Clean up
      fs.unlinkSync(path.join(testDir2, '100-validate.js'))
      fs.rmdirSync(testDir2)
    })

    it('should also load functions exported with default export', async () => {
      createStepFile('100-validate.js', 'export default async (ctx, req, res) => { ctx.validated = true }')

      const discovery = new AutoDiscovery({
        directory: testDir,
        pattern: /^\d+-.*\.(js|ts)$/,
        allowDuplicates: false,
      })

      const steps = await discovery.discoverSteps()

      expect(steps[0].fn).toBeInstanceOf(Function)
    })

    it('should throw error when exporting non-function', async () => {
      createStepFile('100-invalid.js', 'module.exports = { notAFunction: true }')

      const discovery = new AutoDiscovery({
        directory: testDir,
        pattern: /^\d+-.*\.(js|ts)$/,
        allowDuplicates: false,
      })

      await expect(discovery.discoverSteps()).rejects.toThrow('Step file must export a function')
    })
  })

  // Helper function
  function createStepFile(filename: string, content: string) {
    fs.writeFileSync(path.join(testDir, filename), content)
  }
})
