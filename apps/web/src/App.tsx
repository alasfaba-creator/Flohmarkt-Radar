import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';

// Platzhalter bis zum Veranstalter-Dashboard (Schritt 3): prüft nur die Verbindung zu Supabase.
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
    <main style={{ fontFamily: 'system-ui, sans-serif', padding: 32 }}>
      <h1>FlohmarktRadar – Veranstalter-Portal</h1>
      <p>{status}</p>
    </main>
  );
}
