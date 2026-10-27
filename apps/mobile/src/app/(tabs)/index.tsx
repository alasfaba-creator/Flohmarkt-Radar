import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, SectionList, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useUserLocation } from '../../lib/useUserLocation';
import { CALENDAR_DAYS, useCalendar, type CalendarEntry } from '../../lib/useCalendar';
import { toDbDate } from '../../lib/time';
import { Chip } from '../../components/Chip';
import { FavoriteButton } from '../../components/FavoriteButton';
import { COLORS, COVER_LABELS, RADIUS_OPTIONS_KM, formatDistance, formatTime } from '../../lib/constants';

const WEEKDAYS = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
const MONTHS = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];

// Startbildschirm: wann, wo, was. Funktioniert ohne Login.
export default function CalendarScreen() {
  const { location, denied } = useUserLocation();
  const [radiusKm, setRadiusKm] = useState<number>(25);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const { entries, loading, error, reload } = useCalendar(location, radiusKm);

  const days = useMemo(() => {
    const list: Date[] = [];
    const d = new Date();
    for (let i = 0; i <= CALENDAR_DAYS; i++) {
      list.push(new Date(d.getFullYear(), d.getMonth(), d.getDate() + i));
    }
    return list;
  }, []);

  const daysWithEvents = useMemo(() => new Set(entries.map((e) => e.date)), [entries]);

  const sections = useMemo(() => {
    const filtered = selectedDay ? entries.filter((e) => e.date === selectedDay) : entries;
    const byDate = new Map<string, CalendarEntry[]>();
    for (const e of filtered) {
      byDate.set(e.date, [...(byDate.get(e.date) ?? []), e]);
    }
    return [...byDate.entries()].map(([date, data]) => ({ title: formatDayHeading(date), data }));
  }, [entries, selectedDay]);

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
      <View style={styles.top}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {RADIUS_OPTIONS_KM.map((km) => (
            <Chip key={km} label={`${km} km`} selected={radiusKm === km} onPress={() => setRadiusKm(km)} />
          ))}
        </ScrollView>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayStrip}>
          <Pressable style={[styles.day, !selectedDay && styles.daySelected]} onPress={() => setSelectedDay(null)}>
            <Text style={[styles.dayAll, !selectedDay && styles.daySelectedText]}>Alle</Text>
          </Pressable>
          {days.map((d) => {
            const iso = toDbDate(d);
            const selected = selectedDay === iso;
            const hasEvents = daysWithEvents.has(iso);
            return (
              <Pressable
                key={iso}
                style={[styles.day, selected && styles.daySelected]}
                onPress={() => setSelectedDay(selected ? null : iso)}
                accessibilityLabel={formatDayHeading(iso)}
              >
                <Text style={[styles.dayWeekday, selected && styles.daySelectedText]}>{WEEKDAYS[d.getDay()]}</Text>
                <Text style={[styles.dayNumber, selected && styles.daySelectedText, !hasEvents && styles.dayEmpty]}>{d.getDate()}</Text>
                <Text style={[styles.dayMonth, selected && styles.daySelectedText]}>{MONTHS[d.getMonth()]}</Text>
                <View style={[styles.dot, hasEvents && styles.dotActive, selected && styles.dotSelected]} />
              </Pressable>
            );
          })}
        </ScrollView>
        {denied && <Text style={styles.notice}>Ohne Standortfreigabe zeigen wir Termine rund um die Mitte Deutschlands.</Text>}
        {error && <Text style={[styles.notice, styles.error]}>{error}</Text>}
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(e) => e.key}
        stickySectionHeadersEnabled
        refreshControl={<RefreshControl refreshing={loading} onRefresh={reload} tintColor={COLORS.primary} />}
        renderSectionHeader={({ section }) => <Text style={styles.sectionHeader}>{section.title}</Text>}
        renderItem={({ item }) => <EntryRow entry={item} />}
        ListEmptyComponent={
          loading ? undefined : (
            <Text style={styles.empty}>
              {selectedDay
                ? 'An diesem Tag ist in deiner Nähe nichts los. Probier einen anderen Tag oder einen größeren Umkreis.'
                : 'In deiner Nähe sind gerade keine Termine eingetragen. Vergrößere den Umkreis.'}
            </Text>
          )
        }
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

function EntryRow({ entry }: { entry: CalendarEntry }) {
  const start = formatTime(entry.startTime);
  const end = formatTime(entry.endTime);
  const details = [
    formatDistance(entry.distanceM),
    start ? `${start}${end ? `–${end}` : ''} Uhr` : null,
    entry.covered ? COVER_LABELS[entry.covered] : null,
  ].filter(Boolean);

  return (
    <Pressable
      style={styles.row}
      onPress={() => (entry.kind === 'market' ? router.push(`/market/${entry.id}`) : router.push('/karte'))}
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

function formatDayHeading(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const today = new Date();
  const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
  const label = date.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' });
  if (iso === toDbDate(today)) return `Heute, ${label}`;
  if (iso === toDbDate(tomorrow)) return `Morgen, ${label}`;
  return label;
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  top: { backgroundColor: COLORS.background, borderBottomWidth: 1, borderBottomColor: COLORS.border, paddingTop: 8 },
  chips: { paddingHorizontal: 12 },
  dayStrip: { paddingHorizontal: 8, paddingBottom: 8 },
  day: { width: 52, alignItems: 'center', paddingVertical: 6, marginHorizontal: 2, borderRadius: 10 },
  daySelected: { backgroundColor: COLORS.primary },
  daySelectedText: { color: '#fff' },
  dayAll: { fontSize: 15, fontWeight: '600', color: COLORS.text, paddingVertical: 18 },
  dayWeekday: { fontSize: 12, color: COLORS.muted },
  dayNumber: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  dayEmpty: { fontWeight: '400', color: COLORS.muted },
  dayMonth: { fontSize: 11, color: COLORS.muted },
  dot: { width: 6, height: 6, borderRadius: 3, marginTop: 3, backgroundColor: 'transparent' },
  dotActive: { backgroundColor: COLORS.primary },
  dotSelected: { backgroundColor: '#fff' },
  notice: { fontSize: 12, color: COLORS.muted, paddingHorizontal: 12, paddingBottom: 8 },
  error: { color: COLORS.danger },
  list: { paddingBottom: 24, flexGrow: 1 },
  sectionHeader: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
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
  empty: { padding: 24, textAlign: 'center', color: COLORS.muted },
});
