import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFilters } from '../lib/filters';
import { CATEGORIES, COLORS, RADIUS_OPTIONS_KM } from '../lib/constants';
import { MONTHS_SHORT, WEEKDAYS_SHORT, formatDayHeading, parseDbDate } from '../lib/dates';
import { Chip } from './Chip';
import { PlacePicker } from './PlacePicker';

// Ort, Umkreis, Kategorie-Button und Tagesleiste (nur Tage mit Flohmarkt). Ohne gewählten Tag sind alle kommenden
// Termine zu sehen, ein zweiter Tipp auf den gewählten Tag hebt die Auswahl auf. Liegt über Liste und Karte.
export function FilterBar() {
  const {
    radiusKm,
    setRadiusKm,
    category,
    setCategory,
    selectedDay,
    setSelectedDay,
    eventDays,
    locationDenied,
    error,
  } = useFilters();
  const [categoryOpen, setCategoryOpen] = useState(false);

  return (
    <View style={styles.bar}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        <PlacePicker />
        <Pressable
          style={[styles.categoryButton, category && styles.categoryActive]}
          onPress={() => setCategoryOpen(true)}
          accessibilityRole="button"
        >
          <Text style={[styles.categoryText, category && styles.categoryActiveText]}>
            {category ? `${category} ✕` : 'Kategorien ▾'}
          </Text>
        </Pressable>
        {RADIUS_OPTIONS_KM.map((km) => (
          <Chip key={km} label={`${km} km`} selected={radiusKm === km} onPress={() => setRadiusKm(km)} />
        ))}
      </ScrollView>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.days}>
        {eventDays.map((iso) => {
          const d = parseDbDate(iso);
          const selected = selectedDay === iso;
          return (
            <Pressable
              key={iso}
              style={[styles.day, selected && styles.daySelected]}
              onPress={() => setSelectedDay(selected ? null : iso)}
              accessibilityLabel={formatDayHeading(iso)}
            >
              <Text style={[styles.weekday, selected && styles.selectedText]}>{WEEKDAYS_SHORT[d.getDay()]}</Text>
              <Text style={[styles.dayNumber, selected && styles.selectedText]}>{d.getDate()}</Text>
              <Text style={[styles.month, selected && styles.selectedText]}>{MONTHS_SHORT[d.getMonth()]}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {locationDenied && <Text style={styles.notice}>Ohne Standortfreigabe zeigen wir Termine rund um die Mitte Deutschlands. Tippe auf 📍, um einen Ort einzugeben.</Text>}
      {error && <Text style={[styles.notice, styles.error]}>{error}</Text>}

      <Modal visible={categoryOpen} transparent animationType="slide" onRequestClose={() => setCategoryOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setCategoryOpen(false)}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Was suchst du?</Text>
            <ScrollView>
              <Pressable
                style={styles.option}
                onPress={() => {
                  setCategory(null);
                  setCategoryOpen(false);
                }}
              >
                <Text style={[styles.optionText, !category && styles.optionSelected]}>Alle Kategorien</Text>
              </Pressable>
              {CATEGORIES.map((c) => (
                <Pressable
                  key={c}
                  style={styles.option}
                  onPress={() => {
                    setCategory(c);
                    setCategoryOpen(false);
                  }}
                >
                  <Text style={[styles.optionText, category === c && styles.optionSelected]}>
                    {category === c ? '✓ ' : ''}
                    {c}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
            <Text style={styles.hint}>
              Kategorien richten sich nach den Ständen, die sich auf einem Markt eingetragen haben.
            </Text>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { backgroundColor: COLORS.background, borderBottomWidth: 1, borderBottomColor: COLORS.border, paddingTop: 8 },
  row: { paddingHorizontal: 12, alignItems: 'center' },
  categoryButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.primary,
    marginRight: 8,
    marginBottom: 8,
  },
  categoryActive: { backgroundColor: COLORS.primary },
  categoryText: { color: COLORS.primary, fontWeight: '600', fontSize: 14 },
  categoryActiveText: { color: '#fff' },
  days: { paddingHorizontal: 8, paddingBottom: 8 },
  day: { minWidth: 52, alignItems: 'center', justifyContent: 'center', paddingVertical: 6, marginHorizontal: 2, borderRadius: 10 },
  daySelected: { backgroundColor: COLORS.primary },
  selectedText: { color: '#fff' },
  weekday: { fontSize: 12, color: COLORS.muted },
  dayNumber: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  month: { fontSize: 11, color: COLORS.muted },
  notice: { fontSize: 12, color: COLORS.muted, paddingHorizontal: 12, paddingBottom: 8 },
  error: { color: COLORS.danger },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: COLORS.background, borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 20, maxHeight: '70%' },
  sheetTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 8 },
  option: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  optionText: { fontSize: 16, color: COLORS.text },
  optionSelected: { color: COLORS.primary, fontWeight: '700' },
  hint: { fontSize: 12, color: COLORS.muted, marginTop: 12 },
});
