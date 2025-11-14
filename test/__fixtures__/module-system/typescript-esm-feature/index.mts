/**
 * TypeScript ESM Feature (index.mts)
 * Tests that Feature index files can be .mts
 */
import numflow from '../../../../dist/esm/index.js'

export default numflow.feature({
  method: 'GET',
  path: '/typescript-esm',
})
