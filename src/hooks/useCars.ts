import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Car, CarWithFinancials } from "@/types/database";
import { useToast } from "@/hooks/use-toast";

export const useCars = () => {
  const { toast } = useToast();

  return useQuery({
    queryKey: ["cars"],
    queryFn: async (): Promise<CarWithFinancials[]> => {
      const { data: cars, error: carsError } = await supabase
        .from("cars")
        .select("*")
        .order("created_at", { ascending: false });

      if (carsError) throw carsError;

      const carsWithFinancials = await Promise.all(
        (cars || []).map(async (car) => {
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
        })
      );

      return carsWithFinancials;
    },
  });
};

export const useAddCar = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (carData: Omit<Car, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("cars")
        .insert(carData)
        .select()
        .single();

      if (error) throw error;
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
      toast({
        title: "Erro ao adicionar carro",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
      console.error("Error adding car:", error);
    },
  });
};

export const useUpdateCar = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Car> & { id: string }) => {
      const { data, error } = await supabase
        .from("cars")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cars"] });
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