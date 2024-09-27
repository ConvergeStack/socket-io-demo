import { useState, useEffect } from 'react'
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context'
import { GiftedChat, IMessage } from 'react-native-gifted-chat'
import { useLocalSearchParams } from 'expo-router'
import apiClient from '@/service/apiClient'

import SocketService from '@/service/socketService'

export default function ChatMessages (): React.ReactElement {
  const [messages, setMessages] = useState<IMessage[]>([])
  const localSearchParams = useLocalSearchParams()
  const [authUser, setAuthUser] = useState<any>()

  const onSend = (messages: IMessage[] = []): void => {
    const socketService = SocketService.getInstance()

    setMessages(previousMessages =>
      GiftedChat.append(previousMessages, messages)
    )

    messages.forEach(message => {
      socketService.emit('EVENT_CHAT_MESSAGE', {
        toUsername: localSearchParams.chatWithUsername,
        toUserId: localSearchParams.chatWithUserId,
        message: message.text
      })
    })
  }

  const fetchChatMessages = (cursor?: string): void => {
    apiClient.get(`/chat-messages`, {
      params: {
        chatWithUserId: localSearchParams.chatWithUserId,
        cursor,
        limit: 10
      }
    })
      .then((response) => {
        setMessages(previousMessages =>
          GiftedChat.append(previousMessages, response.data.map((message: any) => {
            return {
              _id: message.id,
              text: JSON.parse(message.content).text,
              createdAt: new Date(message.sentAt),
              user: localSearchParams.chatWithUserId === message.sender.id ? {
                _id: message.sender.id,
                name: message.sender.username
              } : {
                _id: message.receiver.id,
                name: message.receiver.username
              }
            }
          }))
        )
      })
      .catch((error) => {
        alert('Error fetching chat messages. ' + (error.message as string))
      })
  }

  useEffect(() => {
    console.log('Initializing chat message listener')

    const handleEventChatMessage = (data: any): void => {
      if (data.fromUserId !== localSearchParams.chatWithUserId) {
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

    apiClient.get('/whoami')
      .then((response) => {
        setAuthUser(response.data)
        fetchChatMessages()
      })

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
            _id: authUser?.id
          }}
        />
      </SafeAreaView>
    </SafeAreaProvider>
  )
}
