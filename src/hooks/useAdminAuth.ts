import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AdminAPI } from '@/lib/admin-api';

interface AdminAuthState {
  isAdmin: boolean | null;
  loading: boolean;
  error: string | null;
  verifyAdmin: () => Promise<void>;
  clearError: () => void;
}

export const useAdminAuth = (): AdminAuthState => {
  const { user, session } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const verifyAdmin = async () => {
    if (!session?.access_token || !user) {
      setIsAdmin(false);
      setError('Usuário não autenticado');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await AdminAPI.verifyAdmin();
      setIsAdmin(data.isAdmin);
      
      if (!data.isAdmin) {
        setError('Acesso negado. Esta conta não possui permissões de administrador.');
      }
    } catch (err: any) {
      console.error('Admin verification failed:', err);
      setIsAdmin(false);
      setError(err.message || 'Erro ao verificar permissões de administrador');
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  // Auto-verify when user/session changes
  useEffect(() => {
    const autoVerify = async () => {
      if (!session?.access_token || !user) {
        setIsAdmin(null);
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Add a small delay to ensure session is fully established
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Retry logic with exponential backoff
        let retries = 3;
        let delay = 1000;
        
        while (retries > 0) {
          try {
            const data = await AdminAPI.verifyAdmin();
            setIsAdmin(data.isAdmin);
            
            if (!data.isAdmin) {
              setError('Acesso negado. Esta conta não possui permissões de administrador.');
            }
            
            return;
          } catch (err: any) {
            retries--;
            
            if (retries === 0) {
              throw err;
            }
            
            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, delay));
            delay *= 2; // Exponential backoff
          }
        }
      } catch (err: any) {
        console.error('Admin verification failed:', err);
        setIsAdmin(false);
        setError(err.message || 'Erro ao verificar permissões de administrador');
      } finally {
        setLoading(false);
      }
    };

    autoVerify();
  }, [user, session?.access_token]);

  return {
    isAdmin,
    loading,
    error,
    verifyAdmin,
    clearError
  };
};