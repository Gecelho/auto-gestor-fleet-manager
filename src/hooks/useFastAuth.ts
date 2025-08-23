import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useFastAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const checkAuth = async () => {
      try {
        // Check localStorage first for immediate feedback
        const cachedSession = localStorage.getItem('supabase.auth.token');
        if (cachedSession) {
          try {
            const parsed = JSON.parse(cachedSession);
            if (parsed?.access_token && parsed?.expires_at && parsed.expires_at > Date.now() / 1000) {
              // Token is still valid
              if (mounted) {
                setIsAuthenticated(true);
                setIsLoading(false);
              }
              return;
            }
          } catch (e) {
            // Invalid cached data, continue with API check
          }
        }

        // Quick session check with timeout
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Auth timeout')), 500)
        );

        const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]) as any;
        
        if (mounted) {
          setIsAuthenticated(!!session?.user);
          setIsLoading(false);
        }
      } catch (error) {
        console.warn('Fast auth check failed:', error);
        if (mounted) {
          setIsAuthenticated(false);
          setIsLoading(false);
        }
      }
    };

    // Force completion after 800ms regardless
    const forceTimeout = setTimeout(() => {
      if (mounted && isLoading) {
        console.warn('Fast auth forced completion');
        setIsAuthenticated(false);
        setIsLoading(false);
      }
    }, 800);

    checkAuth().finally(() => {
      clearTimeout(forceTimeout);
    });

    return () => {
      mounted = false;
      clearTimeout(forceTimeout);
    };
  }, [isLoading]);

  return { isAuthenticated, isLoading };
}