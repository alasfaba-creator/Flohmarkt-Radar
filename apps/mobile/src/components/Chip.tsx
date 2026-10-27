import { Pressable, StyleSheet, Text } from 'react-native';
import { COLORS } from '../lib/constants';

type Props = { label: string; selected?: boolean; onPress: () => void; disabled?: boolean };

export function Chip({ label, selected, onPress, disabled }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
      style={[styles.chip, selected && styles.selected, disabled && styles.disabled]}
    >
      <Text style={[styles.label, selected && styles.selectedLabel]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
    marginRight: 8,
    marginBottom: 8,
  },
  selected: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  disabled: { opacity: 0.4 },
  label: { color: COLORS.text, fontSize: 14 },
  selectedLabel: { color: '#fff', fontWeight: '600' },
});
