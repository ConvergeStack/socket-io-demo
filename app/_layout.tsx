import { Stack } from 'expo-router'

export default function ChatLayout (): JSX.Element {
  return (
    <Stack screenOptions={{ headerShown: true }}>
      <Stack.Screen name='index' options={{ title: 'Chat' }} />
      <Stack.Screen name='chat-messages' options={{ title: 'Chat Messages' }} />
    </Stack>
  )
}
