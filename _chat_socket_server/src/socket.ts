import { ulid } from 'ulid'
import { formatUptime, formatMemoryUsage, formatCpuUsage } from '@/utils'
import { SocketIOType } from '@/server'
import { createUserInDatabase, getUserFromDatabase, insertMessageIntoDatabase } from '@/database'

export function setupSocket(io: SocketIOType): void {
  io.use(async (socket, next) => {
    if (!socket.handshake.auth.username) {
      const errorMsg = 'Unauthorized: No username provided'
      console.log(errorMsg)
      emitAdminDebugEvent(io, 'AUTHORIZATION_FAILED', { message: errorMsg })
      next(new Error('Unauthorized'))
      return
    }

    let user = await getUserFromDatabase(socket.handshake.auth.username)
    if (!user) {
      user = await createUserInDatabase(socket.handshake.auth.username)
    }
    socket.data.userId = user.id
    next()
  })

  setInterval(() => {
    emitAdminDebugEvent(io, 'SERVER_HEALTH_CHECK', {
      timestamp: new Date().toISOString(),
      uptime: formatUptime(process.uptime()),
      memoryUsage: formatMemoryUsage(process.memoryUsage()),
      cpuUsage: formatCpuUsage(process.cpuUsage()),
      activeUsers: Array.from(io.sockets.sockets.values())
        .map(socket => ({ socketId: socket.id, username: socket.data.userId }))
    })
  }, 30_000)

  io.on('connection', (socket) => {
    const connectMsg = `Socket client connected with id ${socket.id}`
    console.log(connectMsg)

    socket.broadcast.emit('CLIENT_CONNECTED', {
      socketId: socket.id,
      userId: socket.data.userId,
      connectedUsers: io.sockets.sockets.size
    })

    socket.on('disconnect', (reason: string) => {
      const disconnectMsg = `Socket client ${socket.id} disconnected - ${reason}`
      console.log(disconnectMsg)
      socket.broadcast.emit('CLIENT_DISCONNECTED', {
        socketId: socket.id,
        userId: socket.data.userId,
        connectedUsers: io.sockets.sockets.size,
        reason
      })
    })

    // @ts-expect-error
    socket.on('EVENT_CHAT_MESSAGE', async ({ toUserId, message }) => {
      const toUserSockets = Array.from(io.sockets.sockets.values())
        .filter(s => s.data.userId === toUserId)

      const messageData = {
        id: ulid(),
        fromUserId: socket.data.userId,
        toUserId,
        message
      }

      toUserSockets.forEach(toUserSocket => {
        // @ts-expect-error
        toUserSocket.emit('EVENT_CHAT_MESSAGE', messageData)
      })

      emitAdminDebugEvent(io, 'EVENT_CHAT_MESSAGE', messageData)
      insertMessageIntoDatabase(messageData.id, socket.data.userId, toUserId, messageData.message)
    })
  })
}

export function emitAdminDebugEvent(io: SocketIOType, event: string, data: any): void {
  getUserFromDatabase('WEB_ADMIN')
    .then((adminUser) => {
      if (adminUser == null) return

      const adminSockets = Array.from(io.sockets.sockets.values())
        .filter(s => s.data.userId === adminUser?.id)

      adminSockets.forEach(adminSocket => {
        adminSocket.emit('DEBUG', { event, data })
      })
    })
}
