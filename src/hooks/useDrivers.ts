import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Driver, DriverInsert, DriverWithCar } from "@/types/database";

export const useDrivers = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["drivers", user?.id],
    queryFn: async (): Promise<DriverWithCar[]> => {
      const { data: drivers, error } = await supabase
        .from("drivers")
        .select(`
          *,
          car:cars(*)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return drivers || [];
    },
    enabled: !!user?.id, // Only run when user is authenticated
  });
};

export const useDriversByCarId = (carId: string) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["drivers", "car", carId, user?.id],
    queryFn: async (): Promise<Driver[]> => {
      const { data, error } = await supabase
        .from("drivers")
        .select("*")
        .eq("car_id", carId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id && !!carId,
  });
};

export const useAddDriver = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (driverData: DriverInsert) => {
      if (!user?.id) {
        throw new Error("Usuário não autenticado");
      }

      const { data, error } = await supabase
        .from("drivers")
        .insert({
          ...driverData,
          owner_id: user.id
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
      toast({
        title: "Motorista adicionado com sucesso!",
        description: "O motorista foi cadastrado no sistema.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao adicionar motorista",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
      console.error("Error adding driver:", error);
    },
  });
};

export const useUpdateDriver = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Driver> & { id: string }) => {
      const { data, error } = await supabase
        .from("drivers")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
      toast({
        title: "Motorista atualizado com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar motorista",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
      console.error("Error updating driver:", error);
    },
  });
};

export const useDeleteDriver = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (driverId: string) => {
      const { error } = await supabase
        .from("drivers")
        .delete()
        .eq("id", driverId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
      toast({
        title: "Motorista removido com sucesso!",
        description: "O motorista foi removido do sistema.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao remover motorista",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
      console.error("Error deleting driver:", error);
    },
  });
};