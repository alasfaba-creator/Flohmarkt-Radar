import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import MapView, { Circle, Marker } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFilters } from '../../lib/filters';
import type { CalendarEntry } from '../../lib/useCalendar';
import { FilterBar } from '../../components/FilterBar';
import { EntryRow } from '../../components/EntryRow';
import { COLORS } from '../../lib/constants';

// Karte mit denselben Filtern wie die Liste. Ohne gewählten Tag zeigt jeder Pin den nächsten Termin.
export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);
  const { location, locationDenied, radiusKm, entries, selectedDay, loading } = useFilters();
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  // Ein Pin pro Ort: Einträge sind nach Datum sortiert, also gewinnt der nächste Termin.
  const pins = useMemo(() => {
    const seen = new Map<string, CalendarEntry>();
    for (const e of entries) {
      const id = `${e.kind}-${e.id}`;
      if (!seen.has(id)) seen.set(id, e);
    }
    return [...seen.values()];
  }, [entries]);

  const selected = pins.find((p) => p.key === selectedKey) ?? null;

  useEffect(() => setSelectedKey(null), [selectedDay, radiusKm]);

  useEffect(() => {
    if (!location) return;
    const delta = (radiusKm / 111) * 2.4;
    mapRef.current?.animateToRegion({ ...location, latitudeDelta: delta, longitudeDelta: delta }, 300);
  }, [location, radiusKm]);

  if (!location) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={COLORS.primary} />
        <Text style={styles.muted}>Standort wird ermittelt …</Text>
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      <FilterBar />
      <View style={styles.flex}>
        <MapView
          ref={mapRef}
          style={styles.flex}
          initialRegion={{ ...location, latitudeDelta: 0.5, longitudeDelta: 0.5 }}
          showsUserLocation={!locationDenied}
          onPress={() => setSelectedKey(null)}
        >
          <Circle center={location} radius={radiusKm * 1000} strokeColor={COLORS.primary} fillColor="rgba(232,89,12,0.06)" />
          {pins.map((p) => (
            <Marker
              key={p.key}
              coordinate={{ latitude: p.latitude, longitude: p.longitude }}
              pinColor={p.kind === 'market' ? COLORS.market : COLORS.primary}
              onPress={(e) => {
                e.stopPropagation();
                setSelectedKey(p.key);
              }}
            />
          ))}
        </MapView>

        {!loading && pins.length === 0 && (
          <View style={[styles.card, { bottom: insets.bottom + 16 }]}>
            <Text style={styles.cardText}>Mit diesen Filtern ist hier nichts los.</Text>
          </View>
        )}

        {selected && (
          <View style={[styles.card, styles.cardFlush, { bottom: insets.bottom + 16 }]}>
            <EntryRow entry={selected} showDate />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  muted: { fontSize: 13, color: COLORS.muted },
  card: {
    position: 'absolute',
    left: 12,
    right: 12,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 16,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  cardFlush: { padding: 0, overflow: 'hidden' },
  cardText: { fontSize: 15, color: COLORS.text },
});
