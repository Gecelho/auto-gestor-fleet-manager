import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useCallback } from "react";

export const useNavigationCache = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const navigateToIndex = useCallback(() => {
    // Clear all car-related cache before navigating to index
    queryClient.invalidateQueries({ queryKey: ["cars"] });
    queryClient.removeQueries({ queryKey: ["cars"] });
    
    // Also clear any car details cache
    queryClient.invalidateQueries({ queryKey: ["car-details"] });
    queryClient.removeQueries({ queryKey: ["car-details"] });
    
    navigate("/");
  }, [queryClient, navigate]);

  const navigateToCarDetail = useCallback((carId: string, tab?: string) => {
    // Clear car details cache before navigating to ensure fresh data
    queryClient.invalidateQueries({ queryKey: ["car-details", carId] });
    queryClient.removeQueries({ queryKey: ["car-details", carId] });
    
    // Build URL with tab parameter if provided
    let url = `/car/${carId}`;
    if (tab && ['info', 'expenses', 'revenues', 'driver'].includes(tab)) {
      url += `?tab=${tab}`;
    } else {
      // Check if there's a saved tab preference
      const savedTab = localStorage.getItem(`carDetail_${carId}_activeTab`);
      if (savedTab && ['info', 'expenses', 'revenues', 'driver'].includes(savedTab)) {
        url += `?tab=${savedTab}`;
      }
    }
    
    navigate(url);
  }, [queryClient, navigate]);

  const refreshCarsCache = useCallback(async () => {
    // Force refresh cars data
    queryClient.invalidateQueries({ queryKey: ["cars"] });
    queryClient.removeQueries({ queryKey: ["cars"] });
    
    // Trigger refetch
    await queryClient.refetchQueries({ queryKey: ["cars"] });
  }, [queryClient]);

  const refreshCarDetailsCache = useCallback(async (carId: string) => {
    // Force refresh car details data
    queryClient.invalidateQueries({ queryKey: ["car-details", carId] });
    queryClient.removeQueries({ queryKey: ["car-details", carId] });
    
    // Trigger refetch
    await queryClient.refetchQueries({ queryKey: ["car-details", carId] });
  }, [queryClient]);

  return {
    navigateToIndex,
    navigateToCarDetail,
    refreshCarsCache,
    refreshCarDetailsCache,
  };
};