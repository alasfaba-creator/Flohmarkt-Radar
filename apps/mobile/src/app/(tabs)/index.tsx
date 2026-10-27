import { useMemo } from 'react';
import { ActivityIndicator, RefreshControl, SectionList, StyleSheet, Text, View } from 'react-native';
import { useFilters } from '../../lib/filters';
import type { CalendarEntry } from '../../lib/useCalendar';
import { formatDayHeading } from '../../lib/dates';
import { FilterBar } from '../../components/FilterBar';
import { EntryRow } from '../../components/EntryRow';
import { COLORS } from '../../lib/constants';

// Liste „wann – wo – was“: Startbildschirm, funktioniert ohne Login.
export default function ListScreen() {
  const { location, entries, loading, reload, selectedDay } = useFilters();

  const sections = useMemo(() => {
    const byDate = new Map<string, CalendarEntry[]>();
    for (const e of entries) byDate.set(e.date, [...(byDate.get(e.date) ?? []), e]);
    return [...byDate.entries()].map(([date, data]) => ({ title: formatDayHeading(date), data }));
  }, [entries]);

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
                ? 'An diesem Tag ist mit diesen Filtern nichts los.'
                : 'In deiner Nähe sind gerade keine Termine eingetragen. Vergrößere den Umkreis oder wähle eine andere Kategorie.'}
            </Text>
          )
        }
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  muted: { fontSize: 13, color: COLORS.muted },
  list: { paddingBottom: 24, flexGrow: 1 },
  sectionHeader: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  empty: { padding: 24, textAlign: 'center', color: COLORS.muted },
});
