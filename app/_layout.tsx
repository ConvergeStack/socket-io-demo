import { SocketContextProvider } from '@/context/socket'
import { Stack } from 'expo-router'

export default function ChatLayout (): JSX.Element {
  return (
    <SocketContextProvider>
      <Stack
        screenOptions={{
          headerShown: true
        }}
      >
        <Stack.Screen name='index' options={{ title: 'Chat' }} />
        <Stack.Screen name='chat-messages' options={{ title: 'Chat Messages' }} />
      </Stack>
    </SocketContextProvider>
  )
}
