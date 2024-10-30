import { Stack } from 'expo-router';

export default function ModalScreen() {
  return (
    <Stack.Screen
      options={{
        presentation: 'modal',
        headerShown: true,
      }}
    />
  );
} 