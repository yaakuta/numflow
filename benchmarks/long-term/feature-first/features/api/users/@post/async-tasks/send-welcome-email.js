module.exports = async function sendWelcomeEmail(ctx, req, res) {
  try {
    // Simulate welcome email sending
    await new Promise((resolve) => setTimeout(resolve, 150))

    global.testData.asyncTasksCompleted++
  } catch (error) {
    global.testData.asyncTasksFailed++
  }
}
