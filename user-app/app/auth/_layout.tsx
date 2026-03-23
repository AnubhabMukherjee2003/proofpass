import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="send-otp" />
      <Stack.Screen name="verify-otp" />
    </Stack>
  );
}
