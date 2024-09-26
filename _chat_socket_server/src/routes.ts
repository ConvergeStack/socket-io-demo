import { Application, Request, Response } from 'express'
import { emitAdminDebugEvent } from '@/socket'
import { SocketIOType } from '@/server'

export function setupRoutes (app: Application, io: SocketIOType): void {
  app.get('/', (req: Request, res: Response) => {
    res.sendFile('home.html', { root: './public' })
  })

  app.get('/active-users', (req: Request, res: Response) => {
    emitAdminDebugEvent(io, 'ACTIVE_USERS_REQUESTED', {
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
      .filter(([id, socket]) => socket.data.username !== 'WEB_ADMIN')
      .map(([id, socket]) => ({
        socketId: id,
        username: socket.data.username
      })))
  })
}
