module.exports = async (context) => {
  if (!global.executionLog) global.executionLog = []
  global.executionLog.push('early-200-SHOULD-NOT-EXECUTE')
  context.data = { step200: 'SHOULD NOT BE HERE' }
}
