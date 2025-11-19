import { Stack } from 'expo-router';
import { MD3LightTheme, PaperProvider } from 'react-native-paper';
import { AuthProvider } from '@/providers/AuthProvider';

const theme = MD3LightTheme;

export default function RootLayout() {
  return (
    <PaperProvider theme={theme}>
      <AuthProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)/PhoneEntry" />
          <Stack.Screen name="(auth)/OtpVerify" />
        </Stack>
      </AuthProvider>
    </PaperProvider>
  );
}
