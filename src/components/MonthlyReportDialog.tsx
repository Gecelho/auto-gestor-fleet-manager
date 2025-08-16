import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Loader2, Calendar, TrendingUp } from "lucide-react";
import { useMonthlyReport, usePeriodReport } from "@/hooks/useMonthlyReport";
import { displayCurrency, displayMileage } from "@/lib/formatters";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface MonthlyReportDialogProps {
  carId: string;
  carName?: string;
}

export function MonthlyReportDialog({ carId, carName }: MonthlyReportDialogProps) {
  const [open, setOpen] = useState(false);
  const { clickSound } = useSoundEffects();
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [startMonth, setStartMonth] = useState("");
  const [endMonth, setEndMonth] = useState("");

  const { data: monthlyData, isLoading: monthlyLoading } = useMonthlyReport(carId, selectedMonth, selectedYear);
  const { data: periodData, isLoading: periodLoading } = usePeriodReport(carId, startMonth, endMonth);

  // Função para truncar texto
  const truncateText = (text: string, maxLength: number = 30) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      clickSound(); // Som ao abrir relatório mensal
    }
    setOpen(newOpen);
    if (!newOpen) {
      setSelectedMonth("");
      setSelectedYear(new Date().getFullYear().toString());
      setStartMonth("");
      setEndMonth("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <FileText className="w-4 h-4 mr-2" />
          Relatório Mensal
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Relatório Financeiro{carName ? ` - ${carName}` : ''}</DialogTitle>
          <DialogDescription>
            Gere relatórios detalhados das receitas e despesas por mês ou período.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="monthly" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="monthly" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
              <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Relatório </span>Mensal
            </TabsTrigger>
            <TabsTrigger value="period" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
              <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Relatório por </span>Período
            </TabsTrigger>
          </TabsList>

          <TabsContent value="monthly" className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="month">Mês</Label>
                <Input
                  id="month"
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="year">Ano</Label>
                <Input
                  id="year"
                  type="number"
                  min="2020"
                  max="2030"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                />
              </div>
            </div>

            {monthlyLoading && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                <span>Gerando relatório...</span>
              </div>
            )}

            {monthlyData && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Card className="p-4 bg-success-light border-success/20">
                    <p className="text-sm text-success font-medium">Total Receitas</p>
                    <p className="text-xl font-bold text-success">
                      {displayCurrency(monthlyData.totalRevenue)}
                    </p>
                  </Card>
                  <Card className="p-4 bg-danger-light border-danger/20">
                    <p className="text-sm text-danger font-medium">Total Despesas</p>
                    <p className="text-xl font-bold text-danger">
                      {displayCurrency(monthlyData.totalExpenses)}
                    </p>
                  </Card>
                  <Card className={`p-4 ${monthlyData.netProfit >= 0 ? 'bg-info-light border-info/20' : 'bg-warning-light border-warning/20'}`}>
                    <p className={`text-sm font-medium ${monthlyData.netProfit >= 0 ? 'text-info' : 'text-warning'}`}>
                      {monthlyData.netProfit >= 0 ? 'Lucro Líquido' : 'Prejuízo'}
                    </p>
                    <p className={`text-xl font-bold ${monthlyData.netProfit >= 0 ? 'text-info' : 'text-warning'}`}>
                      {displayCurrency(Math.abs(monthlyData.netProfit))}
                    </p>
                  </Card>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {monthlyData.expenses.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-3 text-danger">Despesas ({monthlyData.expenses.length})</h3>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {monthlyData.expenses.map((expense) => (
                          <div key={expense.id} className="flex justify-between items-start p-3 bg-danger-light border border-danger/20 rounded-lg">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm" title={expense.description}>
                                {truncateText(expense.description)}
                              </p>
                              {expense.observation && (
                                <p className="text-xs text-muted-foreground mt-1" title={expense.observation}>
                                  {truncateText(expense.observation, 40)}
                                </p>
                              )}
                              <p className="text-xs text-muted-foreground mt-1">
                                {format(parseISO(expense.date), 'dd/MM/yyyy', { locale: ptBR })}
                                {expense.mileage && ` • KM: ${displayMileage(expense.mileage)}`}
                              </p>
                            </div>
                            <span className="font-bold text-danger text-sm ml-2">
                              {displayCurrency(expense.value)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {monthlyData.revenues.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-3 text-success">Receitas ({monthlyData.revenues.length})</h3>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {monthlyData.revenues.map((revenue) => (
                          <div key={revenue.id} className="flex justify-between items-start p-3 bg-success-light border border-success/20 rounded-lg">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm" title={revenue.description}>
                                {truncateText(revenue.description)}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {format(parseISO(revenue.date), 'dd/MM/yyyy', { locale: ptBR })} • {revenue.type}
                              </p>
                            </div>
                            <span className="font-bold text-success text-sm ml-2">
                              {displayCurrency(revenue.value)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="period" className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startMonth">Mês de Início</Label>
                <Input
                  id="startMonth"
                  type="month"
                  value={startMonth}
                  onChange={(e) => setStartMonth(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endMonth">Mês de Fim</Label>
                <Input
                  id="endMonth"
                  type="month"
                  value={endMonth}
                  onChange={(e) => setEndMonth(e.target.value)}
                />
              </div>
            </div>

            {periodLoading && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                <span>Gerando relatório...</span>
              </div>
            )}

            {periodData && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Card className="p-4 bg-success-light border-success/20">
                    <p className="text-sm text-success font-medium">Total Receitas</p>
                    <p className="text-xl font-bold text-success">
                      {displayCurrency(periodData.totalRevenue)}
                    </p>
                  </Card>
                  <Card className="p-4 bg-danger-light border-danger/20">
                    <p className="text-sm text-danger font-medium">Total Despesas</p>
                    <p className="text-xl font-bold text-danger">
                      {displayCurrency(periodData.totalExpenses)}
                    </p>
                  </Card>
                  <Card className={`p-4 ${periodData.netProfit >= 0 ? 'bg-info-light border-info/20' : 'bg-warning-light border-warning/20'}`}>
                    <p className={`text-sm font-medium ${periodData.netProfit >= 0 ? 'text-info' : 'text-warning'}`}>
                      {periodData.netProfit >= 0 ? 'Lucro Líquido' : 'Prejuízo'}
                    </p>
                    <p className={`text-xl font-bold ${periodData.netProfit >= 0 ? 'text-info' : 'text-warning'}`}>
                      {displayCurrency(Math.abs(periodData.netProfit))}
                    </p>
                  </Card>
                </div>

                {periodData.monthlyBreakdown && periodData.monthlyBreakdown.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3">Resumo por Mês</h3>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {periodData.monthlyBreakdown.map((month) => (
                        <div key={month.month} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                          <div>
                            <p className="font-medium">{month.monthName}</p>
                            <p className="text-sm text-muted-foreground">
                              Receitas: {displayCurrency(month.revenue)} • Despesas: {displayCurrency(month.expenses)}
                            </p>
                          </div>
                          <span className={`font-bold ${month.profit >= 0 ? 'text-success' : 'text-danger'}`}>
                            {month.profit >= 0 ? '+' : ''}{displayCurrency(month.profit)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}