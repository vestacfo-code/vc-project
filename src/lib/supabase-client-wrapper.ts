// Supabase client wrapper that conditionally disables detectSessionInUrl for recovery mode
// This MUST be imported AFTER auth-recovery-interceptor.ts in main.tsx

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
import { isRecoveryMode } from './auth-recovery-interceptor';

const SUPABASE_URL = "https://qjgnbvrxpmspzfqlomjc.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqZ25idnJ4cG1zcHpmcWxvbWpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2Nzg1NzksImV4cCI6MjA5MDI1NDU3OX0.vxMwGVhQEAlgLx-ujWpBZ1bR9kSdB3CUSnD0y018ZN8";

// Check if we're in recovery mode BEFORE creating the client
const inRecoveryMode = isRecoveryMode();

// Also detect third-party OAuth callbacks (e.g. QuickBooks) by looking for
// realmId in the URL — a QB-specific param that Supabase never uses.
// Without this check, Supabase sees ?code=...&state=... from the QB redirect
// and treats it as its own PKCE code, fails to exchange it, and wipes the
// session — logging the user out.
const urlParams = new URLSearchParams(window.location.search);
const isThirdPartyOAuthCallback = urlParams.has('realmId');

const shouldDisableSessionDetection = inRecoveryMode || isThirdPartyOAuthCallback;

if (inRecoveryMode) {
  console.log('[Supabase Client Wrapper] Recovery mode detected - disabling detectSessionInUrl');
}
if (isThirdPartyOAuthCallback) {
  console.log('[Supabase Client Wrapper] QuickBooks callback detected - disabling detectSessionInUrl');
}

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: !shouldDisableSessionDetection,
  }
});
