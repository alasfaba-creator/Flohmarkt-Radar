import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../lib/auth';
import { FavoritesProvider } from '../lib/favorites';
import { COLORS } from '../lib/constants';

export default function RootLayout() {
  return (
    <AuthProvider>
      <FavoritesProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerTintColor: COLORS.primary,
            headerTitleStyle: { color: COLORS.text },
            headerBackTitle: 'Zurück',
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false, title: 'Zurück' }} />
          <Stack.Screen name="market/[id]" options={{ title: 'Markt' }} />
          <Stack.Screen name="login" options={{ title: 'Anmelden', presentation: 'modal' }} />
          <Stack.Screen name="stall/new" options={{ title: 'Stand eintragen' }} />
          <Stack.Screen name="my-stalls" options={{ title: 'Meine Stände' }} />
          <Stack.Screen name="suggest-market" options={{ title: 'Markt vorschlagen', presentation: 'modal' }} />
        </Stack>
      </FavoritesProvider>
    </AuthProvider>
  );
}
