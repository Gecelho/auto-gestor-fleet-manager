
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { startOfWeek, endOfWeek, format } from "date-fns";

interface Revenue {
  id: string;
  car_id: string;
  description: string;
  value: number;
  date: string;
  type: string;
  created_at: string;
}

type AddRevenueData = Omit<Revenue, "id" | "created_at">;
type UpdateRevenueData = Pick<Revenue, "id" | "description" | "value" | "date" | "type">;

export const useRevenues = (carId: string) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["revenues", carId, user?.id],
    queryFn: async (): Promise<Revenue[]> => {
      const { data, error } = await supabase
        .from("revenues")
        .select("*")
        .eq("car_id", carId)
        .order("date", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id && !!carId, // Only run when user is authenticated and carId is provided
  });
};

export const useAddRevenue = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (revenueData: AddRevenueData) => {
      if (!user?.id) {
        throw new Error("Usuário não autenticado");
      }

      // Verificar se a data está dentro de uma semana específica
      const revenueDate = new Date(revenueData.date);
      const weekStart = startOfWeek(revenueDate, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(revenueDate, { weekStartsOn: 1 });

      // Adding revenue - log removido para produção

      const { data, error } = await supabase
        .from("revenues")
        .insert({
          ...revenueData,
          user_id: user.id
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["revenues", data.car_id] });
      queryClient.invalidateQueries({ queryKey: ["cars"] });
      queryClient.invalidateQueries({ queryKey: ["car-details", data.car_id] });
      toast({
        title: "Receita adicionada com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao adicionar receita",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
      console.error("Error adding revenue:", error);
    },
  });
};

export const useUpdateRevenue = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (revenueData: UpdateRevenueData) => {
      const { id, ...updateData } = revenueData;
      const { data, error } = await supabase
        .from("revenues")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["revenues", data.car_id] });
      queryClient.invalidateQueries({ queryKey: ["cars"] });
      queryClient.invalidateQueries({ queryKey: ["car-details", data.car_id] });
      toast({
        title: "Receita atualizada com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar receita",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
      console.error("Error updating revenue:", error);
    },
  });
};

export const useDeleteRevenue = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (revenueId: string) => {
      // First get the car_id for cache invalidation
      const { data: revenue, error: fetchError } = await supabase
        .from("revenues")
        .select("car_id")
        .eq("id", revenueId)
        .single();

      if (fetchError) throw fetchError;

      const { error } = await supabase
        .from("revenues")
        .delete()
        .eq("id", revenueId);

      if (error) throw error;
      return revenue.car_id;
    },
    onSuccess: (carId) => {
      queryClient.invalidateQueries({ queryKey: ["revenues", carId] });
      queryClient.invalidateQueries({ queryKey: ["cars"] });
      queryClient.invalidateQueries({ queryKey: ["car-details", carId] });
      toast({
        title: "Receita excluída com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir receita",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
      console.error("Error deleting revenue:", error);
    },
  });
};
