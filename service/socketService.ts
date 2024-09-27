import { io, Socket } from 'socket.io-client'

export default class SocketService {
  private static instance: SocketService
  private socketClient?: Socket

  private constructor () {}

  public static getInstance (): SocketService {
    if (this.instance == null) {
      console.log('SocketService: Initializing a singleton instance for SocketService')
      this.instance = new SocketService()
    }

    return this.instance
  }

  public initialize (url: string, username: string): void {
    try {
      this.socketClient = io(url, {
        autoConnect: false,
        transports: ['websocket'],
        auth: { username }
      })
    } catch (error) {
      console.error('SocketService: Failed to initialize socket', error)
    }
  }

  public connect (): void {
    // Ensuring only one connection is made // todo this is not working, we don't receive id even though we are connected
    // However, we can see the id in the connect event handler
    if (this.socketClient?.id != null) {
      console.warn('SocketService: SocketClient is already connected with id', this.socketClient.id)
      return
    }

    try {
      this.socketClient?.connect()
    } catch (error) {
      console.error('SocketService: Failed to connect to socket', error)
    }
  }

  public disconnect (): void {
    if (this.socketClient?.connected !== true) {
      console.warn('SocketService: Unable to disconnect. SocketClient is not connected.')
      return
    }

    try {
      this.socketClient.disconnect()
      console.log('SocketService: Disconnected from socket')
    } catch (error) {
      console.error('SocketService: Failed to disconnect from socket:', error)
    }
  }

  public emit (event: string, ...args: any[]): void {
    if (this.socketClient?.connected !== true) {
      console.warn(`SocketService: Cannot emit event '${event}' - socket not connected.`)
      return
    }

    try {
      this.socketClient.emit(event, ...args)
    } catch (error) {
      console.error(`SocketService: Failed to emit event '${event}'`, error)
    }
  }

  public on (event: string, callback: (...args: any[]) => void): void {
    if (this.socketClient == null) {
      console.warn(`SocketService: Cannot listed to event '${event}' - socket client not initialized.`)
      return
    }

    try {
      console.log('SocketService: Registering listener for event', event)
      this.socketClient.on(event, callback)
    } catch (error) {
      console.error(`SocketService: Failed to register listener for event '${event}'`, error)
    }
  }

  public removeListener (event: string, callback: (...args: any[]) => void): void {
    if (this.socketClient == null) {
      console.warn(`SocketService: Cannot remove listener for event '${event}' - socket client not initialized.`)
      return
    }

    try {
      this.socketClient.removeListener(event, callback)
    } catch (error) {
      console.error(`SocketService: Failed to remove listener for event '${event}'`, error)
    }
  }

  public removeAllListeners (): void {
    if (this.socketClient == null) {
      console.warn('SocketService: Cannot remove listeners for all events - socket client not initialized.')
      return
    }

    try {
      this.socketClient.removeAllListeners()
    } catch (error) {
      console.error('SocketService: Failed to remove all listeners:', error)
    }
  }

  public setupCommonEventListeners (): void {
    const connectHandler = (): void => {
      console.log('SocketService: Socket on connect event received', this.socketClient?.id)
    }

    const disconnectHandler = (reason: string): void => {
      console.warn(`SocketService: Socket on disconnect event received. Reason: ${reason}`)
    }

    const connectErrorHandler = (error: Error): void => {
      console.warn('SocketService: Socket on connection_error event received:', error)
    }

    const reconnectAttemptHandler = (): void => {
      console.log('SocketService: Socket on reconnect_attempt event received')
    }

    this.on('connect', connectHandler)
    this.on('disconnect', disconnectHandler)
    this.on('connect_error', connectErrorHandler)
    this.on('reconnect_attempt', reconnectAttemptHandler)

    if (__DEV__) {
      this.socketClient?.onAny((event, ...args) => {
        console.debug('SocketService: INCOMING EVENT', event, args)
      })

      this.socketClient?.offAny((event, ...args) => {
        console.debug('SocketService: Removing INCOMING EVENT listener', event, args)
      })

      this.socketClient?.onAnyOutgoing((event, ...args) => {
        console.debug('SocketService: OUTGOING EVENT', event, args)
      })

      this.socketClient?.offAnyOutgoing((event, ...args) => {
        console.debug('SocketService: Removing OUTGOING EVENT listener', event, args)
      })
    }
  }
}
