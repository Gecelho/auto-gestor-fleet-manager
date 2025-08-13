import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, startOfWeek, endOfWeek } from "date-fns";
import type { 
  CarMileageConfig, 
  WeeklyMileageControl, 
  MileageBalance, 
  WeeklyMileageSummary 
} from "@/types/database";

// Hook para buscar configuração de quilometragem do carro
export const useCarMileageConfig = (carId: string) => {
  return useQuery({
    queryKey: ["car-mileage-config", carId],
    queryFn: async (): Promise<CarMileageConfig | null> => {
      const { data, error } = await supabase
        .from("car_mileage_config")
        .select("*")
        .eq("car_id", carId)
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      return data;
    },
    enabled: !!carId,
  });
};

// Hook para buscar saldo acumulado
export const useMileageBalance = (carId: string) => {
  return useQuery({
    queryKey: ["mileage-balance", carId],
    queryFn: async (): Promise<MileageBalance | null> => {
      const { data, error } = await supabase
        .from("mileage_balance")
        .select("*")
        .eq("car_id", carId)
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      return data;
    },
    enabled: !!carId,
  });
};

// Hook para buscar controle semanal
export const useWeeklyMileageControl = (carId: string) => {
  return useQuery({
    queryKey: ["weekly-mileage-control", carId],
    queryFn: async (): Promise<WeeklyMileageSummary[]> => {
      const { data, error } = await supabase
        .from("weekly_mileage_summary")
        .select("*")
        .eq("car_id", carId)
        .order("week_start_date", { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    },
    enabled: !!carId,
  });
};

// Hook para buscar semana atual
export const useCurrentWeekMileage = (carId: string) => {
  const currentWeekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
  
  return useQuery({
    queryKey: ["current-week-mileage", carId, currentWeekStart],
    queryFn: async (): Promise<WeeklyMileageSummary | null> => {
      const { data, error } = await supabase
        .from("weekly_mileage_summary")
        .select("*")
        .eq("car_id", carId)
        .eq("week_start_date", currentWeekStart)
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      return data;
    },
    enabled: !!carId,
  });
};

// Hook para atualizar configuração de quilometragem
export const useUpdateMileageConfig = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (config: Partial<CarMileageConfig> & { car_id: string }) => {
      const { data, error } = await supabase
        .from("car_mileage_config")
        .upsert({
          car_id: config.car_id,
          weekly_km_limit: config.weekly_km_limit || 1000,
          overage_rate_per_km: config.overage_rate_per_km || 0.55,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["car-mileage-config", data.car_id] });
      toast.success("Configuração de quilometragem atualizada!");
    },
    onError: (error) => {
      console.error("Error updating mileage config:", error);
      toast.error("Erro ao atualizar configuração de quilometragem");
    },
  });
};

// Hook para inicializar semana
export const useInitializeWeek = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ carId, weekStart }: { carId: string; weekStart: Date }) => {
      const weekStartStr = format(weekStart, 'yyyy-MM-dd');
      const weekEndStr = format(endOfWeek(weekStart, { weekStartsOn: 1 }), 'yyyy-MM-dd');

      const { data, error } = await supabase.rpc('initialize_weekly_mileage', {
        p_car_id: carId,
        p_week_start: weekStartStr,
        p_week_end: weekEndStr,
      });

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["weekly-mileage-control", variables.carId] });
      queryClient.invalidateQueries({ queryKey: ["current-week-mileage", variables.carId] });
      queryClient.invalidateQueries({ queryKey: ["mileage-balance", variables.carId] });
      toast.success("Semana inicializada com sucesso!");
    },
    onError: (error) => {
      console.error("Error initializing week:", error);
      toast.error("Erro ao inicializar semana");
    },
  });
};

// Hook para atualizar quilometragem usada
export const useUpdateUsedMileage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      weeklyControlId, 
      usedKm, 
      carId 
    }: { 
      weeklyControlId: string; 
      usedKm: number; 
      carId: string;
    }) => {
      const { data, error } = await supabase
        .from("weekly_mileage_control")
        .update({
          used_km: usedKm,
          updated_at: new Date().toISOString(),
        })
        .eq("id", weeklyControlId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["weekly-mileage-control", variables.carId] });
      queryClient.invalidateQueries({ queryKey: ["current-week-mileage", variables.carId] });
      queryClient.invalidateQueries({ queryKey: ["mileage-balance", variables.carId] });
      toast.success("Quilometragem atualizada!");
    },
    onError: (error) => {
      console.error("Error updating used mileage:", error);
      toast.error("Erro ao atualizar quilometragem");
    },
  });
};