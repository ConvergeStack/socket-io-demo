import { useEffect, useState } from 'react'
import { View, StatusBar, Text, FlatList, TouchableOpacity, RefreshControl } from 'react-native'
import axios from 'axios'
import { router } from 'expo-router'

import Button from '@/components/Button'
import TextInput from '@/components/TextInput'
import { useSocketContext } from '@/context/socket'

export default function ChatUsers (): React.ReactElement {
  const [typedUrl, setTypedUrl] = useState('')
  const [typedUsername, setTypedUsername] = useState('')
  const { isSocketConnected, socketPayload, connectToServer } = useSocketContext()
  const [users, setUsers] = useState<Array<{ socketId: string, username: string }>>([])

  const handleConnectServerPressed = (): void => {
    connectToServer(typedUrl, typedUsername)
  }

  const fetchUsers = (): void => {
    if (socketPayload == null) return

    axios.get(`${socketPayload.url}/active-users`)
      .then((response) => {
        setUsers(response.data.filter((user: { username: string }) => user.username !== socketPayload.username))
      })
      .catch((error) => {
        alert('Error fetching active users. ' + (error.message as string))
      })
  }

  const renderFlatListItem = ({ item }: { item: { socketId: string, username: string } }): JSX.Element => {
    return (
      <TouchableOpacity
        style={{
          backgroundColor: '#f0f0f0',
          padding: 10,
          borderRadius: 5,
          marginVertical: 5
        }}
        onPress={() => {
          router.navigate(`/chat-messages?username=${item.username}`)
        }}
      >
        <Text style={{ fontSize: 16, fontWeight: 'bold' }}>Username: {item.username}</Text>
        <Text style={{ fontSize: 14 }}>Socket ID: {item.socketId}</Text>
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
    if (isSocketConnected) {
      fetchUsers()
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

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <TextInput label='Server Address' value={typedUrl} style={{ flexGrow: 1 }} onChange={(event) => setTypedUrl(event.nativeEvent.text)} autoCapitalize='none' autoCorrect={false} />
        <TextInput label='Username' value={typedUsername} style={{ flexGrow: 1 }} onChange={(event) => setTypedUsername(event.nativeEvent.text)} autoCapitalize='none' autoCorrect={false} />
        <Button title='Connect' onPress={handleConnectServerPressed} contentContainerStyle={{ alignSelf: 'center', marginTop: 16 }} />
      </View>

      <FlatList
        data={users}
        keyExtractor={(item) => item.socketId}
        renderItem={renderFlatListItem}
        refreshControl={<RefreshControl refreshing={false} onRefresh={fetchUsers} />}
        ListEmptyComponent={renderFlatListEmptyComponent}
      />
    </View>
  )
}
