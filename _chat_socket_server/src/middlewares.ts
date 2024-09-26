import { Application, Request, Response, NextFunction } from 'express'

export function setupMiddlewares (app: Application): void {
  app.use((req: Request, res: Response, next: NextFunction) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`)
    next()
  })
}
