module.exports = async (context) => {
  if (!global.executionLog) global.executionLog = []
  global.executionLog.push('middle-async-task')
}
