module.exports = async (context, req, res) => {
  if (!global.executionLog) global.executionLog = []
  global.executionLog.push('middle-200-response')
  context.data.step200 = 'executed'
  // Response in middle!
  res.json({ result: 'middle', step: 200, data: context.data })
}
