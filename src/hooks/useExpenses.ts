
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface Expense {
  id: string;
  car_id: string;
  description: string;
  observation?: string;
  mileage?: number;
  next_mileage?: number;
  value: number;
  date: string;
  created_at: string;
}

type AddExpenseData = Omit<Expense, "id" | "created_at">;
type UpdateExpenseData = Pick<Expense, "id" | "description" | "observation" | "mileage" | "next_mileage" | "value" | "date">;

export const useExpenses = (carId: string) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["expenses", carId, user?.id],
    queryFn: async (): Promise<Expense[]> => {
      const { data, error } = await supabase
        .from("expenses")
        .select("*")
        .eq("car_id", carId)
        .order("date", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id && !!carId, // Only run when user is authenticated and carId is provided
  });
};

export const useAddExpense = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (expenseData: AddExpenseData) => {
      if (!user?.id) {
        throw new Error("Usuário não autenticado");
      }

      const { data, error } = await supabase
        .from("expenses")
        .insert({
          ...expenseData,
          user_id: user.id
        })
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

export const useUpdateExpense = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (expenseData: UpdateExpenseData) => {
      const { id, ...updateData } = expenseData;
      const { data, error } = await supabase
        .from("expenses")
        .update(updateData)
        .eq("id", id)
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
        title: "Despesa atualizada com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar despesa",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
      console.error("Error updating expense:", error);
    },
  });
};

export const useDeleteExpense = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (expenseId: string) => {
      // First get the car_id for cache invalidation
      const { data: expense, error: fetchError } = await supabase
        .from("expenses")
        .select("car_id")
        .eq("id", expenseId)
        .single();

      if (fetchError) throw fetchError;

      const { error } = await supabase
        .from("expenses")
        .delete()
        .eq("id", expenseId);

      if (error) throw error;
      return expense.car_id;
    },
    onSuccess: (carId) => {
      queryClient.invalidateQueries({ queryKey: ["expenses", carId] });
      queryClient.invalidateQueries({ queryKey: ["cars"] });
      queryClient.invalidateQueries({ queryKey: ["car-details", carId] });
      toast({
        title: "Despesa excluída com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir despesa",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
      console.error("Error deleting expense:", error);
    },
  });
};
