import { useEffect, useState } from 'react'
import { View, StatusBar, Text, FlatList, TouchableOpacity, RefreshControl } from 'react-native'
import { router } from 'expo-router'

import Button from '@/components/Button'
import apiClient from '@/service/apiClient'
import SocketService from '@/service/socketService'
import TextInput from '@/components/TextInput'

export default function ChatUsers(): React.ReactElement {
  const [typedUrl, setTypedUrl] = useState('http://192.168.1.15:3000')
  const [typedUsername, setTypedUsername] = useState('')
  const [activeUsers, setActiveUsers] = useState<Array<{ id: string, username: string }>>([])
  const [isSocketConnected, setIsSocketConnected] = useState(false)
  const [authUser, setAuthUser] = useState<any>()

  const handleConnectServerPressed = (): void => {
    const socketService = SocketService.getInstance()
    socketService.initialize(typedUrl, typedUsername)
    socketService.setupCommonEventListeners()

    const handleSocketConnected = (): void => {
      setIsSocketConnected(true)
      refetchActiveUsers()
    }
    socketService.on('connect', handleSocketConnected)

    const handleSocketDisconnected = (): void => {
      setIsSocketConnected(false)
    }
    socketService.on('disconnect', handleSocketDisconnected)

    socketService.connect()
  }

  const handleDisconnectServerPressed = (): void => {
    const socketService = SocketService.getInstance()
    socketService.disconnect()
    socketService.removeAllListeners()
    setIsSocketConnected(false)
    setActiveUsers([])
  }

  const refetchActiveUsers = (): void => {
    if (!isSocketConnected) {
      console.log('Socket not connected, skipping refetch users')
      return
    }

    apiClient.get(`/active-users`)
      .then((response) => {
        setActiveUsers(response.data.filter((user: { username: string }) => user.username !== typedUsername))
      })
      .catch((error) => {
        alert('Error fetching active users. ' + (error.message as string))
      })
  }

  const refetchAuthUser = (): void => {
    apiClient.get('/whoami')
      .then((response) => {
        setAuthUser(response.data)
      })
  }

  const renderFlatListItem = ({ item }: { item: { id: string, username: string } }): JSX.Element => {
    return (
      <TouchableOpacity
        style={{
          backgroundColor: '#f0f0f0',
          padding: 10,
          borderRadius: 5,
          marginVertical: 5
        }}
        onPress={() => {
          router.navigate(`/chat-messages?authId=${authUser.id}&authUsername=${authUser.username}&chatWithUserId=${item.id}&chatWithUsername=${item.username}`)
        }}
      >
        <Text style={{ fontSize: 16, fontWeight: 'bold' }}>username: {item.username}</Text>
        <Text style={{ fontSize: 14 }}>ID: {item.id}</Text>
      </TouchableOpacity>
    )
  }

  const renderFlatListEmptyComponent = (): JSX.Element => {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', height: 200 }}>
        <Text style={{ fontSize: 16, fontWeight: 'bold' }}>
          {isSocketConnected ? 'No users online. Swipe to refresh.' : 'Server disconnected'}
        </Text>
      </View>
    )
  }

  useEffect(() => {
    if (!isSocketConnected) return
    console.log('Socket is now connected, refetching active users, setting up CLIENT_CONNECTED and CLIENT_DISCONNECTED listeners')
    apiClient.defaults.baseURL = typedUrl
    apiClient.defaults.headers.common['auth-username'] = typedUsername
    refetchActiveUsers()
    refetchAuthUser()

    const clientConnectedHandler = (data: any): void => {
      console.log('New client connected', data)
      refetchActiveUsers()
    }

    const socketService = SocketService.getInstance()
    socketService.on('CLIENT_CONNECTED', clientConnectedHandler)

    const clientDisconnectedHandler = (data: any): void => {
      console.log('Client disconnected', data)
      refetchActiveUsers()
    }
    socketService.on('CLIENT_DISCONNECTED', clientDisconnectedHandler)

    return () => {
      console.log('Cleaning up CLIENT_CONNECTED and CLIENT_DISCONNECTED listeners')
      socketService.removeListener('CLIENT_CONNECTED', clientConnectedHandler)
      socketService.removeListener('CLIENT_DISCONNECTED', clientDisconnectedHandler)
    }
  }, [isSocketConnected])

  return (
    <View style={{ flex: 1, backgroundColor: '#fff', paddingHorizontal: 20, paddingVertical: (StatusBar.currentHeight ?? 10) }}>
      <View style={{ backgroundColor: '#e6f7ff', padding: 15, borderRadius: 8, marginBottom: 20 }}>
        <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 10 }}>Instructions:</Text>

        <View style={{ gap: 4 }}>
          <Text>1. Enter socket server address (e.g., http://localhost:3000). This is also the web server address with port 3000.</Text>
          <Text>2. Choose a unique username (case sensitive)</Text>
          <Text>3. Click 'Connect' to join the chat/socket server (server must be running)</Text>
          <Text>4. Active users list will appear below after connection</Text>
          <Text>5. Tap on a user to open a chat thread</Text>
          <Text>6. Please refer server events displayed in web console for more information</Text>
        </View>
      </View>

      {isSocketConnected ? (
        <Button title='Disconnect' onPress={handleDisconnectServerPressed} contentContainerStyle={{ alignSelf: 'center', marginTop: 16 }} />
      ) : (
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <TextInput label='Server Address' value={typedUrl} style={{ flexGrow: 1 }} onChange={(event) => setTypedUrl(event.nativeEvent.text)} autoCapitalize='none' autoCorrect={false} />
          <TextInput label='Username' value={typedUsername} style={{ flexGrow: 1 }} onChange={(event) => setTypedUsername(event.nativeEvent.text)} autoCapitalize='none' autoCorrect={false} />
          <Button title='Connect' onPress={handleConnectServerPressed} contentContainerStyle={{ alignSelf: 'center', marginTop: 16 }} />
        </View>
      )}

      <FlatList
        data={activeUsers}
        keyExtractor={(item) => item.id}
        renderItem={renderFlatListItem}
        refreshControl={<RefreshControl refreshing={false} onRefresh={refetchActiveUsers} />}
        ListEmptyComponent={renderFlatListEmptyComponent}
      />
    </View>
  )
}
