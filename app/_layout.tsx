import { Stack } from 'expo-router';
import { useFonts, Sacramento_400Regular } from '@expo-google-fonts/sacramento';
import { Pacifico_400Regular } from '@expo-google-fonts/pacifico';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ Sacramento_400Regular, Pacifico_400Regular });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(camila)" />
        <Stack.Screen name="ambiciosa" />
        <Stack.Screen name="raqueta" />
      </Stack>
    </GestureHandlerRootView>
  );
}
