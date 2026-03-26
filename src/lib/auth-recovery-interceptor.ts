// This must run BEFORE Supabase client is initialized
// It checks if we're in recovery mode and sets a flag

const hash = window.location.hash;
if (hash && hash.includes('type=recovery')) {
  // Set flag IMMEDIATELY before anything else runs
  sessionStorage.setItem('passwordRecoveryMode', 'true');
  console.log('[Recovery Interceptor] Detected recovery mode, flag set');
}

export const isRecoveryMode = () => {
  return sessionStorage.getItem('passwordRecoveryMode') === 'true';
};

export const clearRecoveryMode = () => {
  sessionStorage.removeItem('passwordRecoveryMode');
};
