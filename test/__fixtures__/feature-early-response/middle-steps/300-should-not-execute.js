module.exports = async (context, req, res) => {
  if (!global.executionLog) global.executionLog = []
  global.executionLog.push('middle-300-SHOULD-NOT-EXECUTE')
  res.json({ error: 'This should not execute' })
}
