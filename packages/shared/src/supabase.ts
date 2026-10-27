import { createClient, type SupabaseClientOptions } from '@supabase/supabase-js';
import type { Database } from './database.types';

export type FlohmarktClient = ReturnType<typeof createFlohmarktClient>;

// App und Webportal übergeben ihre eigene URL/Key und Auth-Optionen (z. B. AsyncStorage in der App).
export function createFlohmarktClient(
  url: string,
  publishableKey: string,
  options?: SupabaseClientOptions<'public'>,
) {
  if (!url || !publishableKey) {
    throw new Error('Supabase URL und Publishable Key fehlen. Siehe .env.example.');
  }
  return createClient<Database>(url, publishableKey, options);
}

export const STORAGE_BUCKETS = {
  proofImages: 'proof-images',
  marketImages: 'market-images',
  stallImages: 'stall-images',
} as const;
