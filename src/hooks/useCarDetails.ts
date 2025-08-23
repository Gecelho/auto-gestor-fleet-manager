import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Car, Expense, Revenue, Driver } from "@/types/database";
import { useToast } from "@/hooks/use-toast";

export const useCarDetails = (carId: string) => {
  return useQuery({
    queryKey: ["car-details", carId],
    queryFn: async () => {
      try {
        const [carResult, expensesResult, revenuesResult, driverResult] = await Promise.all([
          supabase.from("cars").select("*").eq("id", carId).single(),
          supabase.from("expenses").select("*").eq("car_id", carId).order("date", { ascending: false }),
          supabase.from("revenues").select("*").eq("car_id", carId).order("date", { ascending: false }),
          supabase.from("drivers").select("*").eq("car_id", carId).maybeSingle(),
        ]);

        if (carResult.error) throw carResult.error;

        return {
          car: carResult.data as Car,
          expenses: expensesResult.data as Expense[] || [],
          revenues: revenuesResult.data as Revenue[] || [],
          driver: driverResult.data as Driver | null,
        };
      } catch (error) {
        console.error('Error loading car details:', error);
        throw error;
      }
    },
    enabled: !!carId,
    retry: (failureCount, error) => {
      // Don't retry on auth errors or not found errors
      if (error?.message?.includes('auth') || error?.message?.includes('unauthorized') || error?.message?.includes('not found')) {
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

export const useAddExpense = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (expenseData: Omit<Expense, "id" | "created_at">) => {
      const { data, error } = await supabase
        .from("expenses")
        .insert(expenseData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["car-details", variables.car_id] });
      queryClient.invalidateQueries({ queryKey: ["cars"] });
      toast({
        title: "Despesa adicionada com sucesso!",
      });
    },
    onError: () => {
      toast({
        title: "Erro ao adicionar despesa",
        variant: "destructive",
      });
    },
  });
};

export const useAddRevenue = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (revenueData: Omit<Revenue, "id" | "created_at">) => {
      const { data, error } = await supabase
        .from("revenues")
        .insert(revenueData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["car-details", variables.car_id] });
      queryClient.invalidateQueries({ queryKey: ["cars"] });
      toast({
        title: "Receita adicionada com sucesso!",
      });
    },
    onError: () => {
      toast({
        title: "Erro ao adicionar receita",
        variant: "destructive",
      });
    },
  });
};

export const useUpdateDriver = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (driverData: Omit<Driver, "id" | "created_at" | "updated_at">) => {
      // Check if driver exists
      const { data: existingDriver } = await supabase
        .from("drivers")
        .select("id")
        .eq("car_id", driverData.car_id)
        .maybeSingle();

      if (existingDriver) {
        // Update existing driver
        const { data, error } = await supabase
          .from("drivers")
          .update(driverData)
          .eq("id", existingDriver.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Create new driver
        const { data, error } = await supabase
          .from("drivers")
          .insert(driverData)
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["car-details", variables.car_id] });
      toast({
        title: "Dados do motorista salvos com sucesso!",
      });
    },
    onError: () => {
      toast({
        title: "Erro ao salvar dados do motorista",
        variant: "destructive",
      });
    },
  });
};