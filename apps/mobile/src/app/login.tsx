import { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import type { Role } from '@flohmarkt/shared';
import { useAuth } from '../lib/auth';
import { Chip } from '../components/Chip';
import { COLORS } from '../lib/constants';

const ROLE_OPTIONS: { role: Role; label: string; hint: string }[] = [
  { role: 'visitor', label: 'Besucher', hint: 'Nur um Märkte und Stände als Favoriten zu speichern.' },
  { role: 'seller', label: 'Anbieter', hint: 'Du verkaufst auf einem Flohmarkt oder machst einen Garagen- oder Hofflohmarkt.' },
  { role: 'organizer', label: 'Veranstalter', hint: 'Du organisierst Märkte. Dein Konto wird vor der ersten Nutzung geprüft.' },
];

export default function LoginScreen() {
  const params = useLocalSearchParams<{ mode?: string }>();
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>(params.mode === 'register' ? 'register' : 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('seller');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    if (!email.includes('@') || password.length < 6) {
      setError('Bitte gib eine gültige E-Mail und ein Passwort mit mindestens 6 Zeichen ein.');
      return;
    }
    setBusy(true);
    if (mode === 'login') {
      const err = await signIn(email.trim(), password);
      setBusy(false);
      if (err) setError(err);
      else router.back();
      return;
    }
    const result = await signUp(email.trim(), password, role);
    setBusy(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    Alert.alert(
      'Fast geschafft',
      result.needsConfirmation
        ? 'Wir haben dir eine E-Mail geschickt. Bitte bestätige deine Adresse und melde dich dann an.'
        : 'Dein Konto ist angelegt.',
    );
    if (result.needsConfirmation) setMode('login');
    else router.back();
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.tabs}>
          <Chip label="Anmelden" selected={mode === 'login'} onPress={() => setMode('login')} />
          <Chip label="Registrieren" selected={mode === 'register'} onPress={() => setMode('register')} />
        </View>

        <Text style={styles.label}>E-Mail</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          placeholder="du@beispiel.de"
        />
        <Text style={styles.label}>Passwort</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete={mode === 'login' ? 'password' : 'new-password'}
          placeholder="Mindestens 6 Zeichen"
        />

        {mode === 'register' && (
          <>
            <Text style={styles.label}>Ich bin …</Text>
            <View style={styles.row}>
              {ROLE_OPTIONS.map((o) => (
                <Chip key={o.role} label={o.label} selected={role === o.role} onPress={() => setRole(o.role)} />
              ))}
            </View>
            <Text style={styles.hint}>{ROLE_OPTIONS.find((o) => o.role === role)?.hint}</Text>
          </>
        )}

        {error && <Text style={styles.error}>{error}</Text>}

        <Pressable style={[styles.button, busy && styles.buttonBusy]} onPress={submit} disabled={busy}>
          {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{mode === 'login' ? 'Anmelden' : 'Konto erstellen'}</Text>}
        </Pressable>

        <Text style={styles.hint}>Zum Stöbern auf der Karte brauchst du kein Konto.</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.background },
  container: { padding: 20 },
  tabs: { flexDirection: 'row', marginBottom: 12 },
  row: { flexDirection: 'row', flexWrap: 'wrap' },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginTop: 12, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, padding: 12, fontSize: 16 },
  hint: { color: COLORS.muted, fontSize: 13, marginTop: 8 },
  error: { color: COLORS.danger, marginTop: 12 },
  button: { backgroundColor: COLORS.primary, borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 20 },
  buttonBusy: { opacity: 0.7 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
