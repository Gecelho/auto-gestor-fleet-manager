import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useSubscriptionGuard = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["subscription-guard", user?.id],
    queryFn: async () => {
      if (!user) {
        throw new Error("User not authenticated");
      }

      // Call the subscription guard function
      const { data, error } = await supabase.functions.invoke('subscription-guard', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (error) {
        console.error("Subscription guard error:", error);
        throw error;
      }

      return data;
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 2, // 2 minutos
    refetchInterval: 1000 * 60 * 5, // Revalida a cada 5 minutos
    retry: (failureCount, error: any) => {
      // Se é erro 403 (subscription expired), não tenta novamente
      if (error?.status === 403) {
        return false;
      }
      // Para outros erros, tenta até 3 vezes
      return failureCount < 3;
    },
  });
};