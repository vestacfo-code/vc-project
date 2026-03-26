// Supabase client wrapper that conditionally disables detectSessionInUrl for recovery mode
// This MUST be imported AFTER auth-recovery-interceptor.ts in main.tsx

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
import { isRecoveryMode } from './auth-recovery-interceptor';

const SUPABASE_URL = "https://godnomficzhjaclmvomh.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdvZG5vbWZpY3poamFjbG12b21oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3MDQwMjYsImV4cCI6MjA2NzI4MDAyNn0.zQ2F8TrhkgCtgyApwt0aIuUexXJWyFsRvU8Wx6wRdtU";

// Check if we're in recovery mode BEFORE creating the client
const inRecoveryMode = isRecoveryMode();

if (inRecoveryMode) {
  console.log('[Supabase Client Wrapper] Recovery mode detected - disabling detectSessionInUrl');
}

// Create Supabase client with conditional detectSessionInUrl
// When in recovery mode, we DISABLE automatic session detection to prevent auto-sign-in
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
    // CRITICAL: Disable auto session detection when in recovery mode
    // This prevents the automatic sign-in that skips password reset
    detectSessionInUrl: !inRecoveryMode,
  }
});
