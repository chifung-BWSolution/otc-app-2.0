import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';

const AuthContext = createContext();

// Helper to fetch DB role safely with timeout
const fetchDbRole = async (email) => {
  try {
    if (!email) return {};
    const dbPromise = supabase
      .from('user')
      .select('role, linked_staff_id, full_name')
      .eq('email', email)
      .maybeSingle();
    const timeoutPromise = new Promise((resolve) =>
      setTimeout(() => resolve({ data: null, error: 'timeout' }), 4000)
    );
    const { data: dbUser, error } = await Promise.race([dbPromise, timeoutPromise]);
    if (error) {
      console.warn('fetchDbRole error or timeout:', error);
      return {};
    }
    if (dbUser) {
      return {
        role: dbUser.role || null,
        linked_staff_id: dbUser.linked_staff_id || null,
        dbFullName: dbUser.full_name || null,
      };
    }
  } catch (e) {
    console.warn('Failed to fetch user role from DB:', e);
  }
  return {};
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [appPublicSettings, setAppPublicSettings] = useState({});

  // Impersonation state
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [realUser, setRealUser] = useState(null); // stores the admin's real user data

  // Auto-logout every 7 days: check login timestamp
  useEffect(() => {
    const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
    const LOGIN_TIMESTAMP_KEY = '__login_timestamp';

    const checkSessionAge = () => {
      const loginTs = localStorage.getItem(LOGIN_TIMESTAMP_KEY);
      if (loginTs) {
        const elapsed = Date.now() - parseInt(loginTs, 10);
        if (elapsed >= SESSION_MAX_AGE_MS) {
          console.info('[Auth] Session expired after 7 days, logging out.');
          localStorage.removeItem(LOGIN_TIMESTAMP_KEY);
          logout(true);
        }
      }
    };

    // Check immediately on mount
    checkSessionAge();

    // Check every hour
    const interval = setInterval(checkSessionAge, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // Track whether auth has been resolved by real logic (not safety timer)
    let authResolved = false;

    // Safety timeout - never stay loading forever (increased to 8s to allow DB queries)
    const safetyTimer = setTimeout(() => {
      if (!authResolved) {
        setIsLoadingAuth(prev => {
          if (prev) {
            console.warn('Auth loading safety timeout reached (8s), forcing complete');
            setIsAuthenticated(false);
            return false;
          }
          return prev;
        });
      }
    }, 8000);

    // If Supabase is not configured, immediately stop loading
    if (!isSupabaseConfigured) {
      setIsAuthenticated(false);
      setIsLoadingAuth(false);
      clearTimeout(safetyTimer);
      return () => {};
    }

    // Check dev bypass first (sync)
    const devAdmin = localStorage.getItem('__dev_admin_bypass');
    if (devAdmin) {
      try {
        const parsed = JSON.parse(devAdmin);
        setUser(parsed);
        setIsAuthenticated(true);
        setIsLoadingAuth(false);
        clearTimeout(safetyTimer);
        return () => {};
      } catch (e) {
        localStorage.removeItem('__dev_admin_bypass');
      }
    }

    // Use getSession for initial check, then onAuthStateChange for subsequent
    let subscription;
    const initAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.warn('getSession error:', error.message);
          setIsAuthenticated(false);
          authResolved = true;
          setIsLoadingAuth(false);
          return;
        }
        if (session?.user) {
          // Set login timestamp if not already set
          if (!localStorage.getItem('__login_timestamp')) {
            localStorage.setItem('__login_timestamp', Date.now().toString());
          }
          // Set authenticated immediately based on session, then enrich with DB info
          setUser({
            id: session.user.id,
            email: session.user.email,
            full_name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || '',
            ...session.user.user_metadata,
            role: null,
            linked_staff_id: null,
          });
          setIsAuthenticated(true);
          authResolved = true;
          setIsLoadingAuth(false);

          // Enrich with DB role in background (non-blocking)
          fetchDbRole(session.user.email).then(dbInfo => {
            if (dbInfo.role || dbInfo.linked_staff_id || dbInfo.dbFullName) {
              setUser(prev => ({
                ...prev,
                role: dbInfo.role || prev?.role || null,
                linked_staff_id: dbInfo.linked_staff_id || prev?.linked_staff_id || null,
                full_name: dbInfo.dbFullName || prev?.full_name || '',
              }));
            }
          });
        } else {
          setIsAuthenticated(false);
          authResolved = true;
        }
      } catch (e) {
        console.warn('initAuth error:', e);
        setIsAuthenticated(false);
        authResolved = true;
      }
      setIsLoadingAuth(false);
    };

    initAuth();

    // Listen for subsequent auth state changes
    try {
      const { data } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          try {
            console.debug('[Auth] onAuthStateChange event:', event);
            
            // Check dev bypass first
            const devAdmin = localStorage.getItem('__dev_admin_bypass');
            if (devAdmin) {
              try {
                const parsed = JSON.parse(devAdmin);
                setUser(parsed);
                setIsAuthenticated(true);
                authResolved = true;
                setIsLoadingAuth(false);
              } catch (e) {
                // invalid JSON in localStorage
                localStorage.removeItem('__dev_admin_bypass');
              }
              return;
            }

            if (session?.user) {
              // Set login timestamp on sign in
              if (event === 'SIGNED_IN') {
                localStorage.setItem('__login_timestamp', Date.now().toString());
              }
              // Set authenticated immediately, enrich later
              setUser({
                id: session.user.id,
                email: session.user.email,
                full_name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || '',
                ...session.user.user_metadata,
                role: null,
                linked_staff_id: null,
              });
              setIsAuthenticated(true);
              authResolved = true;
              setIsLoadingAuth(false);

              // Enrich with DB role in background
              fetchDbRole(session.user.email).then(dbInfo => {
                if (dbInfo.role || dbInfo.linked_staff_id || dbInfo.dbFullName) {
                  setUser(prev => ({
                    ...prev,
                    role: dbInfo.role || prev?.role || null,
                    linked_staff_id: dbInfo.linked_staff_id || prev?.linked_staff_id || null,
                    full_name: dbInfo.dbFullName || prev?.full_name || '',
                  }));
                }
              });
            } else {
              setUser(null);
              setIsAuthenticated(false);
              authResolved = true;
            }
            setIsLoadingAuth(false);
          } catch (err) {
            console.warn('Error in onAuthStateChange handler:', err);
            authResolved = true;
            setIsLoadingAuth(false);
          }
        }
      );
      subscription = data?.subscription;
    } catch (e) {
      console.warn('Failed to set up auth state listener:', e);
      setIsLoadingAuth(false);
    }

    return () => {
      clearTimeout(safetyTimer);
      subscription?.unsubscribe();
    };
  }, []);

  const checkAppState = async () => {
    try {
      setIsLoadingAuth(true);
      setAuthError(null);

      // If Supabase is not configured, skip auth and go to login
      if (!isSupabaseConfigured) {
        console.warn('Supabase not configured, skipping auth check');
        setIsAuthenticated(false);
        setIsLoadingAuth(false);
        return;
      }

      // Check dev bypass first
      const devAdmin = localStorage.getItem('__dev_admin_bypass');
      if (devAdmin) {
        const parsed = JSON.parse(devAdmin);
        setUser(parsed);
        setIsAuthenticated(true);
        setIsLoadingAuth(false);
        return;
      }

      // Check current session with timeout
      let session = null;
      let error = null;
      try {
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Session check timeout')), 8000)
        );
        const result = await Promise.race([sessionPromise, timeoutPromise]);
        session = result.data?.session;
        error = result.error;
      } catch (e) {
        console.warn('getSession threw:', e);
        error = e;
      }
      
      if (error) {
        console.error('Auth session check failed:', error);
        // On timeout or error, just go to login instead of showing error
        if (error.message === 'Session check timeout') {
          setIsAuthenticated(false);
          setIsLoadingAuth(false);
          return;
        }
        setAuthError({
          type: 'unknown',
          message: error.message || 'Failed to check authentication'
        });
        setIsAuthenticated(false);
        setIsLoadingAuth(false);
        return;
      }

      if (session?.user) {
        const dbInfo = await fetchDbRole(session.user.email);
        const userData = {
          id: session.user.id,
          email: session.user.email,
          full_name: dbInfo.dbFullName || session.user.user_metadata?.full_name || session.user.user_metadata?.name || '',
          ...session.user.user_metadata,
          role: dbInfo.role || null,
          linked_staff_id: dbInfo.linked_staff_id || null,
        };
        setUser(userData);
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
      
      setIsLoadingAuth(false);
    } catch (error) {
      console.error('Unexpected error:', error);
      setAuthError({
        type: 'unknown',
        message: error.message || 'An unexpected error occurred'
      });
      setIsLoadingAuth(false);
    }
  };

  const logout = async (shouldRedirect = true) => {
    localStorage.removeItem('__dev_admin_bypass');
    localStorage.removeItem('__login_timestamp');
    setUser(null);
    setIsAuthenticated(false);
    await supabase.auth.signOut();
    
    if (shouldRedirect) {
      window.location.href = '/login';
    }
  };

  const navigateToLogin = () => {
    window.location.href = '/login';
  };

  // Impersonation: switch context to another user
  const impersonate = (targetUser) => {
    if (!user) return;
    // Save real admin user
    setRealUser(user);
    setIsImpersonating(true);
    // Switch to target user's data
    setUser({
      id: targetUser.id || user.id, // keep real auth id for Supabase calls
      email: targetUser.email,
      full_name: targetUser.full_name || targetUser.email,
      role: targetUser.role || 'user',
      linked_staff_id: targetUser.linked_staff_id || null,
      _impersonated: true,
    });
    // Save to sessionStorage so it persists across page navigations (but not tabs)
    sessionStorage.setItem('__impersonating', JSON.stringify({
      realUser: user,
      targetUser: {
        id: targetUser.id,
        email: targetUser.email,
        full_name: targetUser.full_name,
        role: targetUser.role,
        linked_staff_id: targetUser.linked_staff_id,
      },
    }));
  };

  // Stop impersonation: restore real admin user
  const stopImpersonating = () => {
    if (realUser) {
      setUser(realUser);
    }
    setRealUser(null);
    setIsImpersonating(false);
    sessionStorage.removeItem('__impersonating');
  };

  // Restore impersonation on mount (if session was active)
  useEffect(() => {
    const saved = sessionStorage.getItem('__impersonating');
    if (saved) {
      try {
        const { realUser: savedReal, targetUser: savedTarget } = JSON.parse(saved);
        setRealUser(savedReal);
        setIsImpersonating(true);
        setUser({
          id: savedTarget.id || savedReal.id,
          email: savedTarget.email,
          full_name: savedTarget.full_name || savedTarget.email,
          role: savedTarget.role || 'user',
          linked_staff_id: savedTarget.linked_staff_id || null,
          _impersonated: true,
        });
      } catch (e) {
        sessionStorage.removeItem('__impersonating');
      }
    }
  }, []);

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      logout,
      navigateToLogin,
      checkAppState,
      // Impersonation
      isImpersonating,
      realUser,
      impersonate,
      stopImpersonating,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
