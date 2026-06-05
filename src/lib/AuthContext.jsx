import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [appPublicSettings, setAppPublicSettings] = useState({});

  useEffect(() => {
    checkAppState();

    // Listen for auth state changes
    let subscription;
    try {
      const { data } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          // Check dev bypass first
          const devAdmin = localStorage.getItem('__dev_admin_bypass');
          if (devAdmin) {
            try {
              const parsed = JSON.parse(devAdmin);
              setUser(parsed);
              setIsAuthenticated(true);
              setIsLoadingAuth(false);
            } catch (e) {
              // invalid JSON in localStorage
              localStorage.removeItem('__dev_admin_bypass');
            }
            return;
          }

          if (session?.user) {
            const userData = {
              id: session.user.id,
              email: session.user.email,
              full_name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || '',
              ...session.user.user_metadata,
            };
            setUser(userData);
            setIsAuthenticated(true);
          } else {
            setUser(null);
            setIsAuthenticated(false);
          }
          setIsLoadingAuth(false);
        }
      );
      subscription = data?.subscription;
    } catch (e) {
      console.warn('Failed to set up auth state listener:', e);
      setIsLoadingAuth(false);
    }

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const checkAppState = async () => {
    try {
      setIsLoadingAuth(true);
      setAuthError(null);

      // Check dev bypass first
      const devAdmin = localStorage.getItem('__dev_admin_bypass');
      if (devAdmin) {
        const parsed = JSON.parse(devAdmin);
        setUser(parsed);
        setIsAuthenticated(true);
        setIsLoadingAuth(false);
        return;
      }

      // Check current session
      let session = null;
      let error = null;
      try {
        const result = await supabase.auth.getSession();
        session = result.data?.session;
        error = result.error;
      } catch (e) {
        console.warn('getSession threw:', e);
        error = e;
      }
      
      if (error) {
        console.error('Auth session check failed:', error);
        setAuthError({
          type: 'unknown',
          message: error.message || 'Failed to check authentication'
        });
        setIsAuthenticated(false);
        setIsLoadingAuth(false);
        return;
      }

      if (session?.user) {
        const userData = {
          id: session.user.id,
          email: session.user.email,
          full_name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || '',
          ...session.user.user_metadata,
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
      checkAppState
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
