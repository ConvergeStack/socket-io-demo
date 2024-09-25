import express from 'express'
import { createServer } from 'node:http'
import { config } from './config.js'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { Server } from 'socket.io'

const app = express()
const server = createServer(app)
const io = new Server(server, {
  cors: {
    origin: [`http://localhost:${config.port}`, `http://127.0.0.1:${config.port}`]
  }
})

const __dirname = dirname(fileURLToPath(import.meta.url))

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`)
  next()
})

app.get('/', (req, res) => {
  res.sendFile(join(__dirname, 'home.html'))
})

app.get('/active-users', (req, res) => {
  emitAdminDebugEvent('ACTIVE_USERS_REQUESTED', {
    method: req.method,
    url: req.url,
    headers: {
      'user-agent': req.headers['user-agent'],
      accept: req.headers.accept
    },
    ip: req.ip,
    timestamp: new Date().toISOString()
  })
  res.send(Array.from(io.sockets.sockets)
    .filter(([id, socket]) => socket.username !== 'WEB_ADMIN')
    .map(([id, socket]) => ({
      socketId: id,
      username: socket.username
    })))
})

server.listen(config.port, () => {
  console.log(`server running at http://localhost:${config.port}`)
})

io.use((socket, next) => {
  // if (socket.handshake.auth.token !== 'todo') {
  //     next(new Error("Unauthorized"));
  //     return;
  // }
  if (!socket.handshake.auth.username) {
    const errorMsg = 'Unauthorized: No username provided'
    console.log(errorMsg)
    emitAdminDebugEvent('AUTHORIZATION_FAILED', { message: errorMsg })
    next(new Error('Unauthorized'))
    return
  }
  socket.username = socket.handshake.auth.username
  next()
})

setInterval(() => {
  emitAdminDebugEvent('SERVER_HEALTH_CHECK', {
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
    cpuUsage: process.cpuUsage(),
    activeUsers: Array.from(io.sockets.sockets.values()).map(socket => socket.username)
  })
}, 30_000)

function emitAdminDebugEvent (event, data) {
  const adminSocket = Array.from(io.sockets.sockets.values())
    .find(s => s.username === 'WEB_ADMIN')
  if (adminSocket) {
    adminSocket.emit('debug', { event, data })
  }
}

io.on('connection', (socket) => {
  const connectMsg = `Socket client connected with id ${socket.id}`
  console.log(connectMsg)
  socket.broadcast.emit('CLIENT_CONNECTED', {
    socketId: socket.id,
    username: socket.username,
    connectedUsers: io.sockets.sockets.size
  })

  socket.on('disconnect', reason => {
    const disconnectMsg = `Socket client ${socket.id} disconnected - ${reason}`
    console.log(disconnectMsg)
    socket.broadcast.emit('CLIENT_DISCONNECTED', {
      socketId: socket.id,
      username: socket.username,
      connectedUsers: io.sockets.sockets.size,
      reason
    })
  })

  socket.on('EVENT_CHAT_MESSAGE', (data) => {
    const targetSocket = Array.from(io.sockets.sockets.values())
      .find(s => s.username === data.toUsername)

    if (!targetSocket) {
      const errorMsg = `User "${data.toUsername}" is not connected.`
      console.log(errorMsg)
      socket.emit('ERROR', { message: errorMsg })
      emitAdminDebugEvent('ERROR', { message: errorMsg })
      return
    }

    const messageData = {
      ...data,
      id: Math.random().toString(36).substring(2, 11),
      fromUsername: socket.username
    }

    targetSocket.emit('EVENT_CHAT_MESSAGE', messageData)
    emitAdminDebugEvent('EVENT_CHAT_MESSAGE', messageData)
  })
})
