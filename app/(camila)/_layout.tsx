import { Stack } from 'expo-router';
import { GameProvider } from '../../src/context/GameContext';

export default function CamilaLayout() {
  return (
    <GameProvider>
      <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        <Stack.Screen name="home" />
        <Stack.Screen name="analyzing" />
        <Stack.Screen name="setup" />
        <Stack.Screen name="game" options={{ gestureEnabled: false }} />
        <Stack.Screen name="results" options={{ gestureEnabled: false }} />
      </Stack>
    </GameProvider>
  );
}
