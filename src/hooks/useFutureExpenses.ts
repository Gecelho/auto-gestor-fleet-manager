import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface FutureExpense {
  future_expense_id: string;
  car_id: string;
  target_mileage: number;
  is_completed: boolean;
  future_created_at: string;
  future_updated_at: string;
  expense_id: string;
  description: string;
  value: number;
  expense_date: string;
  observation?: string;
  expense_mileage?: number;
  next_mileage?: number;
  paid: boolean;
  current_car_mileage: number;
  car_model: string;
  car_brand: string;
  car_plate: string;
  km_remaining: number;
  is_near: boolean;
}

// Hook para buscar despesas futuras de um carro específico
export function useFutureExpenses(carId: string, filter: 'all' | 'pending' | 'completed' = 'all') {
  return useQuery({
    queryKey: ["future-expenses", carId, filter],
    queryFn: async () => {
      let query = supabase
        .from("future_expenses_view")
        .select("*")
        .eq("car_id", carId);

      if (filter === 'pending') {
        query = query.eq("is_completed", false);
      } else if (filter === 'completed') {
        query = query.eq("is_completed", true);
      }

      // Ordenar: pendentes primeiro, depois por proximidade (km_remaining)
      query = query.order("is_completed", { ascending: true })
                   .order("km_remaining", { ascending: true });

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching future expenses:", error);
        throw error;
      }

      return data as FutureExpense[];
    },
  });
}

// Hook para buscar a próxima despesa de cada carro
export function useNextExpensePerCar() {
  return useQuery({
    queryKey: ["next-expenses-per-car"],
    queryFn: async () => {
      // Buscar a despesa mais próxima de cada carro
      const { data, error } = await supabase.rpc('get_next_expense_per_car');

      if (error) {
        // Se a função RPC não existir, fazer a consulta manualmente
        const { data: allData, error: queryError } = await supabase
          .from("future_expenses_view")
          .select("*")
          .eq("is_completed", false)
          .order("car_id")
          .order("km_remaining", { ascending: true });

        if (queryError) {
          console.error("Error fetching next expenses per car:", queryError);
          throw queryError;
        }

        // Agrupar por car_id e pegar apenas o primeiro (mais próximo) de cada
        const grouped = allData?.reduce((acc, expense) => {
          if (!acc[expense.car_id]) {
            acc[expense.car_id] = expense;
          }
          return acc;
        }, {} as Record<string, FutureExpense>);

        return Object.values(grouped || {});
      }

      return data as FutureExpense[];
    },
  });
}

// Hook para marcar despesa futura como completa/incompleta
export function useToggleFutureExpenseCompletion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ futureExpenseId, isCompleted }: { futureExpenseId: string; isCompleted: boolean }) => {
      const { error } = await supabase
        .from("future_expenses")
        .update({ is_completed: isCompleted })
        .eq("id", futureExpenseId);

      if (error) {
        console.error("Error updating future expense completion:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["future-expenses"] });
      queryClient.invalidateQueries({ queryKey: ["next-expenses-per-car"] });
    },
  });
}

// Hook para marcar despesa como paga/não paga
export function useToggleExpensePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ expenseId, isPaid }: { expenseId: string; isPaid: boolean }) => {
      const { error } = await supabase
        .from("expenses")
        .update({ paid: isPaid })
        .eq("id", expenseId);

      if (error) {
        console.error("Error updating expense payment status:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["future-expenses"] });
      queryClient.invalidateQueries({ queryKey: ["next-expenses-per-car"] });
      queryClient.invalidateQueries({ queryKey: ["car-details"] });
    },
  });
}

// Hook para atualizar quilometragem atual do carro
export function useUpdateCarMileage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ carId, mileage }: { carId: string; mileage: number }) => {
      const { error } = await supabase.rpc('update_car_current_mileage', {
        p_car_id: carId,
        p_mileage: mileage
      });

      if (error) {
        console.error("Error updating car current mileage:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cars"] });
      queryClient.invalidateQueries({ queryKey: ["future-expenses"] });
      queryClient.invalidateQueries({ queryKey: ["next-expenses-per-car"] });
      queryClient.invalidateQueries({ queryKey: ["car-details"] });
      queryClient.invalidateQueries({ queryKey: ["car-current-mileage"] });
    },
  });
}

// Hook para buscar quilometragem atual de um carro
export function useCarCurrentMileage(carId: string) {
  return useQuery({
    queryKey: ["car-current-mileage", carId],
    queryFn: async () => {
      // Primeiro tenta buscar da tabela car_current_mileage (se existir)
      const { data: currentMileageData, error: currentMileageError } = await supabase
        .from("car_current_mileage")
        .select("current_mileage")
        .eq("car_id", carId)
        .maybeSingle(); // Use maybeSingle() em vez de single() para não dar erro se não encontrar

      // Se encontrou dados na tabela car_current_mileage, use eles
      if (currentMileageData && !currentMileageError) {
        return currentMileageData.current_mileage || 0;
      }

      // Caso contrário, busca da tabela cars como fallback
      const { data: carData, error: carError } = await supabase
        .from("cars")
        .select("mileage")
        .eq("id", carId)
        .single();

      if (carError) {
        console.error("Error fetching car mileage:", carError);
        throw carError;
      }

      return carData?.mileage || 0;
    },
    enabled: !!carId, // Só executa se carId existir
  });
}