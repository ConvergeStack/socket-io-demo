import { useState, useEffect } from 'react'
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context'
import { GiftedChat, IMessage } from 'react-native-gifted-chat'
import { useLocalSearchParams } from 'expo-router'

import SocketService from '@/service/socketService'

export default function ChatMessages (): React.ReactElement {
  const [messages, setMessages] = useState<IMessage[]>([])
  const localSearchParams = useLocalSearchParams()

  const onSend = (messages: IMessage[] = []): void => {
    const socketService = SocketService.getInstance()

    setMessages(previousMessages =>
      GiftedChat.append(previousMessages, messages)
    )

    messages.forEach(message => {
      socketService.emit('EVENT_CHAT_MESSAGE', {
        toUsername: localSearchParams.username,
        toUserId: localSearchParams.userId,
        message: message.text
      })
    })
  }

  useEffect(() => {
    console.log('Initializing chat message listener')

    const handleEventChatMessage = (data: any): void => {
      if (data.fromUserId !== localSearchParams.userId) {
        console.log('Chat message ignored, not related to the active chat screen.')
        return
      }

      setMessages(previousMessages =>
        GiftedChat.append(previousMessages, {
          // @ts-expect-error
          _id: data.id,
          text: data.message,
          createdAt: new Date(),
          user: {
            _id: data.toUserId,
            name: data.fromUsername
          }
        })
      )
    }

    const socketService = SocketService.getInstance()
    socketService.on('EVENT_CHAT_MESSAGE', handleEventChatMessage)

    return () => {
      console.log('Removing chat message listener')
      socketService.removeListener('EVENT_CHAT_MESSAGE', handleEventChatMessage)
    }
  }, [])

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1 }}>
        <GiftedChat
          messages={messages}
          onSend={messages => onSend(messages)}
          user={{
            _id: 1
          }}
        />
      </SafeAreaView>
    </SafeAreaProvider>
  )
}
