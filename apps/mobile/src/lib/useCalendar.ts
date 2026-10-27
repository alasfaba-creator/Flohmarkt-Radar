import { useCallback, useEffect, useState } from 'react';
import type { CoverType, NearbyMarketDate, NearbyStall, StallType } from '@flohmarkt/shared';
import { supabase } from './supabase';
import { toDbDate } from './time';
import { FEATURE_CATEGORIES } from './constants';

export type CalendarEntry = {
  key: string;
  date: string;
  kind: 'market' | 'stall';
  id: string;
  title: string;
  address: string | null;
  startTime: string | null;
  endTime: string | null;
  distanceM: number;
  covered: CoverType | null;
  latitude: number;
  longitude: number;
  stallType?: StallType;
  categories: string[];
};

type Center = { latitude: number; longitude: number };

export const CALENDAR_DAYS = 60;

// Termine von Märkten plus Garagen-/Hofflohmärkte im Umkreis, nach Datum und Entfernung sortiert.
export function useCalendar(center: Center | null, radiusKm: number) {
  const [entries, setEntries] = useState<CalendarEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!center) return;
    setLoading(true);
    setError(null);
    const from = new Date();
    const to = new Date();
    to.setDate(to.getDate() + CALENDAR_DAYS);
    const fromDate = toDbDate(from);
    const toDate = toDbDate(to);
    const geo = { lat: center.latitude, lng: center.longitude, radius_m: radiusKm * 1000 };

    const [dates, stalls] = await Promise.all([
      supabase.rpc('market_dates_nearby', { ...geo, from_date: fromDate, to_date: toDate }),
      supabase.rpc('stalls_nearby', geo),
    ]);
    setLoading(false);
    if (dates.error || stalls.error) {
      setError('Die Termine konnten nicht geladen werden. Bitte prüfe deine Internetverbindung.');
      return;
    }

    // Kategorien eines Markts ergeben sich aus seiner Marktart und den freigegebenen Ständen, die dort eingetragen sind.
    const allStalls = (stalls.data ?? []) as NearbyStall[];
    const marketCategories = new Map<string, Set<string>>();
    for (const { stall } of allStalls) {
      if (!stall.market_id) continue;
      const set = marketCategories.get(stall.market_id) ?? new Set<string>();
      for (const c of stall.categories ?? []) set.add(c);
      marketCategories.set(stall.market_id, set);
    }

    const marketEntries: CalendarEntry[] = ((dates.data ?? []) as NearbyMarketDate[]).map(({ market_date, market, distance_m }) => ({
      key: `d-${market_date.id}`,
      date: market_date.event_date,
      kind: 'market',
      id: market.id,
      title: market.name,
      address: market.address,
      startTime: market_date.start_time,
      endTime: market_date.end_time,
      distanceM: distance_m,
      covered: market.is_covered as CoverType | null,
      latitude: market.latitude,
      longitude: market.longitude,
      categories: [
        ...new Set([
          ...(marketCategories.get(market.id) ?? []),
          ...(market.features ?? []).flatMap((f) => FEATURE_CATEGORIES[f] ?? []),
        ]),
      ],
    }));

    const stallEntries: CalendarEntry[] = allStalls
      .filter(({ stall }) => !stall.market_id && stall.event_date && stall.event_date >= fromDate && stall.event_date <= toDate)
      .map(({ stall, distance_m }) => ({
        key: `s-${stall.id}`,
        date: stall.event_date!,
        kind: 'stall',
        id: stall.id,
        title: stall.stall_type === 'garage_sale' ? 'Garagenflohmarkt' : 'Hofflohmarkt',
        address: null,
        startTime: stall.planned_start,
        endTime: stall.planned_end,
        distanceM: distance_m,
        covered: null,
        stallType: stall.stall_type as StallType,
        latitude: stall.latitude,
        longitude: stall.longitude,
        categories: stall.categories ?? [],
      }));

    setEntries([...marketEntries, ...stallEntries].sort((a, b) => a.date.localeCompare(b.date) || a.distanceM - b.distanceM));
  }, [center?.latitude, center?.longitude, radiusKm]);

  useEffect(() => {
    load();
  }, [load]);

  return { entries, loading, error, reload: load };
}
