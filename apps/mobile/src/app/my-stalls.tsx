import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { STORAGE_BUCKETS, type ApprovalStatus, type Stall } from '@flohmarkt/shared';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { COLORS, STALL_TYPE_LABELS, formatTime } from '../lib/constants';

const STATUS_LABELS: Record<ApprovalStatus, string> = {
  pending_approval: '⏳ Wird geprüft',
  approved: '✅ Freigegeben',
  rejected: '❌ Abgelehnt',
};

export default function MyStallsScreen() {
  const { session } = useAuth();
  const [stalls, setStalls] = useState<Stall[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!session) return;
    const { data } = await supabase
      .from('stalls')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });
    setStalls((data ?? []) as Stall[]);
    setLoading(false);
  }, [session]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  // Beim Schließen wird das Beweis-Foto gelöscht (so steht es im Hinweis beim Eintragen).
  const setOpen = async (stall: Stall, open: boolean) => {
    if (!open && stall.proof_image_url) {
      await supabase.storage.from(STORAGE_BUCKETS.proofImages).remove([stall.proof_image_url]);
    }
    const { error } = await supabase
      .from('stalls')
      .update({ is_open_by_seller: open, ...(open ? {} : { proof_image_url: null }) })
      .eq('id', stall.id);
    if (error) Alert.alert('Das hat nicht geklappt', error.message);
    load();
  };

  const remove = (stall: Stall) => {
    Alert.alert('Stand löschen?', 'Der Eintrag verschwindet von der Karte.', [
      { text: 'Abbrechen', style: 'cancel' },
      {
        text: 'Löschen',
        style: 'destructive',
        onPress: async () => {
          if (stall.proof_image_url) await supabase.storage.from(STORAGE_BUCKETS.proofImages).remove([stall.proof_image_url]);
          await supabase.from('stalls').delete().eq('id', stall.id);
          load();
        },
      },
    ]);
  };

  if (!session) return <Text style={styles.empty}>Bitte melde dich an.</Text>;
  if (loading) return <ActivityIndicator style={styles.loader} color={COLORS.primary} />;

  return (
    <FlatList
      data={stalls}
      keyExtractor={(s) => s.id}
      contentContainerStyle={styles.list}
      ListEmptyComponent={
        <View>
          <Text style={styles.empty}>Du hast noch keinen Stand eingetragen.</Text>
          <Pressable style={styles.button} onPress={() => router.push('/stall/new')}>
            <Text style={styles.buttonText}>Stand eintragen</Text>
          </Pressable>
        </View>
      }
      renderItem={({ item }) => {
        const start = formatTime(item.planned_start);
        const end = formatTime(item.planned_end);
        return (
          <View style={styles.card}>
            <Text style={styles.title}>{STALL_TYPE_LABELS[item.stall_type]}</Text>
            <Text style={styles.muted}>
              {item.event_date ? new Date(item.event_date).toLocaleDateString('de-DE') : ''}
              {start ? ` · ${start}${end ? `–${end}` : ''} Uhr` : ''}
            </Text>
            <Text style={styles.status}>{STATUS_LABELS[item.approval_status]}</Text>
            <View style={styles.row}>
              <Text style={styles.text}>{item.is_open_by_seller ? '🟢 Offen' : '🔴 Geschlossen'}</Text>
              <Switch
                value={!!item.is_open_by_seller}
                onValueChange={(v) => setOpen(item, v)}
                trackColor={{ true: COLORS.success }}
              />
            </View>
            <Pressable onPress={() => remove(item)}>
              <Text style={styles.delete}>Eintrag löschen</Text>
            </Pressable>
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  loader: { marginTop: 40 },
  list: { padding: 16, backgroundColor: COLORS.background, flexGrow: 1 },
  empty: { padding: 20, color: COLORS.muted, textAlign: 'center' },
  card: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 14, marginBottom: 12 },
  title: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  muted: { fontSize: 13, color: COLORS.muted, marginTop: 2 },
  status: { fontSize: 14, marginTop: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  text: { fontSize: 15, color: COLORS.text },
  delete: { color: COLORS.danger, marginTop: 10 },
  button: { backgroundColor: COLORS.primary, borderRadius: 8, padding: 14, alignItems: 'center', marginHorizontal: 20 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
