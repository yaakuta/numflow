module.exports = async function createUser(ctx, req, res) {
  global.testData.totalStepsExecuted++

  const user = {
    id: global.testData.users.length + 1,
    name: ctx.name,
    email: ctx.email,
    createdAt: new Date().toISOString(),
  }

  global.testData.users.push(user)

  ctx.user = user
}
