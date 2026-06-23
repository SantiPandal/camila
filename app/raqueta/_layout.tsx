import { Stack } from 'expo-router';
import { RaquetaProvider } from '../../src/context/RaquetaContext';

export default function RaquetaLayout() {
  return (
    <RaquetaProvider>
      <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="setup" />
      </Stack>
    </RaquetaProvider>
  );
}
