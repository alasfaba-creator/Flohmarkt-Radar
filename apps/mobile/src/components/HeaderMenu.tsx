import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { useAuth } from '../lib/auth';
import { COLORS } from '../lib/constants';

type Item = { label: string; onPress: () => void; muted?: boolean };

// Drei-Punkt-Menü im Header: Anmeldung, Registrierung und Konto-Funktionen.
export function HeaderMenu() {
  const [open, setOpen] = useState(false);
  const { session, profile, signOut } = useAuth();

  const go = (href: Href) => () => {
    setOpen(false);
    router.push(href);
  };

  const items: Item[] = session
    ? [
        { label: 'Stand eintragen', onPress: go('/stall/new') },
        ...(profile?.role === 'seller' || profile?.role === 'organizer'
          ? [{ label: 'Meine Stände', onPress: go('/my-stalls') }]
          : []),
        { label: 'Markt vorschlagen', onPress: go('/suggest-market') },
        ...(profile?.role === 'organizer'
          ? [{ label: 'Veranstalter-Bereich (kommt bald)', onPress: () => setOpen(false), muted: true }]
          : []),
        {
          label: 'Abmelden',
          onPress: async () => {
            setOpen(false);
            await signOut();
          },
        },
      ]
    : [
        { label: 'Anmelden', onPress: go('/login') },
        { label: 'Registrieren als Anbieter oder Veranstalter', onPress: go('/login?mode=register') },
      ];

  return (
    <>
      <Pressable onPress={() => setOpen(true)} hitSlop={12} accessibilityRole="button" accessibilityLabel="Menü öffnen">
        <Text style={styles.dots}>⋮</Text>
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <View style={styles.menu}>
            {session && <Text style={styles.account}>{session.user.email}</Text>}
            {items.map((item) => (
              <Pressable key={item.label} onPress={item.onPress} style={styles.item}>
                <Text style={[styles.itemText, item.muted && styles.mutedText]}>{item.label}</Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  dots: { fontSize: 24, paddingHorizontal: 8, color: COLORS.text },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', alignItems: 'flex-end' },
  menu: {
    marginTop: 90,
    marginRight: 12,
    backgroundColor: COLORS.background,
    borderRadius: 10,
    paddingVertical: 6,
    minWidth: 240,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  account: { paddingHorizontal: 16, paddingVertical: 8, color: COLORS.muted, fontSize: 13 },
  item: { paddingHorizontal: 16, paddingVertical: 12 },
  itemText: { fontSize: 16, color: COLORS.text },
  mutedText: { color: COLORS.muted },
});
