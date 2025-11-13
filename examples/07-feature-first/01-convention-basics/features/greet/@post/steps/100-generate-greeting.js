/**
 * Step 1: Generate greeting
 */
module.exports = async (ctx, req, res) => {
  console.log('🔹 Step 1: Generate greeting')

  let greeting
  if (ctx.language === 'ko') {
    greeting = `Annyeonghaseyo, ${ctx.name}!`
  } else if (ctx.language === 'ja') {
    greeting = `Konnichiwa, ${ctx.name}!`
  } else {
    greeting = `Hello, ${ctx.name}!`
  }

  // v0.4.0: Store directly in ctx
  ctx.greeting = greeting
  // Done! Automatically proceeds to next Step
}
