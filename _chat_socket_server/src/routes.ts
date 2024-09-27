import { Application, Request, Response } from 'express'
import { SocketIOType } from '@/server'
import { getMessagesFromDatabase, getUserFromDatabase } from '@/database'

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

  app.get('/chat-messages', async (req: Request, res: Response) => {
    const authUser = await getUserFromDatabase(req.headers['auth-username'] as string)
    const messages = await getMessagesFromDatabase(authUser?.id as string, req.query.chatWithUserId as string, req.query.cursor as string | null, Number(req.query.limit))
    res.send(messages)
  })

  app.get('/whoami', async (req: Request, res: Response) => {
    const authUser = await getUserFromDatabase(req.headers['auth-username'] as string)
    res.send(authUser)
  })
}
