import { Application, Request, Response } from 'express'
import { SocketIOType } from '@/server'

export function setupRoutes (app: Application, io: SocketIOType): void {
  app.get('/', (req: Request, res: Response) => {
    res.sendFile('home.html', { root: './public' })
  })

  app.get('/active-users', (req: Request, res: Response) => {
    res.send(Array.from(io.sockets.sockets)
      .filter(([id, socket]) => socket.data.username !== 'WEB_ADMIN')
      .map(([id, socket]) => ({
        socketId: id,
        userId: socket.data.userId,
        username: socket.data.username,
      })))
  })

  app.get('/chat-messages', (req: Request, res: Response) => {
    // TODO
  })
}
