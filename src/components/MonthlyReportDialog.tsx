import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Calendar, TrendingUp, TrendingDown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface MonthlyReportDialogProps {
  carId: string;
}

export function MonthlyReportDialog({ carId }: MonthlyReportDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  const { data: monthlyData, isLoading } = useQuery({
    queryKey: ["monthly-report", carId, selectedMonth],
    queryFn: async () => {
      const startDate = `${selectedMonth}-01`;
      const endDate = `${selectedMonth}-31`;

      const [expensesResult, revenuesResult] = await Promise.all([
        supabase
          .from("expenses")
          .select("*")
          .eq("car_id", carId)
          .gte("date", startDate)
          .lte("date", endDate),
        supabase
          .from("revenues")
          .select("*")
          .eq("car_id", carId)
          .gte("date", startDate)
          .lte("date", endDate),
      ]);

      const expenses = expensesResult.data || [];
      const revenues = revenuesResult.data || [];

      const totalExpenses = expenses.reduce((sum, exp) => sum + Number(exp.value), 0);
      const totalRevenues = revenues.reduce((sum, rev) => sum + Number(rev.value), 0);

      return {
        expenses,
        revenues,
        totalExpenses,
        totalRevenues,
        netProfit: totalRevenues - totalExpenses,
      };
    },
    enabled: !!carId && open,
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR");
  };

  const getMonthName = () => {
    const date = new Date(selectedMonth + "-01");
    return date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Calendar className="w-4 h-4 mr-2" />
          Relatório Mensal
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Relatório Mensal</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Month Selector */}
          <div className="space-y-2">
            <Label htmlFor="month">Selecionar Mês e Ano</Label>
            <Input
              id="month"
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-fit"
            />
          </div>

          {isLoading ? (
            <div className="text-center py-8">Carregando...</div>
          ) : monthlyData ? (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-4">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5 text-success" />
                    <div>
                      <p className="text-sm text-muted-foreground">Receitas ({getMonthName()})</p>
                      <p className="text-xl font-bold text-success">
                        {formatCurrency(monthlyData.totalRevenues)}
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center space-x-2">
                    <TrendingDown className="w-5 h-5 text-danger" />
                    <div>
                      <p className="text-sm text-muted-foreground">Despesas ({getMonthName()})</p>
                      <p className="text-xl font-bold text-danger">
                        {formatCurrency(monthlyData.totalExpenses)}
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-5 h-5 text-info" />
                    <div>
                      <p className="text-sm text-muted-foreground">Lucro Líquido</p>
                      <p className={`text-xl font-bold ${monthlyData.netProfit >= 0 ? 'text-success' : 'text-danger'}`}>
                        {formatCurrency(monthlyData.netProfit)}
                      </p>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Detailed Lists */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Revenues */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-success">
                    Receitas ({monthlyData.revenues.length})
                  </h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {monthlyData.revenues.length === 0 ? (
                      <p className="text-muted-foreground text-sm">Nenhuma receita no período</p>
                    ) : (
                      monthlyData.revenues.map((revenue) => (
                        <Card key={revenue.id} className="p-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">{revenue.description}</p>
                              <p className="text-sm text-muted-foreground">
                                {formatDate(revenue.date)} • {revenue.type}
                              </p>
                            </div>
                            <p className="font-bold text-success">
                              {formatCurrency(Number(revenue.value))}
                            </p>
                          </div>
                        </Card>
                      ))
                    )}
                  </div>
                </div>

                {/* Expenses */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-danger">
                    Despesas ({monthlyData.expenses.length})
                  </h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {monthlyData.expenses.length === 0 ? (
                      <p className="text-muted-foreground text-sm">Nenhuma despesa no período</p>
                    ) : (
                      monthlyData.expenses.map((expense) => (
                        <Card key={expense.id} className="p-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">{expense.description}</p>
                              <p className="text-sm text-muted-foreground">
                                {formatDate(expense.date)} • {expense.category}
                              </p>
                            </div>
                            <p className="font-bold text-danger">
                              {formatCurrency(Number(expense.value))}
                            </p>
                          </div>
                        </Card>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}