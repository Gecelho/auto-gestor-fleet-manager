
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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

export const useRevenues = (carId: string) => {
  return useQuery({
    queryKey: ["revenues", carId],
    queryFn: async (): Promise<Revenue[]> => {
      const { data, error } = await supabase
        .from("revenues")
        .select("*")
        .eq("car_id", carId)
        .order("date", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });
};

export const useAddRevenue = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (revenueData: AddRevenueData) => {
      const { data, error } = await supabase
        .from("revenues")
        .insert(revenueData)
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
