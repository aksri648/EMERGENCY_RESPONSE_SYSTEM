import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { registerGlobals } from '@livekit/react-native';

registerGlobals();

export default function RootLayout() {
  return (
    <>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#080810' } }}>
        <Stack.Screen name="(start)" />
        <Stack.Screen name="upload" />
        <Stack.Screen name="call" />
      </Stack>
      <StatusBar style="light" />
    </>
  );
}
