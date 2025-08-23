import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface SubscriptionData {
  subscription_status: 'active' | 'expired' | 'trial' | 'suspended';
  subscription_plan: 'basic' | 'premium' | 'enterprise';
  subscription_expires_at: string | null;
  is_active: boolean;
  is_expiring_soon: boolean;
  days_until_expiry: number | null;
}

export const useSubscription = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["subscription", user?.id],
    queryFn: async (): Promise<SubscriptionData> => {
      if (!user) {
        throw new Error("User not authenticated");
      }

      // Buscar dados do usuário
      const { data: userData, error } = await supabase
        .from('users')
        .select('subscription_status, subscription_plan, subscription_expires_at')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error("Error fetching subscription:", error);
        throw error;
      }

      if (!userData) {
        throw new Error("User data not found");
      }

      // Calcular se está ativo
      const now = new Date();
      const expiryDate = userData.subscription_expires_at ? new Date(userData.subscription_expires_at) : null;
      
      const is_active = userData.subscription_status !== 'expired' && 
                       userData.subscription_status !== 'suspended' &&
                       (expiryDate ? expiryDate > now : true);

      // Calcular dias até expirar
      const days_until_expiry = expiryDate ? 
        Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 
        null;

      // Verificar se está expirando em breve (7 dias ou menos)
      const is_expiring_soon = is_active && days_until_expiry !== null && days_until_expiry <= 7 && days_until_expiry > 0;

      return {
        subscription_status: userData.subscription_status,
        subscription_plan: userData.subscription_plan,
        subscription_expires_at: userData.subscription_expires_at,
        is_active,
        is_expiring_soon,
        days_until_expiry: days_until_expiry && days_until_expiry > 0 ? days_until_expiry : null,
      };
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 2, // 2 minutos
    refetchInterval: 1000 * 60 * 5, // Revalida a cada 5 minutos
    retry: (failureCount, error: any) => {
      // Para erros de autenticação, não tenta novamente
      if (error?.code === 'PGRST301' || error?.message?.includes('not authenticated')) {
        return false;
      }
      // Para outros erros, tenta até 3 vezes
      return failureCount < 3;
    },
  });
};