import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import type { CalendarEntry } from '../lib/useCalendar';
import { COLORS, COVER_LABELS, formatDistance, formatTime } from '../lib/constants';
import { formatShortDay } from '../lib/dates';
import { FavoriteButton } from './FavoriteButton';

export function entryTime(entry: CalendarEntry) {
  const start = formatTime(entry.startTime);
  const end = formatTime(entry.endTime);
  return start ? `${start}${end ? `–${end}` : ''} Uhr` : 'Uhrzeit unbekannt';
}

// Eine Zeile „wann – wo – was“, genutzt in der Liste und in der Karten-Vorschau.
export function EntryRow({ entry, showDate, onPress }: { entry: CalendarEntry; showDate?: boolean; onPress?: () => void }) {
  const details = [
    showDate ? formatShortDay(entry.date) : null,
    entryTime(entry),
    formatDistance(entry.distanceM),
    entry.covered ? COVER_LABELS[entry.covered] : null,
  ].filter(Boolean);

  return (
    <Pressable
      style={styles.row}
      onPress={onPress ?? (() => (entry.kind === 'market' ? router.push(`/market/${entry.id}`) : undefined))}
    >
      <View style={[styles.badge, entry.kind === 'stall' && styles.badgeStall]} />
      <View style={styles.flex}>
        <Text style={styles.title}>{entry.title}</Text>
        {!!entry.address && <Text style={styles.address}>{entry.address}</Text>}
        <Text style={styles.muted}>{details.join(' · ')}</Text>
      </View>
      <FavoriteButton type={entry.kind} id={entry.id} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.background,
    gap: 12,
  },
  badge: { width: 4, alignSelf: 'stretch', borderRadius: 2, backgroundColor: COLORS.market },
  badgeStall: { backgroundColor: COLORS.primary },
  title: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  address: { fontSize: 14, color: COLORS.text, marginTop: 2 },
  muted: { fontSize: 13, color: COLORS.muted, marginTop: 2 },
});
