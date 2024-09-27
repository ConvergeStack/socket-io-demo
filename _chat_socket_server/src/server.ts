import express from 'express'
import { createServer } from 'node:http'
import { Server } from 'socket.io'
import { setupMiddlewares } from '@/middlewares.js'
import { setupRoutes } from '@/routes.js'
import { setupSocket } from '@/socket.js'

const SERVER_PORT = 3000

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
    userId: string
    connectedUsers: number
  }) => void
  CLIENT_DISCONNECTED: (data: {
    socketId: string
    userId: string
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
  userId: string
}

export type SocketIOType = Server<
ClientToServerEvents,
ServerToClientEvents,
InterServerEvents,
SocketData
>

const io = new Server<SocketIOType>(server, {
  cors: {
    origin: [`http://localhost:${SERVER_PORT}`, `http://127.0.0.1:${SERVER_PORT}`]
  }
})

setupMiddlewares(app, io)
setupRoutes(app, io)
setupSocket(io)

server.listen(SERVER_PORT, () => {
  console.log(`server running at http://localhost:${SERVER_PORT}`)
})
