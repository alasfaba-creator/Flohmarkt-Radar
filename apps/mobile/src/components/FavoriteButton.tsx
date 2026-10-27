import { Pressable, StyleSheet, Text } from 'react-native';
import type { FavoriteTarget } from '@flohmarkt/shared';
import { useAuth } from '../lib/auth';
import { useFavorites } from '../lib/favorites';
import { promptLogin } from '../lib/requireLogin';
import { COLORS } from '../lib/constants';

export function FavoriteButton({ type, id }: { type: FavoriteTarget; id: string }) {
  const { session } = useAuth();
  const { isFavorite, toggle } = useFavorites();
  const active = isFavorite(type, id);

  const onPress = () => {
    if (!session) {
      promptLogin('Um Märkte und Stände als Favoriten zu speichern, brauchst du ein kostenloses Konto.');
      return;
    }
    toggle(type, id);
  };

  return (
    <Pressable
      onPress={onPress}
      hitSlop={12}
      accessibilityRole="button"
      accessibilityLabel={active ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen'}
      style={styles.button}
    >
      <Text style={[styles.heart, active && styles.active]}>{active ? '♥' : '♡'}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { padding: 4 },
  heart: { fontSize: 26, color: COLORS.muted },
  active: { color: COLORS.danger },
});
