module.exports = async (context, req, res) => {
  if (!global.executionLog) global.executionLog = []
  global.executionLog.push('normal-300-response')
  context.data.step300 = 'executed'
  res.json({ result: 'normal', data: context.data })
}
