/**
 * Test fixture: Feature in non-features directory
 * This tests that FeatureScanner can correctly resolve conventions
 * even when the directory is not named "features"
 */
import { feature } from '../../../../../src/feature/index.js'

export default feature({
  contextInitializer: (ctx) => {
    ctx.initialized = true
  },
})
