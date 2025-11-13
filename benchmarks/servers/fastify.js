/**
 * Fastify benchmark server
 * Reference for comparison with Numflow and Express
 */

const fastify = require('fastify')({ logger: false })

// 1. Hello World
fastify.get('/', async (request, reply) => {
  return 'Hello World'
})

// 2. JSON response
fastify.get('/json', async (request, reply) => {
  return {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
  }
})

// 3. Route parameter
fastify.get('/users/:id', async (request, reply) => {
  return {
    id: request.params.id,
    name: 'User ' + request.params.id,
  }
})

// 4. JSON POST (body parsing)
fastify.post('/users', async (request, reply) => {
  return request.body
})

// 5. Query string
fastify.get('/search', async (request, reply) => {
  return {
    query: request.query,
    result: 'Found 10 items',
  }
})

// 6. Multiple route parameters
fastify.get('/users/:userId/posts/:postId', async (request, reply) => {
  return {
    userId: request.params.userId,
    postId: request.params.postId,
  }
})

// 7. Middleware chain simulation (using Fastify hooks)
fastify.addHook('preHandler', async (request, reply) => {
  request.customData = { middleware1: true }
})
fastify.addHook('preHandler', async (request, reply) => {
  request.customData.middleware2 = true
})
fastify.addHook('preHandler', async (request, reply) => {
  request.customData.middleware3 = true
})
fastify.addHook('preHandler', async (request, reply) => {
  request.customData.middleware4 = true
})

fastify.get('/middleware-chain', async (request, reply) => {
  return { success: true, data: request.customData }
})

// Feature-First simulation (10 steps)
fastify.post('/feature-simulation', async (request, reply) => {
  // 10-step processing simulation
  const context = {
    userId: 1,
    data: request.body,
    results: {},
  }

  for (let i = 1; i <= 10; i++) {
    ctx[`step${i}`] = `processed-${i}`
  }

  return { success: true, data: ctx }
})

const port = process.env.PORT || 3002
fastify.listen({ port }, (err, address) => {
  if (err) {
    fastify.log.error(err)
    process.exit(1)
  }
  console.log(`Fastify server running on port ${port}`)
})
