module.exports = async function validate(ctx, req, res) {
  global.testData.totalStepsExecuted++

  const { name, email } = req.body

  if (!name || !email) {
    throw new Error('Missing required fields')
  }

  if (!email.includes('@')) {
    throw new Error('Invalid email')
  }

  ctx.name = name
  ctx.email = email
}
