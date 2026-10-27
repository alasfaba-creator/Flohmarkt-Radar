import { useCallback, useEffect, useState } from 'react';
import type { NearbyMarket, NearbyStall } from '@flohmarkt/shared';
import { supabase } from './supabase';
import { todayIso } from './constants';

type Center = { latitude: number; longitude: number };

// Lädt Märkte und freigegebene Stände im Umkreis über die Datenbankfunktionen markets_nearby / stalls_nearby.
export function useNearby(center: Center | null, radiusKm: number) {
  const [markets, setMarkets] = useState<NearbyMarket[]>([]);
  const [stalls, setStalls] = useState<NearbyStall[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!center) return;
    setLoading(true);
    setError(null);
    const args = { lat: center.latitude, lng: center.longitude, radius_m: radiusKm * 1000 };
    const [m, s] = await Promise.all([
      supabase.rpc('markets_nearby', args),
      supabase.rpc('stalls_nearby', args),
    ]);
    setLoading(false);
    if (m.error || s.error) {
      setError('Die Märkte konnten nicht geladen werden. Bitte prüfe deine Internetverbindung.');
      return;
    }
    const today = todayIso();
    setMarkets((m.data ?? []) as NearbyMarket[]);
    // Vergangene Garagen- und Hofflohmärkte ausblenden.
    setStalls(((s.data ?? []) as NearbyStall[]).filter(({ stall }) => !stall.event_date || stall.event_date >= today));
  }, [center?.latitude, center?.longitude, radiusKm]);

  useEffect(() => {
    load();
  }, [load]);

  return { markets, stalls, loading, error, reload: load };
}
