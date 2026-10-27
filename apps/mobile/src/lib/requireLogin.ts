import { Alert } from 'react-native';
import { router } from 'expo-router';

// Dialog für Funktionen, die ein Konto brauchen (Favoriten, Stand eintragen, Vorschläge).
export function promptLogin(reason: string) {
  Alert.alert('Anmeldung nötig', reason, [
    { text: 'Abbrechen', style: 'cancel' },
    { text: 'Anmelden / Registrieren', onPress: () => router.push('/login') },
  ]);
}
