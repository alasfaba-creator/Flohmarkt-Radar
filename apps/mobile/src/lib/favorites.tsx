import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import type { FavoriteTarget } from '@flohmarkt/shared';
import { supabase } from './supabase';
import { useAuth } from './auth';

type FavoritesState = {
  isFavorite: (type: FavoriteTarget, id: string) => boolean;
  toggle: (type: FavoriteTarget, id: string) => Promise<void>;
};

const FavoritesContext = createContext<FavoritesState | null>(null);
const key = (type: FavoriteTarget, id: string) => `${type}:${id}`;

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const [keys, setKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!session) {
      setKeys(new Set());
      return;
    }
    supabase
      .from('favorites')
      .select('target_type, target_id')
      .then(({ data }) => {
        setKeys(new Set((data ?? []).map((f) => key(f.target_type as FavoriteTarget, f.target_id))));
      });
  }, [session]);

  const isFavorite = useCallback((type: FavoriteTarget, id: string) => keys.has(key(type, id)), [keys]);

  const toggle = useCallback(
    async (type: FavoriteTarget, id: string) => {
      if (!session) return;
      const k = key(type, id);
      const wasFavorite = keys.has(k);
      setKeys((prev) => {
        const next = new Set(prev);
        if (wasFavorite) next.delete(k);
        else next.add(k);
        return next;
      });
      const { error } = wasFavorite
        ? await supabase.from('favorites').delete().match({ user_id: session.user.id, target_type: type, target_id: id })
        : await supabase.from('favorites').insert({ user_id: session.user.id, target_type: type, target_id: id });
      if (error) {
        // Bei Fehler den alten Zustand wiederherstellen.
        setKeys((prev) => {
          const next = new Set(prev);
          if (wasFavorite) next.add(k);
          else next.delete(k);
          return next;
        });
      }
    },
    [keys, session],
  );

  return <FavoritesContext.Provider value={{ isFavorite, toggle }}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites muss innerhalb von FavoritesProvider verwendet werden.');
  return ctx;
}
