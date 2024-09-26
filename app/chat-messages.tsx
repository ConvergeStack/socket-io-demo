import { useState, useCallback, useEffect } from 'react'
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context'
import { GiftedChat, IMessage } from 'react-native-gifted-chat'
import { useSocketContext } from '@/context/socket'
import { router, useLocalSearchParams } from 'expo-router'

export default function ChatMessages (): React.ReactElement {
  const [messages, setMessages] = useState<IMessage[]>([])
  const { socketRef, socketPayload, isSocketConnected } = useSocketContext()
  const localSearchParams = useLocalSearchParams()

  const onSend = useCallback((messages = []) => {
    console.log('messages', messages)
    setMessages(previousMessages =>
      GiftedChat.append(previousMessages, messages)
    )
    console.log('Sending chat message:', router)
    socketRef?.current?.emit('EVENT_CHAT_MESSAGE', {
      toUsername: localSearchParams.username,
      toUserId: localSearchParams.userId,
      message: messages[0].text
    })
  }, [socketRef, socketPayload])

  useEffect(() => {
    if (!isSocketConnected) return

    console.log('Initializing chat message listener')
    socketRef?.current?.on('EVENT_CHAT_MESSAGE', (data) => {
      if (data.toUsername === socketPayload?.username) {
        setMessages(previousMessages =>
          GiftedChat.append(previousMessages, {
            _id: data.id,
            text: data.message,
            createdAt: new Date(),
            user: {
              _id: 2,
              name: data.fromUsername
            }
          })
        )
      }
    })

    return () => {
      console.log('Removing chat message listener')
      socketRef?.current?.removeListener('EVENT_CHAT_MESSAGE')
    }
  }, [isSocketConnected])

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
