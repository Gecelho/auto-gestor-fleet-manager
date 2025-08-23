
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { secureSupabaseOperation } from "@/lib/supabase-interceptor";
import { SecurityLogger } from "@/lib/security";

export const useDeleteCar = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (carId: string) => {
      if (!user?.id) {
        SecurityLogger.log('error', 'unauthenticated_car_delete_attempt', {
          carId
        });
        throw new Error("Usuário não autenticado");
      }

      // Log da tentativa de exclusão
      SecurityLogger.log('info', 'car_deletion_initiated', {
        userId: user.id,
        carId
      });

      // Delete all related data in the correct order usando operações seguras
      
      // Delete expenses
      const { error: expensesError } = await secureSupabaseOperation.delete(
        supabase,
        "expenses",
        carId, // Nota: isso pode precisar ser ajustado se expenses não usa car_id como id principal
        user.id
      );
      
      if (expensesError && expensesError.code !== 'PGRST116') { // PGRST116 = no rows found
        if (expensesError.code === 'SECURITY_VALIDATION_FAILED') {
          SecurityLogger.log('critical', 'car_delete_security_violation', {
            userId: user.id,
            carId,
            stage: 'expenses_deletion',
            violations: expensesError.details
          });
          throw new Error(`Erro de segurança ao deletar despesas: ${expensesError.message}`);
        }
        throw expensesError;
      }

      // Delete revenues
      const { error: revenuesError } = await secureSupabaseOperation.delete(
        supabase,
        "revenues",
        carId,
        user.id
      );
      
      if (revenuesError && revenuesError.code !== 'PGRST116') {
        if (revenuesError.code === 'SECURITY_VALIDATION_FAILED') {
          SecurityLogger.log('critical', 'car_delete_security_violation', {
            userId: user.id,
            carId,
            stage: 'revenues_deletion',
            violations: revenuesError.details
          });
          throw new Error(`Erro de segurança ao deletar receitas: ${revenuesError.message}`);
        }
        throw revenuesError;
      }

      // Delete driver
      const { error: driverError } = await secureSupabaseOperation.delete(
        supabase,
        "drivers",
        carId,
        user.id
      );
      
      if (driverError && driverError.code !== 'PGRST116') {
        if (driverError.code === 'SECURITY_VALIDATION_FAILED') {
          SecurityLogger.log('critical', 'car_delete_security_violation', {
            userId: user.id,
            carId,
            stage: 'driver_deletion',
            violations: driverError.details
          });
          throw new Error(`Erro de segurança ao deletar motorista: ${driverError.message}`);
        }
        throw driverError;
      }

      // Finally delete the car
      const { error: carError } = await secureSupabaseOperation.delete(
        supabase,
        "cars",
        carId,
        user.id
      );

      if (carError) {
        if (carError.code === 'SECURITY_VALIDATION_FAILED') {
          SecurityLogger.log('critical', 'car_delete_security_violation', {
            userId: user.id,
            carId,
            stage: 'car_deletion',
            violations: carError.details
          });
          throw new Error(`Erro de segurança ao deletar carro: ${carError.message}`);
        }
        throw carError;
      }

      // Log de sucesso
      SecurityLogger.log('info', 'car_deleted_successfully', {
        userId: user.id,
        carId
      });

      return carId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cars"] });
      toast({
        title: "Carro deletado com sucesso!",
        description: "Todos os dados relacionados foram removidos.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao deletar carro",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
      console.error("Error deleting car:", error);
    },
  });
};
