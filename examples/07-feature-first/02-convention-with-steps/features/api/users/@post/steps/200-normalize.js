/**
 * Step 200: Data Normalization
 *
 * Normalize user input data.
 * - name: trim
 * - email: lowercase + trim
 * - age: null handling
 */

module.exports = async (ctx, req, res) => {
  console.log('🔹 Step 200: Data normalization')

  const { name, email, age } = ctx.userData

  const normalizedData = {
    name: name.trim(),
    email: email.toLowerCase().trim(),
    age: age || null,
  }

  console.log('  ✅ Data normalization complete:', normalizedData)

  // v0.2.0: Store directly in ctx
  ctx.normalizedData = normalizedData

  // Done! Automatically proceed to next step
}
