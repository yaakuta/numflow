module.exports = async (context) => {
  if (!global.executionLog) global.executionLog = []
  global.executionLog.push('early-async-task')
}
