module.exports = async (context) => {
  if (!global.executionLog) global.executionLog = []
  global.executionLog.push('normal-200-second')
  context.data.step200 = 'executed'
}
