import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuth } from "@/contexts/AuthContext";

interface GeneralReportData {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  carBreakdown: Array<{
    carId: string;
    carName: string;
    revenue: number;
    expenses: number;
    profit: number;
  }>;
}

interface GeneralPeriodReportData extends GeneralReportData {
  monthlyBreakdown: Array<{
    month: string;
    monthName: string;
    revenue: number;
    expenses: number;
    profit: number;
  }>;
  carBreakdown: Array<{
    carId: string;
    carName: string;
    revenue: number;
    expenses: number;
    profit: number;
    monthlyBreakdown: Array<{
      month: string;
      monthName: string;
      revenue: number;
      expenses: number;
      profit: number;
    }>;
  }>;
}

export const useGeneralReport = (carIds: string[], month: string, year: string) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["general-report", carIds, month, year, user?.id],
    queryFn: async (): Promise<GeneralReportData> => {
      if (!month || !user?.id) {
        return {
          totalRevenue: 0,
          totalExpenses: 0,
          netProfit: 0,
          carBreakdown: [],
        };
      }

      // Use the month directly as it comes in YYYY-MM format from the input
      const startDate = `${month}-01`;
      const endDate = `${month}-31`;

      // Get all cars for the current user
      let carsQuery = supabase.from("cars").select("id, name").eq("user_id", user.id);
      if (carIds.length > 0) {
        carsQuery = carsQuery.in("id", carIds);
      }
      const { data: cars, error: carsError } = await carsQuery;
      if (carsError) throw carsError;

      const carBreakdown: Array<{
        carId: string;
        carName: string;
        revenue: number;
        expenses: number;
        profit: number;
      }> = [];

      let totalRevenue = 0;
      let totalExpenses = 0;

      // Process each car
      for (const car of cars || []) {
        // Get expenses for the car and month
        const { data: expenses, error: expensesError } = await supabase
          .from("expenses")
          .select("value")
          .eq("car_id", car.id)
          .gte("date", startDate)
          .lte("date", endDate);

        if (expensesError) throw expensesError;

        // Get revenues for the car and month
        const { data: revenues, error: revenuesError } = await supabase
          .from("revenues")
          .select("value")
          .eq("car_id", car.id)
          .gte("date", startDate)
          .lte("date", endDate);

        if (revenuesError) throw revenuesError;

        const carExpenses = expenses?.reduce((sum, exp) => sum + Number(exp.value), 0) || 0;
        const carRevenue = revenues?.reduce((sum, rev) => sum + Number(rev.value), 0) || 0;
        const carProfit = carRevenue - carExpenses;

        carBreakdown.push({
          carId: car.id,
          carName: car.name,
          revenue: carRevenue,
          expenses: carExpenses,
          profit: carProfit,
        });

        totalRevenue += carRevenue;
        totalExpenses += carExpenses;
      }

      const netProfit = totalRevenue - totalExpenses;

      return {
        totalRevenue,
        totalExpenses,
        netProfit,
        carBreakdown: carBreakdown.sort((a, b) => b.profit - a.profit),
      };
    },
    enabled: Boolean(month), // Enable when month is provided
  });
};

export const useGeneralPeriodReport = (carIds: string[], startMonth: string, endMonth: string) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["general-period-report", carIds, startMonth, endMonth, user?.id],
    queryFn: async (): Promise<GeneralPeriodReportData> => {
      if (!startMonth || !endMonth || !user?.id) {
        return {
          totalRevenue: 0,
          totalExpenses: 0,
          netProfit: 0,
          carBreakdown: [],
          monthlyBreakdown: [],
        };
      }

      const startDate = `${startMonth}-01`;
      const endDate = `${endMonth}-31`;

      // Get all cars for the current user
      let carsQuery = supabase.from("cars").select("id, name").eq("user_id", user.id);
      if (carIds.length > 0) {
        carsQuery = carsQuery.in("id", carIds);
      }
      const { data: cars, error: carsError } = await carsQuery;
      if (carsError) throw carsError;

      const carBreakdown: Array<{
        carId: string;
        carName: string;
        revenue: number;
        expenses: number;
        profit: number;
        monthlyBreakdown: Array<{
          month: string;
          monthName: string;
          revenue: number;
          expenses: number;
          profit: number;
        }>;
      }> = [];

      const monthlyData: { [key: string]: { revenue: number; expenses: number } } = {};
      let totalRevenue = 0;
      let totalExpenses = 0;

      // Process each car
      for (const car of cars || []) {
        // Get expenses for the car and period
        const { data: expenses, error: expensesError } = await supabase
          .from("expenses")
          .select("value, date")
          .eq("car_id", car.id)
          .gte("date", startDate)
          .lte("date", endDate);

        if (expensesError) throw expensesError;

        // Get revenues for the car and period
        const { data: revenues, error: revenuesError } = await supabase
          .from("revenues")
          .select("value, date")
          .eq("car_id", car.id)
          .gte("date", startDate)
          .lte("date", endDate);

        if (revenuesError) throw revenuesError;

        const carExpenses = expenses?.reduce((sum, exp) => sum + Number(exp.value), 0) || 0;
        const carRevenue = revenues?.reduce((sum, rev) => sum + Number(rev.value), 0) || 0;
        const carProfit = carRevenue - carExpenses;

        // Process monthly data for this specific car
        const carMonthlyData: { [key: string]: { revenue: number; expenses: number } } = {};
        
        expenses?.forEach(expense => {
          const monthKey = expense.date.substring(0, 7); // YYYY-MM
          if (!carMonthlyData[monthKey]) {
            carMonthlyData[monthKey] = { revenue: 0, expenses: 0 };
          }
          carMonthlyData[monthKey].expenses += Number(expense.value);
          
          // Also add to global monthly data
          if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = { revenue: 0, expenses: 0 };
          }
          monthlyData[monthKey].expenses += Number(expense.value);
        });

        revenues?.forEach(revenue => {
          const monthKey = revenue.date.substring(0, 7); // YYYY-MM
          if (!carMonthlyData[monthKey]) {
            carMonthlyData[monthKey] = { revenue: 0, expenses: 0 };
          }
          carMonthlyData[monthKey].revenue += Number(revenue.value);
          
          // Also add to global monthly data
          if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = { revenue: 0, expenses: 0 };
          }
          monthlyData[monthKey].revenue += Number(revenue.value);
        });

        // Convert car monthly data to array
        const carMonthlyBreakdown = Object.entries(carMonthlyData)
          .map(([month, data]) => ({
            month,
            monthName: format(new Date(month + '-01'), 'MMMM yyyy', { locale: ptBR }),
            revenue: data.revenue,
            expenses: data.expenses,
            profit: data.revenue - data.expenses,
          }))
          .sort((a, b) => a.month.localeCompare(b.month));

        carBreakdown.push({
          carId: car.id,
          carName: car.name,
          revenue: carRevenue,
          expenses: carExpenses,
          profit: carProfit,
          monthlyBreakdown: carMonthlyBreakdown,
        });

        totalRevenue += carRevenue;
        totalExpenses += carExpenses;
      }

      // Convert monthly data to array and sort
      const monthlyBreakdown = Object.entries(monthlyData)
        .map(([month, data]) => ({
          month,
          monthName: format(new Date(month + '-01'), 'MMMM yyyy', { locale: ptBR }),
          revenue: data.revenue,
          expenses: data.expenses,
          profit: data.revenue - data.expenses,
        }))
        .sort((a, b) => a.month.localeCompare(b.month));

      const netProfit = totalRevenue - totalExpenses;

      return {
        totalRevenue,
        totalExpenses,
        netProfit,
        carBreakdown: carBreakdown.sort((a, b) => b.profit - a.profit),
        monthlyBreakdown,
      };
    },
    enabled: Boolean(startMonth && endMonth), // Enable when start and end months are provided
  });
};