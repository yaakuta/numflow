module.exports = async (context) => {
  if (!global.executionLog) global.executionLog = []
  global.executionLog.push('normal-100-first')
  context.data = { step100: 'executed' }
}
