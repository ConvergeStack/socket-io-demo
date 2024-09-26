import express from 'express'
import { createServer } from 'node:http'
import { config } from '@/config.js'
import { Server } from 'socket.io'
import { setupMiddlewares } from '@/middlewares.js'
import { setupRoutes } from '@/routes.js'
import { setupSocket } from '@/socket.js'

const app = express()
const server = createServer(app)

interface ServerToClientEvents {
  // noArg: () => void;
  // basicEmit: (a: number, b: string, c: Buffer) => void;
  // withAck: (d: string, callback: (e: number) => void) => void;
  DEBUG: (data: unknown) => void
  ERROR: (data: unknown) => void
  CLIENT_CONNECTED: (data: {
    socketId: string
    username: string
    connectedUsers: number
  }) => void
  CLIENT_DISCONNECTED: (data: {
    socketId: string
    username: string
    connectedUsers: number
    reason: string
  }) => void
}

interface ClientToServerEvents {
  // hello: () => void;
}

interface InterServerEvents {
  // ping: () => void;
}

interface SocketData {
  username: string
}

export type SocketIOType = Server<
ClientToServerEvents,
ServerToClientEvents,
InterServerEvents,
SocketData
>

const io = new Server<SocketIOType>(server, {
  cors: {
    origin: [`http://localhost:${config.port}`, `http://127.0.0.1:${config.port}`]
  }
})

setupMiddlewares(app)
setupRoutes(app, io)
setupSocket(io)

server.listen(config.port, () => {
  console.log(`server running at http://localhost:${config.port}`)
})
