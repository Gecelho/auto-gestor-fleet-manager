import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Car, CarWithFinancials } from "@/types/database";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { secureSupabaseOperation } from "@/lib/supabase-interceptor";
import { SecurityLogger } from "@/lib/security";

export const useCars = () => {
  const { toast } = useToast();
  const { user } = useAuth();

  return useQuery({
    queryKey: ["cars", user?.id],
    queryFn: async (): Promise<CarWithFinancials[]> => {
      try {
        const { data: cars, error: carsError } = await supabase
          .from("cars")
          .select("*")
          .order("created_at", { ascending: false });

        if (carsError) throw carsError;

        const carsWithFinancials = await Promise.all(
          (cars || []).map(async (car) => {
            try {
              // Get expenses
              const { data: expenses } = await supabase
                .from("expenses")
                .select("value")
                .eq("car_id", car.id);

              // Get revenues
              const { data: revenues } = await supabase
                .from("revenues")
                .select("value")
                .eq("car_id", car.id);

              const totalExpenses = expenses?.reduce((sum, exp) => sum + Number(exp.value), 0) || 0;
              const totalRevenue = revenues?.reduce((sum, rev) => sum + Number(rev.value), 0) || 0;
              const remainingBalance = Number(car.purchase_value) - (totalRevenue - totalExpenses);

              return {
                ...car,
                totalRevenue,
                totalExpenses,
                remainingBalance,
              } as CarWithFinancials;
            } catch (error) {
              console.warn(`Error loading financials for car ${car.id}:`, error);
              // Return car without financials if there's an error
              return {
                ...car,
                totalRevenue: 0,
                totalExpenses: 0,
                remainingBalance: Number(car.purchase_value),
              } as CarWithFinancials;
            }
          })
        );

        return carsWithFinancials;
      } catch (error) {
        console.error('Error loading cars:', error);
        throw error;
      }
    },
    enabled: !!user?.id, // Only run query when user is authenticated
    retry: (failureCount, error) => {
      // Don't retry on auth errors
      if (error?.message?.includes('auth') || error?.message?.includes('unauthorized')) {
        return false;
      }
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
    staleTime: 0, // Always consider data stale to force fresh fetches
    gcTime: 1 * 60 * 1000, // Keep in cache for 1 minute only
    refetchOnWindowFocus: true, // Refetch when window gains focus
    refetchOnMount: true, // Always refetch on mount
  });
};

export const useAddCar = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (carData: Omit<Car, "id" | "created_at" | "updated_at" | "user_id">) => {
      // Tentando adicionar carro - logs removidos para produção
      
      if (!user?.id) {
        console.error("❌ Usuário não autenticado");
        SecurityLogger.log('error', 'unauthenticated_car_creation_attempt', {
          carData: JSON.stringify(carData).substring(0, 200)
        });
        throw new Error("Usuário não autenticado");
      }

      const dataToInsert = {
        ...carData,
        user_id: user.id
      };
      
      // Dados para inserção - log removido

      // Usar operação segura do Supabase
      const { data, error } = await secureSupabaseOperation.insert<Car>(
        supabase,
        'cars',
        dataToInsert,
        user.id
      );

      if (error) {
        console.error("❌ Erro ao inserir carro:", error);
        
        // Log específico para violações de segurança
        if (error.code === 'SECURITY_VALIDATION_FAILED') {
          SecurityLogger.log('critical', 'car_creation_security_violation', {
            userId: user.id,
            violations: error.details,
            originalData: JSON.stringify(carData).substring(0, 500)
          });
          
          throw new Error(`Dados inválidos: ${error.message}`);
        }
        
        throw error;
      }
      
      // Carro inserido com sucesso - log removido
      
      // Log de sucesso
      SecurityLogger.log('info', 'car_created_successfully', {
        userId: user.id,
        carId: data?.id,
        carName: data?.name
      });
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cars"] });
      toast({
        title: "Carro adicionado com sucesso!",
        description: "O carro foi salvo no banco de dados.",
      });
    },
    onError: (error) => {
      console.error("🚨 Erro completo ao adicionar carro:", error);
      console.error("🚨 Mensagem do erro:", error.message);
      console.error("🚨 Detalhes do erro:", error.details);
      console.error("🚨 Código do erro:", error.code);
      
      toast({
        title: "Erro ao adicionar carro",
        description: error.message || "Tente novamente mais tarde.",
        variant: "destructive",
      });
    },
  });
};

export const useUpdateCar = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Car> & { id: string }) => {
      if (!user?.id) {
        SecurityLogger.log('error', 'unauthenticated_car_update_attempt', {
          carId: id,
          updates: JSON.stringify(updates).substring(0, 200)
        });
        throw new Error("Usuário não autenticado");
      }

      // Usar operação segura do Supabase
      const { data, error } = await secureSupabaseOperation.update<Car>(
        supabase,
        'cars',
        updates,
        id,
        user.id
      );

      if (error) {
        if (error.code === 'SECURITY_VALIDATION_FAILED') {
          SecurityLogger.log('critical', 'car_update_security_violation', {
            userId: user.id,
            carId: id,
            violations: error.details,
            originalData: JSON.stringify(updates).substring(0, 500)
          });
          
          throw new Error(`Dados inválidos: ${error.message}`);
        }
        
        throw error;
      }
      
      SecurityLogger.log('info', 'car_updated_successfully', {
        userId: user.id,
        carId: id,
        updatedFields: Object.keys(updates)
      });
      
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["cars"] });
      queryClient.invalidateQueries({ queryKey: ["car-details", data.id] });
      toast({
        title: "Carro atualizado com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar carro",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
      console.error("Error updating car:", error);
    },
  });
};