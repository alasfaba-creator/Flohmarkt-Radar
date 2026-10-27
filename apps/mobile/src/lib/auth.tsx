import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import type { Profile, Role } from '@flohmarkt/shared';
import { supabase } from './supabase';

type AuthState = {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (email: string, password: string, role: Role) => Promise<{ error: string | null; needsConfirmation: boolean }>;
  signOut: () => Promise<void>;
  becomeSeller: () => Promise<string | null>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (userId: string | undefined) => {
    if (!userId) {
      setProfile(null);
      return;
    }
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    setProfile((data as Profile | null) ?? null);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      await loadProfile(data.session?.user.id);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      loadProfile(newSession?.user.id);
    });
    return () => sub.subscription.unsubscribe();
  }, [loadProfile]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error ? translateAuthError(error.message) : null;
  };

  // Die Rolle landet in den Metadaten; ein Datenbank-Trigger legt daraus das Profil an.
  const signUp = async (email: string, password: string, role: Role) => {
    const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { role } } });
    if (error) return { error: translateAuthError(error.message), needsConfirmation: false };
    return { error: null, needsConfirmation: !data.session };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  // Besucher können sich selbst zum Anbieter machen, um einen Stand einzutragen.
  const becomeSeller = async () => {
    if (!session) return 'Nicht angemeldet.';
    const { error } = await supabase.from('profiles').update({ role: 'seller' }).eq('id', session.user.id);
    if (error) return error.message;
    await loadProfile(session.user.id);
    return null;
  };

  return (
    <AuthContext.Provider value={{ session, profile, loading, signIn, signUp, signOut, becomeSeller }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth muss innerhalb von AuthProvider verwendet werden.');
  return ctx;
}

function translateAuthError(message: string) {
  if (message.includes('Invalid login credentials')) return 'E-Mail oder Passwort ist falsch.';
  if (message.includes('Email not confirmed')) return 'Bitte bestätige zuerst deine E-Mail-Adresse.';
  if (message.includes('User already registered')) return 'Für diese E-Mail gibt es schon ein Konto.';
  if (message.includes('Password should be')) return 'Das Passwort muss mindestens 6 Zeichen lang sein.';
  return message;
}
