import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useUserLocation } from './useUserLocation';
import { useCalendar, type CalendarEntry } from './useCalendar';

type Coords = { latitude: number; longitude: number };
export type Place = Coords & { label: string };

type FiltersState = {
  /** Mittelpunkt der Suche: eingetippter Ort oder GPS-Standort. */
  location: Coords | null;
  locationDenied: boolean;
  /** Eingetippter Ort; null = aktueller GPS-Standort. */
  place: Place | null;
  setPlace: (place: Place | null) => void;
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
  const { location: gps, denied } = useUserLocation();
  const [place, setPlace] = useState<Place | null>(null);
  const location = place ?? gps;
  const [radiusKm, setRadiusKm] = useState(25);
  const [category, setCategory] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const { entries: all, loading, error, reload } = useCalendar(location, radiusKm);

  const byCategory = useMemo(
    () => (category ? all.filter((e) => e.categories.includes(category)) : all),
    [all, category],
  );
  const eventDays = useMemo(() => [...new Set(byCategory.map((e) => e.date))], [byCategory]);
  // Fällt der gewählte Tag durch einen anderen Filter weg, wieder alle kommenden Termine zeigen.
  useEffect(() => {
    if (selectedDay && !loading && !eventDays.includes(selectedDay)) setSelectedDay(null);
  }, [eventDays, selectedDay, loading]);

  const entries = useMemo(
    () => (selectedDay ? byCategory.filter((e) => e.date === selectedDay) : byCategory),
    [byCategory, selectedDay],
  );

  const value: FiltersState = {
    location,
    locationDenied: denied && !place,
    place,
    setPlace,
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
