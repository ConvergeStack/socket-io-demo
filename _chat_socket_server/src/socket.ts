import { ulid } from 'ulid'
import { formatUptime, formatMemoryUsage, formatCpuUsage } from '@/utils'
import { SocketIOType } from '@/server'
import { createUserInDatabase, getUserFromDatabase, insertMessageIntoDatabase } from '@/database'

export function setupSocket (io: SocketIOType): void {
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
    socket.data.username = user.username
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
    socket.on('EVENT_CHAT_MESSAGE', async (data: any) => {
      const targetSockets = Array.from(io.sockets.sockets.values())
        .filter(s => s.data.username === data.toUsername)

      const messageData = {
        ...data,
        id: ulid(),
        fromUsername: socket.data.username,
        fromUserId: socket.data.userId
      }

      let receiverId: string

      if (targetSockets.length > 0) {
        receiverId = targetSockets[0].data.userId
        targetSockets.forEach(targetSocket => {
            // @ts-expect-error
            targetSocket.emit('EVENT_CHAT_MESSAGE', messageData)
            })
        } else {
            receiverId = (await getUserFromDatabase(data.toUsername))!.id
        }

      emitAdminDebugEvent(io, 'EVENT_CHAT_MESSAGE', messageData)

      insertMessageIntoDatabase(messageData.id, socket.data.userId, receiverId, messageData.message)
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
