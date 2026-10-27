import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import MapView, { Circle, Marker } from 'react-native-maps';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NearbyMarket, NearbyStall } from '@flohmarkt/shared';
import { useNearby } from '../../lib/useNearby';
import { useUserLocation } from '../../lib/useUserLocation';
import { Chip } from '../../components/Chip';
import { FavoriteButton } from '../../components/FavoriteButton';
import {
  CATEGORIES,
  COLORS,
  RADIUS_OPTIONS_KM,
  STALL_TYPE_LABELS,
  formatDistance,
  formatTime,
} from '../../lib/constants';

type Selection = { kind: 'market'; item: NearbyMarket } | { kind: 'stall'; item: NearbyStall } | null;

// Öffentliche Karte: funktioniert ohne Login.
export default function MarketMapScreen() {
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);
  const { location: center, denied: locationDenied } = useUserLocation();
  const [radiusKm, setRadiusKm] = useState<number>(10);
  const [category, setCategory] = useState<string | null>(null);
  const [selection, setSelection] = useState<Selection>(null);
  const { markets, stalls, loading, error } = useNearby(center, radiusKm);

  // Zoom an den Umkreis anpassen.
  useEffect(() => {
    if (!center) return;
    const delta = (radiusKm / 111) * 2.4;
    mapRef.current?.animateToRegion({ ...center, latitudeDelta: delta, longitudeDelta: delta }, 300);
  }, [center, radiusKm]);

  // Stände auf einem Markt erscheinen in der Marktansicht, auf der Karte nur Garagen- und Hofflohmärkte.
  const standaloneStalls = useMemo(
    () =>
      stalls.filter(
        ({ stall }) => !stall.market_id && (!category || (stall.categories ?? []).includes(category)),
      ),
    [stalls, category],
  );

  const visibleMarkets = useMemo(() => {
    if (!category) return markets;
    const marketIds = new Set(
      stalls.filter(({ stall }) => stall.market_id && (stall.categories ?? []).includes(category)).map(({ stall }) => stall.market_id),
    );
    return markets.filter(({ market }) => marketIds.has(market.id));
  }, [markets, stalls, category]);

  if (!center) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={COLORS.primary} />
        <Text style={styles.muted}>Standort wird ermittelt …</Text>
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      <MapView
        ref={mapRef}
        style={styles.flex}
        initialRegion={{ ...center, latitudeDelta: 0.2, longitudeDelta: 0.2 }}
        showsUserLocation={!locationDenied}
        onPress={() => setSelection(null)}
      >
        <Circle center={center} radius={radiusKm * 1000} strokeColor={COLORS.primary} fillColor="rgba(232,89,12,0.06)" />
        {visibleMarkets.map((m) => (
          <Marker
            key={`m-${m.market.id}`}
            coordinate={{ latitude: m.market.latitude, longitude: m.market.longitude }}
            pinColor={COLORS.market}
            onPress={(e) => {
              e.stopPropagation();
              setSelection({ kind: 'market', item: m });
            }}
          />
        ))}
        {standaloneStalls.map((s) => (
          <Marker
            key={`s-${s.stall.id}`}
            coordinate={{ latitude: s.stall.latitude, longitude: s.stall.longitude }}
            pinColor={COLORS.primary}
            onPress={(e) => {
              e.stopPropagation();
              setSelection({ kind: 'stall', item: s });
            }}
          />
        ))}
      </MapView>

      <View style={styles.filters}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {RADIUS_OPTIONS_KM.map((km) => (
            <Chip key={km} label={`${km} km`} selected={radiusKm === km} onPress={() => setRadiusKm(km)} />
          ))}
        </ScrollView>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <Chip label="Alle" selected={!category} onPress={() => setCategory(null)} />
          {CATEGORIES.map((c) => (
            <Chip key={c} label={c} selected={category === c} onPress={() => setCategory(category === c ? null : c)} />
          ))}
        </ScrollView>
        {locationDenied && <Text style={styles.notice}>Ohne Standortfreigabe zeigen wir die Mitte Deutschlands.</Text>}
        {error && <Text style={[styles.notice, styles.error]}>{error}</Text>}
        {loading && <ActivityIndicator color={COLORS.primary} style={styles.loader} />}
      </View>

      {!loading && !error && visibleMarkets.length === 0 && standaloneStalls.length === 0 && (
        <View style={[styles.card, { bottom: insets.bottom + 16 }]}>
          <Text style={styles.cardTitle}>Hier ist gerade nichts los</Text>
          <Text style={styles.muted}>Vergrößere den Umkreis oder wähle eine andere Kategorie.</Text>
        </View>
      )}

      {selection && (
        <View style={[styles.card, { bottom: insets.bottom + 16 }]}>
          {selection.kind === 'market' ? (
            <MarketCard item={selection.item} />
          ) : (
            <StallCard item={selection.item} />
          )}
        </View>
      )}
    </View>
  );
}

function MarketCard({ item }: { item: NearbyMarket }) {
  const { market, distance_m } = item;
  return (
    <>
      <View style={styles.cardHeader}>
        <View style={styles.flex}>
          <Text style={styles.cardTitle}>{market.name}</Text>
          <Text style={styles.muted}>
            {formatDistance(distance_m)} · {market.is_market_open ? '🟢 Offen' : '🔴 Geschlossen'}
          </Text>
        </View>
        <FavoriteButton type="market" id={market.id} />
      </View>
      <Pressable style={styles.cardButton} onPress={() => router.push(`/market/${market.id}`)}>
        <Text style={styles.cardButtonText}>Details und Stände ansehen</Text>
      </Pressable>
    </>
  );
}

function StallCard({ item }: { item: NearbyStall }) {
  const { stall, distance_m } = item;
  const start = formatTime(stall.planned_start);
  const end = formatTime(stall.planned_end);
  return (
    <>
      <View style={styles.cardHeader}>
        <View style={styles.flex}>
          <Text style={styles.cardTitle}>{STALL_TYPE_LABELS[stall.stall_type]}</Text>
          <Text style={styles.muted}>
            {formatDistance(distance_m)}
            {stall.event_date ? ` · ${new Date(stall.event_date).toLocaleDateString('de-DE')}` : ''}
            {start ? ` · ${start}${end ? `–${end}` : ''} Uhr` : ''}
            {stall.is_open_by_seller ? '' : ' · 🔴 Geschlossen'}
          </Text>
        </View>
        <FavoriteButton type="stall" id={stall.id} />
      </View>
      {!!stall.categories?.length && <Text style={styles.cardText}>{stall.categories.join(', ')}</Text>}
      {!!stall.custom_items && <Text style={styles.cardText}>{stall.custom_items}</Text>}
      {stall.has_coffee_and_cake && <Text style={styles.cardText}>☕ Kaffee und Kuchen</Text>}
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  muted: { color: COLORS.muted, fontSize: 13 },
  filters: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 12,
    paddingTop: 8,
    paddingLeft: 8,
  },
  notice: { fontSize: 12, color: COLORS.muted, paddingBottom: 8 },
  error: { color: COLORS.danger },
  loader: { paddingBottom: 8, alignSelf: 'flex-start' },
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
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  cardTitle: { fontSize: 17, fontWeight: '600', color: COLORS.text, marginBottom: 2 },
  cardText: { fontSize: 14, color: COLORS.text, marginTop: 6 },
  cardButton: { marginTop: 12, backgroundColor: COLORS.primaryLight, borderRadius: 8, padding: 10, alignItems: 'center' },
  cardButtonText: { color: COLORS.primary, fontWeight: '600' },
});
