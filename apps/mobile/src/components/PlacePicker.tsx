import { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import * as Location from 'expo-location';
import { useFilters } from '../lib/filters';
import { COLORS } from '../lib/constants';

// Ort für die Suche: aktueller Standort oder eingetippte Stadt/PLZ (Geocoding über das Handy, kein API-Schlüssel nötig).
export function PlacePicker() {
  const { place, setPlace } = useFilters();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = async () => {
    const q = query.trim();
    if (!q) return;
    setBusy(true);
    setError(null);
    try {
      const results = await Location.geocodeAsync(`${q}, Deutschland`);
      if (!results[0]) {
        setError('Diesen Ort haben wir nicht gefunden. Versuch es mit Stadt oder PLZ.');
        return;
      }
      setPlace({ latitude: results[0].latitude, longitude: results[0].longitude, label: q });
      setOpen(false);
    } catch {
      setError('Die Ortssuche hat nicht geklappt. Bitte prüfe deine Internetverbindung.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Pressable style={styles.button} onPress={() => setOpen(true)} accessibilityRole="button" accessibilityLabel="Ort ändern">
        <Text style={styles.buttonText} numberOfLines={1}>
          📍 {place ? place.label : 'Mein Standort'}
        </Text>
      </Pressable>
      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <Text style={styles.title}>Wo suchst du?</Text>
            <TextInput
              style={styles.input}
              value={query}
              onChangeText={setQuery}
              placeholder="Stadt oder PLZ, z. B. Wuppertal"
              autoFocus
              returnKeyType="search"
              onSubmitEditing={search}
            />
            {error && <Text style={styles.error}>{error}</Text>}
            <Pressable style={styles.primary} onPress={search} disabled={busy}>
              {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>Suchen</Text>}
            </Pressable>
            <Pressable
              style={styles.secondary}
              onPress={() => {
                setPlace(null);
                setQuery('');
                setOpen(false);
              }}
            >
              <Text style={styles.secondaryText}>📍 Aktuellen Standort verwenden</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: COLORS.primaryLight,
    marginRight: 8,
    marginBottom: 8,
    maxWidth: 180,
  },
  buttonText: { color: COLORS.primary, fontWeight: '600', fontSize: 14 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: COLORS.background, borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 20, paddingBottom: 32 },
  title: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 12 },
  input: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, padding: 12, fontSize: 16 },
  error: { color: COLORS.danger, marginTop: 8 },
  primary: { backgroundColor: COLORS.primary, borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 12 },
  primaryText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  secondary: { padding: 14, alignItems: 'center', marginTop: 4 },
  secondaryText: { color: COLORS.primary, fontWeight: '600' },
});
