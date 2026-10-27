import { useEffect, useState } from 'react';
import * as Location from 'expo-location';
import { FALLBACK_REGION } from './constants';

type Coords = { latitude: number; longitude: number };

// Aktueller Standort; ohne Freigabe die Mitte Deutschlands.
export function useUserLocation() {
  const [location, setLocation] = useState<Coords | null>(null);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setDenied(true);
        setLocation(FALLBACK_REGION);
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
    })().catch(() => {
      setDenied(true);
      setLocation(FALLBACK_REGION);
    });
  }, []);

  return { location, denied };
}
