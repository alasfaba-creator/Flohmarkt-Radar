import { toDbDate } from './time';
import type { CoverType, StallType } from '@flohmarkt/shared';

export const COLORS = {
  primary: '#E8590C',
  primaryLight: '#FFF4E6',
  market: '#1971C2',
  text: '#212529',
  muted: '#868E96',
  border: '#DEE2E6',
  background: '#FFFFFF',
  danger: '#E03131',
  success: '#2F9E44',
};

export const CATEGORIES = [
  'Kleidung',
  'Kinderkleidung',
  'Spielzeug & Spiele',
  'Bücher',
  'Möbel',
  'Haushalt',
  'Elektronik',
  'Antiquitäten',
  'Schallplatten & Medien',
  'Werkzeug',
  'Sport & Freizeit',
  'Schmuck',
] as const;

// Marktarten aus den Termin-Quellen (markets.features) passend zu unseren Kategorien.
export const FEATURE_CATEGORIES: Record<string, string[]> = {
  'Second Hand & Modemarkt': ['Kleidung'],
  'Second-Hand & Lifestylemarkt': ['Kleidung'],
  'Bambini, Kinder & Jugend': ['Kinderkleidung', 'Spielzeug & Spiele'],
  'Antik-Trödelmarkt': ['Antiquitäten'],
  'Antik- Sammlermarkt': ['Antiquitäten'],
  'Trödelhallen, Antikläden, Lagerverkauf': ['Antiquitäten', 'Möbel'],
};

export const RADIUS_OPTIONS_KM = [2, 5, 10, 25, 50] as const;

export const STALL_TYPE_LABELS: Record<StallType, string> = {
  classic_market: 'Stand auf einem Flohmarkt',
  garage_sale: 'Garagenflohmarkt',
  yard_sale: 'Hofflohmarkt',
};

export const COVER_LABELS: Record<CoverType, string> = {
  indoor: 'Überdacht',
  outdoor: 'Draußen',
  partial: 'Teilweise überdacht',
};

// Mitte Deutschlands, falls kein Standort verfügbar ist.
export const FALLBACK_REGION = { latitude: 51.1657, longitude: 10.4515 };

export function formatDistance(meters: number) {
  return meters < 1000 ? `${Math.round(meters)} m` : `${(meters / 1000).toFixed(1).replace('.', ',')} km`;
}

export function formatTime(time: string | null) {
  return time ? time.slice(0, 5) : null;
}

export function todayIso() {
  return toDbDate(new Date());
}
