import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { COLORS } from '../lib/constants';

type Props = {
  label: string;
  mode: 'date' | 'time';
  value: Date | null;
  onChange: (value: Date) => void;
  minimumDate?: Date;
  placeholder?: string;
};

// Auf Android öffnet sich ein Dialog, auf iOS klappt der Picker unter dem Feld auf.
export function DateTimeField({ label, mode, value, onChange, minimumDate, placeholder }: Props) {
  const [open, setOpen] = useState(false);

  const handleChange = (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') setOpen(false);
    if (event.type === 'set' && date) onChange(date);
  };

  const display = value
    ? mode === 'date'
      ? value.toLocaleDateString('de-DE')
      : `${String(value.getHours()).padStart(2, '0')}:${String(value.getMinutes()).padStart(2, '0')} Uhr`
    : placeholder ?? 'Auswählen';

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <Pressable style={styles.field} onPress={() => setOpen(!open)}>
        <Text style={value ? styles.value : styles.placeholder}>{display}</Text>
      </Pressable>
      {open && (
        <DateTimePicker
          value={value ?? new Date()}
          mode={mode}
          is24Hour
          locale="de-DE"
          minimumDate={minimumDate}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleChange}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1 },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginTop: 12, marginBottom: 6 },
  field: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, padding: 12 },
  value: { fontSize: 16, color: COLORS.text },
  placeholder: { fontSize: 16, color: COLORS.muted },
});
