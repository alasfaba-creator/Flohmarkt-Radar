import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { supabase } from './src/lib/supabase';

// Platzhalter bis zum MarketMapScreen (Schritt 2): prüft nur die Verbindung zu Supabase.
export default function App() {
  const [status, setStatus] = useState('Verbinde mit Supabase …');

  useEffect(() => {
    supabase
      .from('markets')
      .select('id', { count: 'exact', head: true })
      .then(({ count, error }) => {
        setStatus(error ? `Fehler: ${error.message}` : `Verbunden. ${count ?? 0} Märkte in der Datenbank.`);
      });
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>FlohmarktRadar</Text>
      <Text>{status}</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
  },
});
