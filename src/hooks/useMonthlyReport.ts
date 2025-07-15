
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface MonthlyReportData {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  expenses: Array<{
    id: string;
    description: string;
    value: number;
    category: string;
    date: string;
  }>;
  revenues: Array<{
    id: string;
    description: string;
    value: number;
    type: string;
    date: string;
  }>;
}

export const useMonthlyReport = (carId: string, month: string, year: string) => {
  return useQuery({
    queryKey: ["monthly-report", carId, month, year],
    queryFn: async (): Promise<MonthlyReportData> => {
      if (!month || !year) {
        return {
          totalRevenue: 0,
          totalExpenses: 0,
          netProfit: 0,
          expenses: [],
          revenues: [],
        };
      }

      const startDate = `${year}-${month}-01`;
      const endDate = `${year}-${month}-31`;

      // Get expenses for the month
      const { data: expenses, error: expensesError } = await supabase
        .from("expenses")
        .select("*")
        .eq("car_id", carId)
        .gte("date", startDate)
        .lte("date", endDate)
        .order("date", { ascending: false });

      if (expensesError) throw expensesError;

      // Get revenues for the month
      const { data: revenues, error: revenuesError } = await supabase
        .from("revenues")
        .select("*")
        .eq("car_id", carId)
        .gte("date", startDate)
        .lte("date", endDate)
        .order("date", { ascending: false });

      if (revenuesError) throw revenuesError;

      const totalExpenses = expenses?.reduce((sum, exp) => sum + Number(exp.value), 0) || 0;
      const totalRevenue = revenues?.reduce((sum, rev) => sum + Number(rev.value), 0) || 0;
      const netProfit = totalRevenue - totalExpenses;

      return {
        totalRevenue,
        totalExpenses,
        netProfit,
        expenses: expenses || [],
        revenues: revenues || [],
      };
    },
    enabled: false, // Don't auto-fetch, only when manually triggered
  });
};
