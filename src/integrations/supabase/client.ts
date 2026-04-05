/**
 * Browser Supabase client — single instance (same as @/lib/supabase-client-wrapper).
 * Import from here for typed Database usage; avoids multiple GoTrueClient instances.
 */
export { supabase } from '@/lib/supabase-client-wrapper';
export type { Database } from './types';
