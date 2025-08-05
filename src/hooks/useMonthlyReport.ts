
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface MonthlyReportData {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  expenses: Array<{
    id: string;
    description: string;
    observation?: string;
    mileage?: number;
    next_mileage?: number;
    value: number;
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

interface PeriodReportData extends MonthlyReportData {
  monthlyBreakdown: Array<{
    month: string;
    monthName: string;
    revenue: number;
    expenses: number;
    profit: number;
  }>;
}

export const useMonthlyReport = (carId: string, month: string, year: string) => {
  return useQuery({
    queryKey: ["monthly-report", carId, month, year],
    queryFn: async (): Promise<MonthlyReportData> => {
      if (!month || !year || !carId) {
        return {
          totalRevenue: 0,
          totalExpenses: 0,
          netProfit: 0,
          expenses: [],
          revenues: [],
        };
      }

      // Format month to ensure it's in YYYY-MM format
      const formattedMonth = month.length === 7 ? month : `${year}-${month.padStart(2, '0')}`;
      const startDate = `${formattedMonth}-01`;
      const endDate = `${formattedMonth}-31`;

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
    enabled: Boolean(carId && month && year), // Enable when all params are provided
  });
};

export const usePeriodReport = (carId: string, startMonth: string, endMonth: string) => {
  return useQuery({
    queryKey: ["period-report", carId, startMonth, endMonth],
    queryFn: async (): Promise<PeriodReportData> => {
      if (!startMonth || !endMonth) {
        return {
          totalRevenue: 0,
          totalExpenses: 0,
          netProfit: 0,
          expenses: [],
          revenues: [],
          monthlyBreakdown: [],
        };
      }

      const startDate = `${startMonth}-01`;
      const endDate = `${endMonth}-31`;

      // Get expenses for the period
      const { data: expenses, error: expensesError } = await supabase
        .from("expenses")
        .select("*")
        .eq("car_id", carId)
        .gte("date", startDate)
        .lte("date", endDate)
        .order("date", { ascending: false });

      if (expensesError) throw expensesError;

      // Get revenues for the period
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

      // Create monthly breakdown
      const monthlyData: { [key: string]: { revenue: number; expenses: number } } = {};
      
      // Process expenses by month
      expenses?.forEach(expense => {
        const monthKey = expense.date.substring(0, 7); // YYYY-MM
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { revenue: 0, expenses: 0 };
        }
        monthlyData[monthKey].expenses += Number(expense.value);
      });

      // Process revenues by month
      revenues?.forEach(revenue => {
        const monthKey = revenue.date.substring(0, 7); // YYYY-MM
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { revenue: 0, expenses: 0 };
        }
        monthlyData[monthKey].revenue += Number(revenue.value);
      });

      // Convert to array and sort
      const monthlyBreakdown = Object.entries(monthlyData)
        .map(([month, data]) => ({
          month,
          monthName: format(new Date(month + '-01'), 'MMMM yyyy', { locale: ptBR }),
          revenue: data.revenue,
          expenses: data.expenses,
          profit: data.revenue - data.expenses,
        }))
        .sort((a, b) => a.month.localeCompare(b.month));

      return {
        totalRevenue,
        totalExpenses,
        netProfit,
        expenses: expenses || [],
        revenues: revenues || [],
        monthlyBreakdown,
      };
    },
    enabled: Boolean(carId && startMonth && endMonth), // Enable when all params are provided
  });
};
