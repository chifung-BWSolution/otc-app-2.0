import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('placeholder'));

// Detect if running inside an iframe (storyboard/canvas environment)
const isInIframe = (() => {
  try { return window.self !== window.top; } catch (e) { return true; }
})();

let supabase;

try {
  if (supabaseUrl && supabaseAnonKey) {
    supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: !isInIframe,
        autoRefreshToken: !isInIframe,
        detectSessionInUrl: !isInIframe,
      },
      global: {
        fetch: (...args) => fetch(...args).catch(err => {
          // Silently handle network errors to prevent cross-origin Script error
          if (isInIframe) return new Response(JSON.stringify({ error: 'Network error' }), { status: 503 });
          console.warn('[Supabase] Network request failed:', err.message);
          return new Response(JSON.stringify({ error: 'Network error' }), { status: 503 });
        }),
      },
    });
  } else {
    console.warn('Missing Supabase environment variables: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY. Using placeholder.');
    supabase = createClient('https://placeholder.supabase.co', 'placeholder-key', {
      auth: { detectSessionInUrl: false, persistSession: false },
    });
  }
} catch (err) {
  console.error('Failed to initialize Supabase client:', err);
  // Create a minimal mock client that won't crash the app
  supabase = {
    from: () => ({
      select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: { message: 'Supabase not initialized' } }), maybeSingle: () => Promise.resolve({ data: null, error: null }), data: null, error: { message: 'Supabase not initialized' } }), is: () => ({ data: null, error: { message: 'Supabase not initialized' } }), order: () => ({ range: () => Promise.resolve({ data: [], error: null }) }), range: () => Promise.resolve({ data: [], error: null }), then: (cb) => cb({ data: [], error: null }) }),
      insert: () => ({ select: () => ({ single: () => Promise.resolve({ data: null, error: { message: 'Supabase not initialized' } }) }) }),
      update: () => ({ eq: () => ({ select: () => ({ single: () => Promise.resolve({ data: null, error: { message: 'Supabase not initialized' } }) }) }) }),
      delete: () => ({ eq: () => Promise.resolve({ error: { message: 'Supabase not initialized' } }) }),
    }),
    auth: {
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      signOut: () => Promise.resolve({}),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    },
    functions: {
      invoke: () => Promise.resolve({ data: null, error: { message: 'Supabase not initialized' } }),
    },
    channel: () => ({ on: () => ({ subscribe: () => ({}) }), subscribe: () => ({}) }),
    removeChannel: () => {},
  };
}

// Suppress cross-origin "Script error." in iframe environments (storyboards/canvas)
if (isInIframe) {
  window.addEventListener('error', (event) => {
    if (!event.filename && event.message === 'Script error.') {
      event.preventDefault();
      return true;
    }
  });
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    if (
      reason instanceof TypeError && (
        reason.message?.includes('Failed to fetch') ||
        reason.message?.includes('NetworkError') ||
        reason.message?.includes('Load failed')
      )
    ) {
      event.preventDefault();
    }
  });
}

export { supabase };
