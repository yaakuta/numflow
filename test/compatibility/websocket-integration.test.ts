/**
 * WebSocket Integration Tests
 * Tests full WebSocket integration with ws library (Express.js compatible)
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import { Application } from '../../src/application.js'
import { WebSocketServer, WebSocket } from 'ws'
import * as http from 'http'

describe('WebSocket Integration (ws library)', () => {
  let app: Application
  let server: http.Server
  let wsServer: WebSocketServer

  beforeEach(() => {
    app = new Application()
  })

  afterEach(async () => {
    // First, forcefully close all WebSocket client connections
    if (wsServer) {
      for (const client of wsServer.clients) {
        try {
          client.terminate()
        } catch {
          // Ignore errors during cleanup
        }
      }

      // Then close WebSocket server with timeout
      await new Promise<void>((resolve) => {
        const timeout = setTimeout(() => resolve(), 1000)
        wsServer.close(() => {
          clearTimeout(timeout)
          resolve()
        })
      })
      wsServer = null as any
    }

    // Then close HTTP server
    if (server && server.listening) {
      if (typeof server.closeAllConnections === 'function') {
        server.closeAllConnections()
      }
      await new Promise<void>((resolve) => {
        const timeout = setTimeout(() => resolve(), 1000)
        server.close(() => {
          clearTimeout(timeout)
          resolve()
        })
      })
    }
    server = null as any
  })

  it('should support WebSocket using ws library (Express.js pattern)', (done) => {
    // HTTP route
    app.get('/', (_req, res) => {
      res.send('Hello HTTP')
    })

    // Start server
    server = app.listen(0)

    // Create WebSocket server (Express.js pattern)
    wsServer = new WebSocketServer({ noServer: true })

    wsServer.on('connection', (socket) => {
      socket.on('message', (message) => {
        // Echo back
        socket.send(`Echo: ${message}`)
      })
    })

    // Handle upgrade
    server.on('upgrade', (request, socket, head) => {
      wsServer.handleUpgrade(request, socket, head, (ws) => {
        wsServer.emit('connection', ws, request)
      })
    })

    const address = server.address()
    if (!address || typeof address === 'string') {
      done(new Error('Invalid server address'))
      return
    }
    const port = address.port

    // Test WebSocket client
    const client = new WebSocket(`ws://localhost:${port}`)

    client.on('open', () => {
      client.send('Hello WebSocket')
    })

    client.on('message', (data) => {
      expect(data.toString()).toBe('Echo: Hello WebSocket')
      client.close()
      done()
    })

    client.on('error', (err) => {
      done(err)
    })
  })

  it('should support multiple WebSocket clients', (done) => {
    app.get('/', (_req, res) => {
      res.send('Hello')
    })

    server = app.listen(0)

    wsServer = new WebSocketServer({ noServer: true })

    const clients = new Set<WebSocket>()

    wsServer.on('connection', (socket) => {
      clients.add(socket)

      socket.on('message', (message) => {
        // Broadcast to all clients
        clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(`Broadcast: ${message}`)
          }
        })
      })

      socket.on('close', () => {
        clients.delete(socket)
      })
    })

    server.on('upgrade', (request, socket, head) => {
      wsServer.handleUpgrade(request, socket, head, (ws) => {
        wsServer.emit('connection', ws, request)
      })
    })

    const address = server.address()
    if (!address || typeof address === 'string') {
      done(new Error('Invalid server address'))
      return
    }
    const port = address.port

    // Create two clients
    const client1 = new WebSocket(`ws://localhost:${port}`)
    const client2 = new WebSocket(`ws://localhost:${port}`)

    let client1Received = false
    let client2Received = false
    let bothConnected = false

    const checkDone = () => {
      if (client1Received && client2Received) {
        client1.close()
        client2.close()
        done()
      }
    }

    // Wait for both clients to be connected before sending message
    let connectedCount = 0
    const onOpen = () => {
      connectedCount++
      if (connectedCount === 2 && !bothConnected) {
        bothConnected = true
        client1.send('Hello from client1')
      }
    }

    client1.on('open', onOpen)
    client2.on('open', onOpen)

    client1.on('message', (data) => {
      expect(data.toString()).toBe('Broadcast: Hello from client1')
      client1Received = true
      checkDone()
    })

    client2.on('message', (data) => {
      expect(data.toString()).toBe('Broadcast: Hello from client1')
      client2Received = true
      checkDone()
    })

    client1.on('error', done)
    client2.on('error', done)
  }, 10000)

  it('should support both HTTP routes and WebSocket on same port', (done) => {
    // HTTP routes
    app.get('/api/users', (_req, res) => {
      res.json({ users: ['Alice', 'Bob'] })
    })

    app.post('/api/users', (_req, res) => {
      res.status(201).json({ message: 'User created' })
    })

    server = app.listen(0)

    // WebSocket server
    wsServer = new WebSocketServer({ noServer: true })

    wsServer.on('connection', (socket) => {
      socket.on('message', (message) => {
        socket.send(`WS: ${message}`)
      })
    })

    server.on('upgrade', (request, socket, head) => {
      wsServer.handleUpgrade(request, socket, head, (ws) => {
        wsServer.emit('connection', ws, request)
      })
    })

    const address = server.address()
    if (!address || typeof address === 'string') {
      done(new Error('Invalid server address'))
      return
    }
    const port = address.port

    // Test HTTP endpoint
    http.get(`http://localhost:${port}/api/users`, (res) => {
      let data = ''
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => {
        const parsed = JSON.parse(data)
        expect(parsed.users).toEqual(['Alice', 'Bob'])

        // Then test WebSocket
        const wsClient = new WebSocket(`ws://localhost:${port}`)

        wsClient.on('open', () => {
          wsClient.send('test')
        })

        wsClient.on('message', (msg) => {
          expect(msg.toString()).toBe('WS: test')
          wsClient.close()
          done()
        })

        wsClient.on('error', done)
      })
    })
  })

  it('should support WebSocket with path-based routing', (done) => {
    app.get('/', (_req, res) => {
      res.send('Hello')
    })

    server = app.listen(0)

    wsServer = new WebSocketServer({ noServer: true })

    wsServer.on('connection', (socket, request) => {
      const path = request.url || ''

      if (path === '/chat') {
        socket.send('Welcome to chat')
      } else if (path === '/notifications') {
        socket.send('Welcome to notifications')
      } else {
        socket.send('Welcome')
      }
    })

    server.on('upgrade', (request, socket, head) => {
      wsServer.handleUpgrade(request, socket, head, (ws) => {
        wsServer.emit('connection', ws, request)
      })
    })

    const address = server.address()
    if (!address || typeof address === 'string') {
      done(new Error('Invalid server address'))
      return
    }
    const port = address.port

    const chatClient = new WebSocket(`ws://localhost:${port}/chat`)

    chatClient.on('message', (data) => {
      expect(data.toString()).toBe('Welcome to chat')
      chatClient.close()
      done()
    })

    chatClient.on('error', done)
  })
})
