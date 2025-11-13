/**
 * Response step - Send response

 */
module.exports = async (ctx, req, res) => {

  const { requestBody, ...data } = ctx

  res.statusCode = 200
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify({
    success: true,
    data
  }))
}
