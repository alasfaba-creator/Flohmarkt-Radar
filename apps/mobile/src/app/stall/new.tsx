import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { STORAGE_BUCKETS, type NearbyMarket, type StallType } from '@flohmarkt/shared';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';
import { uploadImage } from '../../lib/uploadImage';
import { toDbDate, toDbTime } from '../../lib/time';
import { Chip } from '../../components/Chip';
import { DateTimeField } from '../../components/DateTimeField';
import { CATEGORIES, COLORS, FALLBACK_REGION, STALL_TYPE_LABELS, formatDistance } from '../../lib/constants';

type Coords = { latitude: number; longitude: number };

// StallFormScreen: Anbieter tragen einen Stand auf einem Markt oder einen Garagen-/Hofflohmarkt ein.
export default function StallFormScreen() {
  const { session, profile, loading: authLoading, becomeSeller } = useAuth();

  if (authLoading) return <ActivityIndicator style={styles.loader} color={COLORS.primary} />;

  if (!session) {
    return (
      <Gate
        text="Um einen Stand einzutragen, brauchst du ein Anbieter-Konto."
        button="Anmelden / Registrieren"
        onPress={() => router.replace('/login?mode=register')}
      />
    );
  }

  if (profile?.role === 'visitor') {
    return (
      <Gate
        text="Dein Konto ist ein Besucher-Konto. Willst du es in ein Anbieter-Konto umwandeln, um Stände einzutragen?"
        button="Zum Anbieter werden"
        onPress={async () => {
          const err = await becomeSeller();
          if (err) Alert.alert('Das hat nicht geklappt', err);
        }}
      />
    );
  }

  return <StallForm userId={session.user.id} />;
}

function StallForm({ userId }: { userId: string }) {
  const [stallType, setStallType] = useState<StallType>('classic_market');
  const [here, setHere] = useState<Coords | null>(null);
  const [markets, setMarkets] = useState<NearbyMarket[]>([]);
  const [marketSearch, setMarketSearch] = useState('');
  const [market, setMarket] = useState<NearbyMarket | null>(null);
  const [pin, setPin] = useState<Coords | null>(null);
  const [eventDate, setEventDate] = useState<Date | null>(new Date());
  const [start, setStart] = useState<Date | null>(null);
  const [end, setEnd] = useState<Date | null>(null);
  const [standNumber, setStandNumber] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [customItems, setCustomItems] = useState('');
  const [coffee, setCoffee] = useState(false);
  const [proofUri, setProofUri] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const isPrivateSale = stallType !== 'classic_market';

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      const coords =
        status === 'granted'
          ? (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })).coords
          : FALLBACK_REGION;
      const c = { latitude: coords.latitude, longitude: coords.longitude };
      setHere(c);
      setPin(c);
      const { data } = await supabase.rpc('markets_nearby', { lat: c.latitude, lng: c.longitude, radius_m: 50000 });
      setMarkets((data ?? []) as NearbyMarket[]);
    })().catch(() => setHere(FALLBACK_REGION));
  }, []);

  const filteredMarkets = useMemo(() => {
    const q = marketSearch.trim().toLowerCase();
    return markets.filter(({ market: m }) => !q || m.name.toLowerCase().includes(q)).slice(0, 8);
  }, [markets, marketSearch]);

  const pickProof = () => {
    const opts: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.6 };
    const handle = (result: ImagePicker.ImagePickerResult) => {
      if (!result.canceled && result.assets[0]) setProofUri(result.assets[0].uri);
    };
    Alert.alert('Beweis-Foto', 'Zeig uns deinen Stand oder dein Schild an der Einfahrt.', [
      {
        text: 'Kamera',
        onPress: async () => {
          const perm = await ImagePicker.requestCameraPermissionsAsync();
          if (perm.granted) handle(await ImagePicker.launchCameraAsync(opts));
        },
      },
      { text: 'Galerie', onPress: async () => handle(await ImagePicker.launchImageLibraryAsync(opts)) },
      { text: 'Abbrechen', style: 'cancel' },
    ]);
  };

  const submit = async () => {
    const problem = validate();
    if (problem) {
      Alert.alert('Bitte prüfen', problem);
      return;
    }
    setBusy(true);
    try {
      const proofPath = isPrivateSale && proofUri ? await uploadImage(STORAGE_BUCKETS.proofImages, userId, proofUri) : null;
      const coords = isPrivateSale ? pin! : { latitude: market!.market.latitude, longitude: market!.market.longitude };
      const { error } = await supabase.from('stalls').insert({
        user_id: userId,
        stall_type: stallType,
        market_id: isPrivateSale ? null : market!.market.id,
        // Klassische Marktstände gelten für heute, Garagen-/Hofflohmärkte dürfen in der Zukunft liegen.
        event_date: toDbDate(isPrivateSale ? eventDate! : new Date()),
        proof_image_url: proofPath,
        stand_number: isPrivateSale ? null : standNumber.trim() || null,
        categories: category ? [category] : [],
        custom_items: customItems.trim() || null,
        has_coffee_and_cake: coffee,
        planned_start: start ? toDbTime(start) : null,
        planned_end: end ? toDbTime(end) : null,
        latitude: coords.latitude,
        longitude: coords.longitude,
      });
      if (error) throw error;
      Alert.alert(
        'Eingetragen!',
        isPrivateSale
          ? 'Wir prüfen dein Foto und schalten deinen Flohmarkt dann frei. Das Foto wird gelöscht, sobald du deinen Stand schließt.'
          : 'Dein Stand ist jetzt auf der Karte zu sehen.',
      );
      router.replace('/my-stalls');
    } catch (e) {
      Alert.alert('Das hat nicht geklappt', e instanceof Error ? e.message : 'Unbekannter Fehler');
    } finally {
      setBusy(false);
    }
  };

  const validate = () => {
    if (!isPrivateSale && !market) return 'Bitte wähle den Markt aus, auf dem du stehst.';
    if (isPrivateSale && !pin) return 'Bitte setze den Standort auf der Karte.';
    if (isPrivateSale && !eventDate) return 'Bitte wähle ein Datum.';
    if (isPrivateSale && !proofUri) return 'Für Garagen- und Hofflohmärkte brauchen wir ein Beweis-Foto.';
    if (start && end && toDbTime(end) <= toDbTime(start)) return 'Das Ende muss nach dem Beginn liegen.';
    return null;
  };

  if (!here) return <ActivityIndicator style={styles.loader} color={COLORS.primary} />;

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.label}>Was möchtest du eintragen?</Text>
      <View style={styles.wrap}>
        {(Object.keys(STALL_TYPE_LABELS) as StallType[]).map((t) => (
          <Chip key={t} label={STALL_TYPE_LABELS[t]} selected={stallType === t} onPress={() => setStallType(t)} />
        ))}
      </View>

      {!isPrivateSale ? (
        <>
          <Text style={styles.label}>Auf welchem Markt stehst du heute?</Text>
          {market ? (
            <View style={styles.selected}>
              <Text style={styles.selectedText}>{market.market.name}</Text>
              <Pressable onPress={() => setMarket(null)}>
                <Text style={styles.link}>Ändern</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <TextInput style={styles.input} value={marketSearch} onChangeText={setMarketSearch} placeholder="Markt suchen" />
              {filteredMarkets.map((m) => (
                <Pressable key={m.market.id} style={styles.option} onPress={() => setMarket(m)}>
                  <Text style={styles.optionText}>{m.market.name}</Text>
                  <Text style={styles.muted}>{formatDistance(m.distance_m)}</Text>
                </Pressable>
              ))}
              {filteredMarkets.length === 0 && <Text style={styles.muted}>Kein Markt im Umkreis von 50 km gefunden.</Text>}
            </>
          )}
          <Pressable onPress={() => router.push({ pathname: '/suggest-market', params: { name: marketSearch } })}>
            <Text style={[styles.link, styles.spaced]}>Markt nicht gefunden? Bitte Vorschlag schicken</Text>
          </Pressable>
          <Text style={styles.label}>Standnummer (optional)</Text>
          <TextInput style={styles.input} value={standNumber} onChangeText={setStandNumber} placeholder="z. B. B12" />
        </>
      ) : (
        <>
          <Text style={styles.label}>Wo findet dein Flohmarkt statt?</Text>
          <Text style={styles.muted}>Tippe auf die Karte, um den Pin zu verschieben.</Text>
          <MapView
            style={styles.map}
            initialRegion={{ ...here, latitudeDelta: 0.01, longitudeDelta: 0.01 }}
            onPress={(e) => setPin(e.nativeEvent.coordinate)}
          >
            {pin && <Marker coordinate={pin} pinColor={COLORS.primary} />}
          </MapView>
          <DateTimeField label="Datum" mode="date" value={eventDate} onChange={setEventDate} minimumDate={new Date()} />
        </>
      )}

      <View style={styles.row}>
        <DateTimeField label="Beginn" mode="time" value={start} onChange={setStart} placeholder="optional" />
        <View style={styles.gap} />
        <DateTimeField label="Ende" mode="time" value={end} onChange={setEnd} placeholder="optional" />
      </View>

      <Text style={styles.label}>Was verkaufst du hauptsächlich?</Text>
      <View style={styles.wrap}>
        {CATEGORIES.map((c) => (
          <Chip key={c} label={c} selected={category === c} onPress={() => setCategory(category === c ? null : c)} />
        ))}
      </View>
      <Text style={styles.premium}>Mehrere Kategorien gleichzeitig gibt es bald mit Premium.</Text>

      <Text style={styles.label}>Was gibt es sonst noch? (optional)</Text>
      <TextInput
        style={[styles.input, styles.multiline]}
        value={customItems}
        onChangeText={setCustomItems}
        placeholder="z. B. Lego, Vinyl aus den 80ern"
        multiline
      />

      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>☕ Kaffee und Kuchen</Text>
        <Switch value={coffee} onValueChange={setCoffee} trackColor={{ true: COLORS.primary }} />
      </View>

      {isPrivateSale && (
        <>
          <Text style={styles.label}>Beweis-Foto *</Text>
          <Text style={styles.muted}>
            Damit wir prüfen können, dass dein Flohmarkt echt ist. Das Foto sehen nur wir, und es wird nach dem Schließen gelöscht.
          </Text>
          {proofUri && <Image source={{ uri: proofUri }} style={styles.proof} />}
          <Pressable style={styles.secondary} onPress={pickProof}>
            <Text style={styles.secondaryText}>{proofUri ? 'Anderes Foto wählen' : 'Foto aufnehmen oder auswählen'}</Text>
          </Pressable>
        </>
      )}

      <Text style={styles.premium}>Fotos von deinem Stand für Besucher gibt es bald mit Premium.</Text>

      <Pressable style={[styles.button, busy && styles.busy]} onPress={submit} disabled={busy}>
        {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Stand eintragen</Text>}
      </Pressable>
    </ScrollView>
  );
}

function Gate({ text, button, onPress }: { text: string; button: string; onPress: () => void }) {
  return (
    <View style={styles.gate}>
      <Text style={styles.gateText}>{text}</Text>
      <Pressable style={styles.button} onPress={onPress}>
        <Text style={styles.buttonText}>{button}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  loader: { marginTop: 40 },
  container: { padding: 20, paddingBottom: 40, backgroundColor: COLORS.background },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginTop: 16, marginBottom: 6 },
  muted: { fontSize: 13, color: COLORS.muted },
  premium: { fontSize: 12, color: COLORS.muted, fontStyle: 'italic', marginTop: 4 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap' },
  row: { flexDirection: 'row' },
  gap: { width: 12 },
  input: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, padding: 12, fontSize: 16 },
  multiline: { minHeight: 70, textAlignVertical: 'top' },
  option: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  optionText: { fontSize: 15, color: COLORS.text, flex: 1 },
  selected: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderRadius: 8, backgroundColor: COLORS.primaryLight },
  selectedText: { fontSize: 16, fontWeight: '600', color: COLORS.text, flex: 1 },
  link: { color: COLORS.primary, fontWeight: '600' },
  spaced: { marginTop: 10 },
  map: { height: 200, borderRadius: 8, marginTop: 8 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 },
  switchLabel: { fontSize: 15, color: COLORS.text },
  proof: { width: '100%', height: 180, borderRadius: 8, marginTop: 8 },
  secondary: { borderWidth: 1, borderColor: COLORS.primary, borderRadius: 8, padding: 12, alignItems: 'center', marginTop: 8 },
  secondaryText: { color: COLORS.primary, fontWeight: '600' },
  button: { backgroundColor: COLORS.primary, borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 24 },
  busy: { opacity: 0.7 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  gate: { flex: 1, padding: 24, justifyContent: 'center', backgroundColor: COLORS.background },
  gateText: { fontSize: 16, color: COLORS.text, textAlign: 'center' },
});
