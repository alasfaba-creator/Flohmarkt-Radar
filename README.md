# FlohmarktRadar

Flohmärkte, Garagen- und Hofverkäufe in der Nähe finden – für Besucher, Anbieter und Veranstalter.

## Aufbau

| Ordner | Inhalt |
| --- | --- |
| `apps/mobile` | Mobil-App (React Native / Expo) für Besucher, Anbieter und Veranstalter |
| `apps/web` | Webportal (React / Vite) für Veranstalter am Desktop |
| `packages/shared` | Gemeinsame TypeScript-Typen und Supabase-Client |
| `supabase/migrations` | Datenbankschema (Supabase, PostgreSQL + PostGIS) |

## Loslegen

```bash
npm install
cp apps/mobile/.env.example apps/mobile/.env
cp apps/web/.env.example apps/web/.env

npm run mobile   # Expo-Dev-Server (App mit Expo Go auf dem Handy öffnen)
npm run web      # Webportal auf http://localhost:5173
npm run typecheck
```

## Mobil-App

Navigation mit Expo Router, Screens liegen in `apps/mobile/src/app`:

| Screen | Datei | Login |
| --- | --- | --- |
| Karte mit Umkreis- und Kategorienfilter | `index.tsx` | nein |
| Marktdetails mit Ständen | `market/[id].tsx` | nein |
| Anmelden / Registrieren (Drei-Punkt-Menü) | `login.tsx` | – |
| Stand eintragen | `stall/new.tsx` | Anbieter |
| Meine Stände (Offen/Geschlossen) | `my-stalls.tsx` | Anbieter |
| Markt vorschlagen | `suggest-market.tsx` | ja |

Die Karte läuft in Expo Go ohne eigenen API-Schlüssel. Für eine eigene Android-Version braucht `react-native-maps` später einen Google-Maps-Schlüssel.

Neue Pakete in der App immer mit `npx expo install <paket>` (im Ordner `apps/mobile`) hinzufügen.

## Datenbank

Supabase-Projekt `flohmarkt-radar` (Region Frankfurt). Die Migrationen in `supabase/migrations` sind dort bereits eingespielt.

- **Rollen:** `visitor` (nur Favoriten), `seller`, `organizer`. Die Rolle kommt beim Sign-up aus `options.data.role`; ein Profil wird automatisch angelegt.
- **Veranstalter** starten mit `organizer_status = 'pending'` und dürfen erst nach Freigabe durch einen Super-Admin Märkte anlegen.
- **Garagen-/Hofverkäufe** landen automatisch auf `pending_approval` und sind erst nach Freigabe öffentlich sichtbar.
- **`location`** wird aus `latitude`/`longitude` automatisch befüllt.
- **Umkreissuche:** `supabase.rpc('markets_nearby', { lat, lng, radius_m })` und `stalls_nearby`.
- **Speicher:** `proof-images` (privat, nur Eigentümer und Admin), `market-images` und `stall-images` (öffentlich). Dateien liegen unter `<user_id>/<dateiname>`.
- **Super-Admin** setzen (im Supabase SQL-Editor): `update profiles set is_super_admin = true where email = '...';`

Typen neu erzeugen nach Schemaänderungen: `supabase gen types typescript --project-id fclphbtzriynujtuupcr > packages/shared/src/database.types.ts`
