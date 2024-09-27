import { Application, Request, Response, NextFunction } from 'express'
import { emitAdminDebugEvent } from '@/socket'
import { SocketIOType } from '@/server'

export function setupMiddlewares (app: Application, io: SocketIOType): void {
  app.use((req: Request, res: Response, next: NextFunction) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`)

    emitAdminDebugEvent(io, 'HTTP_REQUEST_RECEIVED', {
      method: req.method,
      fullUrl: `${req.protocol}://${req.get('host')}${req.originalUrl}`,
      ip: req.ip,
      timestamp: new Date().toISOString()
    })

    next()
  })
}
