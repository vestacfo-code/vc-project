// MUST be first import - runs before Supabase client initializes
// This intercepts recovery URLs and sets a flag before Supabase processes them
import '@/lib/auth-recovery-interceptor';

import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

createRoot(document.getElementById("root")!).render(<App />);
