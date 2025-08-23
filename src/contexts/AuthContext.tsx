import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

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

  // Function to fetch or create user profile
  const fetchUserProfile = async (userId: string) => {
    try {
      // First try to get existing profile
      const { data: existingProfile, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (existingProfile) {
        setUserProfile(existingProfile);
        return;
      }

      // If profile doesn't exist and it's not a "no rows" error, throw the error
      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      // Profile doesn't exist, the trigger should have created it
      // Let's wait a moment and try again
      setTimeout(async () => {
        const { data: newProfile } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single();
        
        if (newProfile) {
          setUserProfile(newProfile);
        }
      }, 1000);

    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  useEffect(() => {
    // Get initial session with timeout
    const getInitialSession = async () => {
      try {
        // Set a timeout for the initial session check
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Session timeout')), 2000)
        );
        
        const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]) as any;
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user?.id) {
          // Try to fetch user profile with timeout
          try {
            const profilePromise = fetchUserProfile(session.user.id);
            const profileTimeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Profile timeout')), 1500)
            );
            await Promise.race([profilePromise, profileTimeoutPromise]);
          } catch (profileError) {
            console.warn('Profile fetch failed, continuing without profile:', profileError);
            // Continue without profile - user can still use the app
          }
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

    // Set a maximum timeout for the entire auth initialization
    const maxTimeout = setTimeout(() => {
      console.warn('Auth initialization timeout - forcing completion');
      setLoading(false);
    }, 2000);

    getInitialSession().finally(() => {
      clearTimeout(maxTimeout);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Auth state changed - log removido para produção
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user?.id) {
          // Try to fetch user profile with timeout for auth changes too
          try {
            const profilePromise = fetchUserProfile(session.user.id);
            const profileTimeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Profile timeout on auth change')), 1500)
            );
            await Promise.race([profilePromise, profileTimeoutPromise]);
          } catch (profileError) {
            console.warn('Profile fetch failed on auth change, continuing without profile:', profileError);
            // Continue without profile - user can still use the app
          }
        } else {
          setUserProfile(null);
        }
        
        setLoading(false);
        // State updated - log removido para produção
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