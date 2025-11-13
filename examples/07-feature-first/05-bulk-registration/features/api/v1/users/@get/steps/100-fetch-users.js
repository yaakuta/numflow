module.exports = async (ctx, req, res) => {
  console.log('🔹 Step 1: Fetching users from database')

  // In production, query from database
  const users = [
    { userId: 'user-1', name: 'Kim Chulsoo', email: 'kim@example.com' },
    { userId: 'user-2', name: 'Lee Younghee', email: 'lee@example.com' },
    { userId: 'user-3', name: 'Park Minsoo', email: 'park@example.com' },
  ]

  console.log(`   ✓ Found ${users.length} users`)

  // v0.4.0: Store directly in Context
  ctx.users = users
  ctx.count = users.length
  // Done! Automatically proceeds to next Step
}
