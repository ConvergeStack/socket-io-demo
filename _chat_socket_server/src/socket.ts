import { } from 'socket.io'
import { formatUptime, formatMemoryUsage, formatCpuUsage } from '@/utils'
import { SocketIOType } from '@/server'

export function setupSocket (io: SocketIOType): void {
  io.use((socket, next) => {
    if (!socket.handshake.auth.username) {
      const errorMsg = 'Unauthorized: No username provided'
      console.log(errorMsg)
      emitAdminDebugEvent(io, 'AUTHORIZATION_FAILED', { message: errorMsg })
      next(new Error('Unauthorized'))
      return
    }
    socket.data.username = socket.handshake.auth.username
    next()
  })

  setInterval(() => {
    emitAdminDebugEvent(io, 'SERVER_HEALTH_CHECK', {
      timestamp: new Date().toISOString(),
      uptime: formatUptime(process.uptime()),
      memoryUsage: formatMemoryUsage(process.memoryUsage()),
      cpuUsage: formatCpuUsage(process.cpuUsage()),
      activeUsers: Array.from(io.sockets.sockets.values())
        .map(socket => ({ socketId: socket.id, username: socket.data.username }))
    })
  }, 30_000)

  io.on('connection', (socket) => {
    const connectMsg = `Socket client connected with id ${socket.id}`
    console.log(connectMsg)

    socket.broadcast.emit('CLIENT_CONNECTED', {
      socketId: socket.id,
      username: socket.data.username,
      connectedUsers: io.sockets.sockets.size
    })

    socket.on('disconnect', (reason: string) => {
      const disconnectMsg = `Socket client ${socket.id} disconnected - ${reason}`
      console.log(disconnectMsg)
      socket.broadcast.emit('CLIENT_DISCONNECTED', {
        socketId: socket.id,
        username: socket.data.username,
        connectedUsers: io.sockets.sockets.size,
        reason
      })
    })

    // @ts-expect-error
    socket.on('EVENT_CHAT_MESSAGE', (data: any) => {
      const targetSockets = Array.from(io.sockets.sockets.values())
        .filter(s => s.data.username === data.toUsername)

      if (targetSockets.length === 0) {
        const errorMsg = `User "${data.toUsername}" is not connected.`
        console.log(errorMsg)
        socket.emit('ERROR', { message: errorMsg })
        emitAdminDebugEvent(io, 'ERROR', { message: errorMsg })
        return
      }

      const messageData = {
        ...data,
        id: Math.random().toString(36).substring(2, 11),
        fromUsername: socket.data.username
      }

      targetSockets.forEach(targetSocket => {
        // @ts-expect-error
        targetSocket.emit('EVENT_CHAT_MESSAGE', messageData)
      })

      emitAdminDebugEvent(io, 'EVENT_CHAT_MESSAGE', messageData)
    })
  })
}

export function emitAdminDebugEvent (io: SocketIOType, event: string, data: any): void {
  const adminSockets = Array.from(io.sockets.sockets.values())
    .filter(s => s.data.username === 'WEB_ADMIN')

  adminSockets.forEach(adminSocket => {
    adminSocket.emit('DEBUG', { event, data })
  })
}
