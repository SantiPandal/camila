import { Stack } from 'expo-router';
import { AmbiciosaProvider } from '../../src/context/AmbiciosaContext';

export default function AmbiciosaLayout() {
  return (
    <AmbiciosaProvider>
      <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="setup" />
        <Stack.Screen name="game" options={{ gestureEnabled: false }} />
        <Stack.Screen name="win" options={{ gestureEnabled: false }} />
      </Stack>
    </AmbiciosaProvider>
  );
}
