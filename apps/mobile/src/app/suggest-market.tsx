import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { promptLogin } from '../lib/requireLogin';
import { COLORS } from '../lib/constants';

// "Markt nicht gefunden?": Vorschlag geht an den Super-Admin.
export default function SuggestMarketScreen() {
  const params = useLocalSearchParams<{ name?: string }>();
  const { session } = useAuth();
  const [name, setName] = useState(params.name ?? '');
  const [locationInfo, setLocationInfo] = useState('');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!session) {
      promptLogin('Um einen Markt vorzuschlagen, melde dich bitte an.');
      return;
    }
    if (!name.trim()) {
      Alert.alert('Name fehlt', 'Bitte gib den Namen des Markts an.');
      return;
    }
    setBusy(true);
    const { error } = await supabase.from('market_suggestions').insert({
      user_id: session.user.id,
      suggested_name: name.trim(),
      location_info: locationInfo.trim() || null,
      notes: notes.trim() || null,
    });
    setBusy(false);
    if (error) {
      Alert.alert('Das hat nicht geklappt', error.message);
      return;
    }
    Alert.alert('Danke!', 'Wir prüfen deinen Vorschlag und nehmen den Markt auf.');
    router.back();
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.intro}>Du findest deinen Markt nicht? Schick uns einen Vorschlag, wir nehmen ihn auf.</Text>
      <Text style={styles.label}>Name des Markts *</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="z. B. Hallenflohmarkt Musterstadt" />
      <Text style={styles.label}>Wo ist der Markt?</Text>
      <TextInput style={styles.input} value={locationInfo} onChangeText={setLocationInfo} placeholder="Adresse oder Ort" />
      <Text style={styles.label}>Hinweise</Text>
      <TextInput
        style={[styles.input, styles.multiline]}
        value={notes}
        onChangeText={setNotes}
        placeholder="z. B. jeden ersten Sonntag im Monat"
        multiline
      />
      <Pressable style={[styles.button, busy && styles.busy]} onPress={submit} disabled={busy}>
        <Text style={styles.buttonText}>Vorschlag schicken</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: COLORS.background, flexGrow: 1 },
  intro: { fontSize: 15, color: COLORS.text, marginBottom: 8 },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginTop: 12, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, padding: 12, fontSize: 16 },
  multiline: { minHeight: 90, textAlignVertical: 'top' },
  button: { backgroundColor: COLORS.primary, borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 20 },
  busy: { opacity: 0.7 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
