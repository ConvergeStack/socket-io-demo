import { useState, useEffect } from 'react'
import { Text } from 'react-native'
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context'
import { GiftedChat, IMessage } from 'react-native-gifted-chat'
import { useLocalSearchParams } from 'expo-router'

import apiClient from '@/service/apiClient'
import SocketService from '@/service/socketService'

export default function ChatMessages (): React.ReactElement {
  const [messages, setMessages] = useState<IMessage[]>([])
  const { authId, authUsername, chatWithUserId, chatWithUsername } = useLocalSearchParams()

  const onSend = (messages: IMessage[] = []): void => {
    const socketService = SocketService.getInstance()

    setMessages(previousMessages =>
      GiftedChat.append(previousMessages, messages)
    )

    messages.forEach(message => {
      socketService.emit('EVENT_CHAT_MESSAGE', {
        toUserId: chatWithUserId,
        message: message.text
      })
    })
  }

  const fetchChatMessages = (cursor?: string): void => {
    apiClient.get(`/chat-messages`, {
      params: {
        chatWithUserId,
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
              user: {
                _id: message.sender.id,
                name: message.sender.username
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
    fetchChatMessages()

    const handleEventChatMessage = (data: any): void => {
      if (data.fromUserId !== chatWithUserId) {
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
            _id: chatWithUserId,
            name: chatWithUsername
          }
        })
      )
    }

    const socketService = SocketService.getInstance()
    socketService.on('EVENT_CHAT_MESSAGE', handleEventChatMessage)

    return () => {
      setMessages([])
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
            _id: authId as string,
            name: authUsername as string
          }}
        />
      </SafeAreaView>
    </SafeAreaProvider>
  )
}
