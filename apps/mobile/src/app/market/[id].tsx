import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import type { CoverType, Market, Stall } from '@flohmarkt/shared';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';
import { FavoriteButton } from '../../components/FavoriteButton';
import { COLORS, COVER_LABELS, formatTime, todayIso } from '../../lib/constants';

export default function MarketDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profile } = useAuth();
  const [market, setMarket] = useState<Market | null>(null);
  const [stalls, setStalls] = useState<Stall[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      supabase.from('markets').select('*').eq('id', id).maybeSingle(),
      supabase
        .from('stalls')
        .select('*')
        .eq('market_id', id)
        .eq('approval_status', 'approved')
        .or(`event_date.is.null,event_date.gte.${todayIso()}`)
        .order('stand_number'),
    ]).then(([m, s]) => {
      setMarket((m.data as Market | null) ?? null);
      setStalls((s.data ?? []) as Stall[]);
      setLoading(false);
    });
  }, [id]);

  if (loading) return <ActivityIndicator style={styles.loader} color={COLORS.primary} />;
  if (!market) return <Text style={styles.empty}>Dieser Markt wurde nicht gefunden.</Text>;

  // Belegung, freie Plätze und Standgrößen sieht nur, wer als Anbieter angemeldet ist, und nur wenn der Veranstalter es freigibt.
  const isSeller = profile?.role === 'seller';
  const freeStalls = Math.max((market.total_stalls ?? 0) - (market.booked_stalls ?? 0), 0);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Stack.Screen options={{ title: market.name }} />
      <View style={styles.header}>
        <View style={styles.flex}>
          <Text style={styles.title}>{market.name}</Text>
          <Text style={styles.status}>{market.is_market_open ? '🟢 Offen' : '🔴 Geschlossen'}</Text>
        </View>
        <FavoriteButton type="market" id={market.id} />
      </View>

      {!!market.images?.length && (
        <ScrollView horizontal style={styles.images}>
          {market.images.map((uri) => (
            <Image key={uri} source={{ uri }} style={styles.image} />
          ))}
        </ScrollView>
      )}

      {!!market.description && <Text style={styles.text}>{market.description}</Text>}
      {market.is_covered && <Info label="Überdachung" value={COVER_LABELS[market.is_covered as CoverType]} />}
      {!!market.features?.length && <Info label="Ausstattung" value={market.features.join(', ')} />}
      {!!market.parking_info_text && <Info label="Parken" value={market.parking_info_text} />}

      {isSeller && market.show_occupancy_to_sellers && (
        <Info label="Belegung" value={`${market.booked_stalls ?? 0} von ${market.total_stalls ?? 0} Ständen`} />
      )}
      {isSeller && market.show_free_stalls_to_sellers && <Info label="Freie Plätze" value={String(freeStalls)} />}
      {isSeller && market.show_available_sizes_to_sellers && !!market.available_sizes_text && (
        <Info label="Standgrößen" value={market.available_sizes_text} />
      )}

      <Text style={styles.section}>Stände ({stalls.length})</Text>
      {stalls.length === 0 && <Text style={styles.muted}>Hier hat sich noch kein Stand eingetragen.</Text>}
      {stalls.map((stall) => {
        const start = formatTime(stall.planned_start);
        const end = formatTime(stall.planned_end);
        return (
          <View key={stall.id} style={styles.stall}>
            <View style={styles.flex}>
              <Text style={styles.stallTitle}>
                {stall.stand_number ? `Stand ${stall.stand_number}` : 'Stand'}
                {stall.is_open_by_seller ? '' : ' · 🔴 Geschlossen'}
              </Text>
              {!!stall.categories?.length && <Text style={styles.text}>{stall.categories.join(', ')}</Text>}
              {!!stall.custom_items && <Text style={styles.muted}>{stall.custom_items}</Text>}
              {start && <Text style={styles.muted}>{`${start}${end ? `–${end}` : ''} Uhr`}</Text>}
              {stall.has_coffee_and_cake && <Text style={styles.muted}>☕ Kaffee und Kuchen</Text>}
            </View>
            <FavoriteButton type="stall" id={stall.id} />
          </View>
        );
      })}
    </ScrollView>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.info}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.text}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  loader: { marginTop: 40 },
  empty: { padding: 20, color: COLORS.muted },
  container: { padding: 20, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'flex-start' },
  title: { fontSize: 22, fontWeight: '700', color: COLORS.text },
  status: { marginTop: 4, fontSize: 15 },
  images: { marginTop: 12 },
  image: { width: 220, height: 140, borderRadius: 8, marginRight: 8 },
  text: { fontSize: 15, color: COLORS.text, marginTop: 4 },
  muted: { fontSize: 13, color: COLORS.muted, marginTop: 2 },
  info: { marginTop: 12 },
  infoLabel: { fontSize: 13, fontWeight: '600', color: COLORS.muted },
  section: { fontSize: 17, fontWeight: '600', marginTop: 24, marginBottom: 8, color: COLORS.text },
  stall: { flexDirection: 'row', paddingVertical: 12, borderTopWidth: 1, borderTopColor: COLORS.border },
  stallTitle: { fontSize: 15, fontWeight: '600', color: COLORS.text },
});
