import { createContext, MutableRefObject, useContext, useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'

interface ContextType {
  socketRef?: MutableRefObject<Socket | undefined>
  socketPayload?: SocketPayloadType
  isSocketConnected: boolean
  connectToServer: (url: string, username: string) => void
}

const defaultContextValue: ContextType = {
  socketRef: undefined,
  socketPayload: undefined,
  isSocketConnected: false,
  connectToServer: () => {}
}

const SocketContext = createContext<ContextType>(defaultContextValue)

interface SocketPayloadType {
  url: string
  username: string
}

export const SocketContextProvider = ({ children }: { children: JSX.Element }): JSX.Element => {
  const [socketPayload, setSocketPayload] = useState<SocketPayloadType>()
  const [isSocketConnected, setIsSocketConnected] = useState<boolean>(false)
  const socketRef = useRef<Socket>()

  const connectToServer = (url: string, username: string): void => {
    setSocketPayload({
      url,
      username
    })

    setTimeout(() => {
      socketRef?.current?.connect()
    }, 250)
  }

  useEffect(() => {
    if (socketPayload == null) return

    console.log('Initializing socket with payload:', socketPayload)

    socketRef.current = io(socketPayload.url, {
      transports: ['websocket'],
      auth: {
        token: 'todo',
        username: socketPayload.username
      },
      autoConnect: false
    })

    socketRef.current.on('connect', () => {
      setIsSocketConnected(true)
      console.log('Connected to server')
    })

    socketRef.current.on('connect_error', (error) => {
      setIsSocketConnected(false)
      console.log('Connection error:', error)
    })

    return () => {
      console.log('Disconnecting socket with url:', socketPayload.url)
      socketRef.current?.disconnect()
      socketRef.current?.removeListener('connect')
      socketRef.current?.removeListener('disconnect')
      socketRef.current?.removeListener('connect_error')
    }
  }, [socketPayload?.url])

  const contextValue: ContextType = {
    socketRef,
    socketPayload,
    connectToServer,
    isSocketConnected
  }

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  )
}

export const useSocketContext = (): ContextType => {
  return useContext(SocketContext)
}
