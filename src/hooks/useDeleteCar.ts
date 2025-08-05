
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useDeleteCar = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (carId: string) => {
      // Delete all related data in the correct order
      
      // Delete expenses
      const { error: expensesError } = await supabase
        .from("expenses")
        .delete()
        .eq("car_id", carId);
      
      if (expensesError) throw expensesError;

      // Delete revenues
      const { error: revenuesError } = await supabase
        .from("revenues")
        .delete()
        .eq("car_id", carId);
      
      if (revenuesError) throw revenuesError;

      // Delete driver
      const { error: driverError } = await supabase
        .from("drivers")
        .delete()
        .eq("car_id", carId);
      
      if (driverError) throw driverError;

      // Finally delete the car
      const { error: carError } = await supabase
        .from("cars")
        .delete()
        .eq("id", carId);

      if (carError) throw carError;

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
