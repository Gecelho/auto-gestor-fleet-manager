import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useAppState } from '@/hooks/useAppState';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  userProfile: any | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const { saveAppState, clearAppState, wasRecentlyAuthenticated } = useAppState();

  // Function to fetch or create user profile - optimized for speed
  const fetchUserProfile = async (userId: string) => {
    try {
      // Check cache first
      const cacheKey = `user_profile_${userId}`;
      const cachedProfile = sessionStorage.getItem(cacheKey);
      if (cachedProfile) {
        try {
          const parsed = JSON.parse(cachedProfile);
          if (parsed.cached_at && Date.now() - parsed.cached_at < 5 * 60 * 1000) { // 5 minutes cache
            setUserProfile(parsed.data);
            return;
          }
        } catch (e) {
          // Invalid cache, continue
        }
      }

      // Set a timeout for profile fetch to avoid blocking
      const profilePromise = supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Profile fetch timeout')), 500) // Very short timeout
      );

      const { data: existingProfile, error: fetchError } = await Promise.race([
        profilePromise, 
        timeoutPromise
      ]) as any;

      if (existingProfile) {
        setUserProfile(existingProfile);
        // Cache the profile
        sessionStorage.setItem(cacheKey, JSON.stringify({
          data: existingProfile,
          cached_at: Date.now()
        }));
        return;
      }

      // If profile doesn't exist and it's not a "no rows" error, throw the error
      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      // Profile doesn't exist, create a minimal profile to avoid blocking
      const minimalProfile = {
        id: userId,
        subscription_status: 'trial',
        subscription_plan: 'basic',
        subscription_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      };
      setUserProfile(minimalProfile);

      // Try to fetch real profile in background
      setTimeout(async () => {
        try {
          const { data: newProfile } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();
          
          if (newProfile) {
            setUserProfile(newProfile);
            sessionStorage.setItem(cacheKey, JSON.stringify({
              data: newProfile,
              cached_at: Date.now()
            }));
          }
        } catch (e) {
          console.warn('Background profile fetch failed:', e);
        }
      }, 100);

    } catch (error) {
      console.warn('Error fetching user profile:', error);
      // Set minimal profile to avoid blocking the app
      const minimalProfile = {
        id: userId,
        subscription_status: 'trial',
        subscription_plan: 'basic',
        subscription_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      };
      setUserProfile(minimalProfile);
    }
  };

  useEffect(() => {
    // Get initial session with aggressive timeout for better UX
    const getInitialSession = async () => {
      try {
        // Check if user was recently authenticated to avoid showing login screen
        if (wasRecentlyAuthenticated()) {
          // User was recently authenticated, give more time for session recovery
          console.log('User was recently authenticated, extending timeout');
        }

        // Check localStorage first for faster initial load
        const cachedSession = localStorage.getItem('supabase.auth.token');
        if (cachedSession) {
          try {
            const parsed = JSON.parse(cachedSession);
            if (parsed?.access_token && parsed?.expires_at && parsed.expires_at > Date.now() / 1000) {
              // Token is still valid, proceed with optimistic loading
              setLoading(false);
            }
          } catch (e) {
            // Invalid cached data, continue with normal flow
          }
        }

        // Set a very short timeout for the initial session check
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Session timeout')), 800) // Reduced from 2000ms to 800ms
        );
        
        const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]) as any;
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user?.id) {
          // Fetch user profile in background without blocking UI
          fetchUserProfile(session.user.id).catch(error => {
            console.warn('Profile fetch failed, continuing without profile:', error);
          });
        }
        
      } catch (error) {
        console.warn('Initial session check failed:', error);
        // If session check fails, assume no session and continue
        setSession(null);
        setUser(null);
        setUserProfile(null);
      } finally {
        setLoading(false);
      }
    };

    // Set a maximum timeout for the entire auth initialization - much shorter
    const maxTimeout = setTimeout(() => {
      console.warn('Auth initialization timeout - forcing completion');
      setLoading(false);
    }, 1000); // Reduced from 2000ms to 1000ms

    getInitialSession().finally(() => {
      clearTimeout(maxTimeout);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user?.id) {
          // Save app state when user is authenticated
          saveAppState(window.location.pathname, true);
          
          // Fetch user profile in background without blocking
          fetchUserProfile(session.user.id).catch(error => {
            console.warn('Profile fetch failed on auth change, continuing without profile:', error);
          });
        } else {
          // Clear app state when signing out
          clearAppState();
          setUserProfile(null);
          
          // Clear profile cache when signing out
          const keys = Object.keys(sessionStorage);
          keys.forEach(key => {
            if (key.startsWith('user_profile_')) {
              sessionStorage.removeItem(key);
            }
          });
        }
        
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });
    if (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  };

  const signOut = async () => {
    // Executando signOut - log removido
    
    try {
      // Executar signOut do Supabase com scope global
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      if (error) {
        console.error('❌ AuthContext: Erro no signOut:', error);
        throw error;
      }
      
      // SignOut executado com sucesso - log removido
      
      // Os estados serão limpos automaticamente pelo listener onAuthStateChange
      // quando o evento SIGNED_OUT for disparado
      
    } catch (error) {
      console.error('❌ AuthContext: Erro no signOut:', error);
      // Em caso de erro, limpar estados manualmente
      setUser(null);
      setSession(null);
      setUserProfile(null);
    } finally {
      // Limpar caches e dados locais e forçar redirecionamento
      try {
        if (typeof window !== 'undefined') {
          try { window.localStorage.clear(); } catch (e) { console.warn('⚠️ Não foi possível limpar localStorage:', e); }
          try { window.sessionStorage.clear(); } catch (e) { console.warn('⚠️ Não foi possível limpar sessionStorage:', e); }
          try {
            if ('caches' in window) {
              const keys = await caches.keys();
              await Promise.all(keys.map((k) => caches.delete(k)));
            }
          } catch (e) {
            console.warn('⚠️ Não foi possível limpar Cache Storage:', e);
          }
        }
      } finally {
        if (typeof window !== 'undefined') {
          window.location.replace('/');
        }
      }
    }
  };

  const value = {
    user,
    session,
    userProfile,
    loading,
    signInWithGoogle,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};