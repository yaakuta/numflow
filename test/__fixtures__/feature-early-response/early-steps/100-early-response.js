module.exports = async (context, req, res) => {
  if (!global.executionLog) global.executionLog = []
  global.executionLog.push('early-100-response')
  // Early response!
  res.json({ result: 'early', step: 100 })
}
