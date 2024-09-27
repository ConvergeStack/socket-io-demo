import { Application, Request, Response } from 'express'
import { getMessagesFromDatabase, getUserFromDatabase, getUsersFromDatabase } from '@/database'
import { SocketIOType } from '@/server'

export function setupRoutes (app: Application, io: SocketIOType): void {
  app.get('/', (req: Request, res: Response) => {
    res.sendFile('home.html', { root: './public' })
  })

  app.get('/whoami', async (req: Request, res: Response) => {
    const authUser = await getUserFromDatabase(req.headers['auth-username'] as string)

    res.send(authUser)
  })

  app.get('/active-users', async (req: Request, res: Response) => {
    const activeUserIds = Array.from(io.sockets.sockets)
      .map(([id, socket]) => socket.data.userId)
    const activeUsers = await getUsersFromDatabase(activeUserIds)

    res.send(activeUsers.filter(user => user.username !== 'WEB_ADMIN'))
  })

  app.get('/chat-messages', async (req: Request, res: Response) => {
    const authUser = await getUserFromDatabase(req.headers['auth-username'] as string)
    const messages = await getMessagesFromDatabase(
      authUser?.id as string,
      req.query.chatWithUserId as string,
      req.query.cursor as string | null,
      Number(req.query.limit)
    )

    res.send(messages)
  })
}
