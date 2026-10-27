import { createFlohmarktClient } from '@flohmarkt/shared';

export const supabase = createFlohmarktClient(
  import.meta.env.VITE_SUPABASE_URL ?? '',
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? '',
);
