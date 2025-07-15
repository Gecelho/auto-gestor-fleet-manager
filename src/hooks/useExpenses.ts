
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Expense {
  id: string;
  car_id: string;
  description: string;
  value: number;
  date: string;
  category: string;
  created_at: string;
}

type AddExpenseData = Omit<Expense, "id" | "created_at">;

export const useExpenses = (carId: string) => {
  return useQuery({
    queryKey: ["expenses", carId],
    queryFn: async (): Promise<Expense[]> => {
      const { data, error } = await supabase
        .from("expenses")
        .select("*")
        .eq("car_id", carId)
        .order("date", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });
};

export const useAddExpense = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (expenseData: AddExpenseData) => {
      const { data, error } = await supabase
        .from("expenses")
        .insert(expenseData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["expenses", data.car_id] });
      queryClient.invalidateQueries({ queryKey: ["cars"] });
      queryClient.invalidateQueries({ queryKey: ["car-details", data.car_id] });
      toast({
        title: "Despesa adicionada com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao adicionar despesa",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
      console.error("Error adding expense:", error);
    },
  });
};
