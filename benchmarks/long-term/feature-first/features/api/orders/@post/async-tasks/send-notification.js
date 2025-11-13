module.exports = async function sendNotification(ctx, req, res) {
  try {
    // Simulate notification sending
    await new Promise((resolve) => setTimeout(resolve, 100))

    // Success
    global.testData.asyncTasksCompleted++
  } catch (error) {
    // Failure
    global.testData.asyncTasksFailed++
  }
}
