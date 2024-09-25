import express from 'express'
import { createServer } from 'node:http'
import { config } from './config.js'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { Server } from 'socket.io'
import crypto from 'node:crypto'

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
  res.send(Array.from(io.sockets.sockets)
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
    next(new Error('Unauthorized'))
    return
  }
  socket.username = socket.handshake.auth.username
  next()
})

setInterval(() => {
  const now = new Date().toISOString()
  console.log('Broadcasting TIME_MESSAGE', now)
  io.sockets.emit('TIME_MESSAGE', 'This message is sent every 30 second, it can be used to test the connection.')
}, 30_000)

io.on('connection', (socket) => {
  console.log(`Socket client connected with id ${socket.id}`)
  socket.broadcast.emit('CLIENT_CONNECTED', {
    socketId: socket.id,
    username: socket.username,
    connectedUsers: io.sockets.sockets.size
  })

  socket.on('disconnect', reason => {
    console.log(`Socket client ${socket.id} disconnected - ${reason}`)
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
      socket.emit('ERROR', {
        message: `User "${data.toUsername}" is not connected.`
      })
      return
    }

    targetSocket.emit('EVENT_CHAT_MESSAGE', {
      ...data,
      id: crypto.randomUUID(),
      fromUsername: socket.username
    })
  })
})
