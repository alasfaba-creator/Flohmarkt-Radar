import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useUserLocation } from './useUserLocation';
import { useCalendar, type CalendarEntry } from './useCalendar';

type Coords = { latitude: number; longitude: number };

type FiltersState = {
  location: Coords | null;
  locationDenied: boolean;
  radiusKm: number;
  setRadiusKm: (km: number) => void;
  category: string | null;
  setCategory: (c: string | null) => void;
  selectedDay: string | null;
  setSelectedDay: (day: string | null) => void;
  /** Tage (YYYY-MM-DD), an denen mit den aktuellen Filtern etwas stattfindet. */
  eventDays: string[];
  /** Einträge nach Umkreis, Kategorie und gewähltem Tag gefiltert. */
  entries: CalendarEntry[];
  loading: boolean;
  error: string | null;
  reload: () => void;
};

const FiltersContext = createContext<FiltersState | null>(null);

// Gemeinsame Filter für Liste und Karte: ein Tag, Umkreis oder Kategorie ändert beide Ansichten.
export function FiltersProvider({ children }: { children: ReactNode }) {
  const { location, denied } = useUserLocation();
  const [radiusKm, setRadiusKm] = useState(25);
  const [category, setCategory] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const { entries: all, loading, error, reload } = useCalendar(location, radiusKm);

  const byCategory = useMemo(
    () => (category ? all.filter((e) => e.categories.includes(category)) : all),
    [all, category],
  );
  const eventDays = useMemo(() => [...new Set(byCategory.map((e) => e.date))], [byCategory]);
  // Es ist immer ein Tag gewählt: anfangs der nächste Tag mit Flohmarkt, und wenn der gewählte Tag
  // durch einen anderen Filter wegfällt, ebenfalls der nächste verfügbare.
  useEffect(() => {
    if (loading) return;
    if (!selectedDay || !eventDays.includes(selectedDay)) setSelectedDay(eventDays[0] ?? null);
  }, [eventDays, selectedDay, loading]);

  const entries = useMemo(
    () => (selectedDay ? byCategory.filter((e) => e.date === selectedDay) : byCategory),
    [byCategory, selectedDay],
  );

  const value: FiltersState = {
    location,
    locationDenied: denied,
    radiusKm,
    setRadiusKm,
    category,
    setCategory,
    selectedDay,
    setSelectedDay,
    eventDays,
    entries,
    loading,
    error,
    reload,
  };

  return <FiltersContext.Provider value={value}>{children}</FiltersContext.Provider>;
}

export function useFilters() {
  const ctx = useContext(FiltersContext);
  if (!ctx) throw new Error('useFilters muss innerhalb von FiltersProvider verwendet werden.');
  return ctx;
}
