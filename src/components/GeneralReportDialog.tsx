import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { FileBarChart, Loader2, Calendar, TrendingUp, Car } from "lucide-react";
import { useGeneralReport, useGeneralPeriodReport } from "@/hooks/useGeneralReport";
import { useCars } from "@/hooks/useCars";
import { displayCurrency } from "@/lib/formatters";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function GeneralReportDialog() {
  const [open, setOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [startMonth, setStartMonth] = useState("");
  const [endMonth, setEndMonth] = useState("");
  const [selectedCarIds, setSelectedCarIds] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(true);

  const { data: cars } = useCars();
  const { data: monthlyData, isLoading: monthlyLoading } = useGeneralReport(
    selectAll ? [] : selectedCarIds, 
    selectedMonth,
    selectedYear
  );
  const { data: periodData, isLoading: periodLoading } = useGeneralPeriodReport(
    selectAll ? [] : selectedCarIds,
    startMonth,
    endMonth
  );

  // Os relatórios são gerados automaticamente quando os parâmetros são preenchidos

  const handleCarSelection = (carId: string, checked: boolean) => {
    if (checked) {
      setSelectedCarIds(prev => [...prev, carId]);
    } else {
      setSelectedCarIds(prev => prev.filter(id => id !== carId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      setSelectedCarIds([]);
    } else {
      setSelectedCarIds(cars?.map(car => car.id) || []);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setSelectedMonth("");
      setSelectedYear(new Date().getFullYear().toString());
      setStartMonth("");
      setEndMonth("");
      setSelectedCarIds([]);
      setSelectAll(true);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <FileBarChart className="w-4 h-4 mr-2" />
          Relatório Geral
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
        <DialogHeader>
          <DialogTitle>Relatório Geral da Frota</DialogTitle>
          <DialogDescription>
            Gere relatórios consolidados de todos os carros ou carros selecionados.
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

            {/* Car Selection */}
            <div className="space-y-3">
              <Label>Selecionar Carros</Label>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="select-all"
                  checked={selectAll}
                  onCheckedChange={handleSelectAll}
                />
                <Label htmlFor="select-all" className="font-medium">
                  Todos os carros
                </Label>
              </div>
              {!selectAll && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-32 overflow-y-auto p-2 border rounded-lg">
                  {cars?.map((car) => (
                    <div key={car.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={car.id}
                        checked={selectedCarIds.includes(car.id)}
                        onCheckedChange={(checked) => handleCarSelection(car.id, checked as boolean)}
                      />
                      <Label htmlFor={car.id} className="text-sm truncate">
                        {car.name}
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {monthlyLoading && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                <span>Gerando relatório...</span>
              </div>
            )}

            {monthlyData && (
              <div className="space-y-6">
                {/* Resumo Geral */}
                <div>
                  <h3 className="font-semibold mb-3 text-lg">Resumo Geral da Frota</h3>
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
                </div>

                {/* Detalhes por Carro */}
                {monthlyData.carBreakdown && monthlyData.carBreakdown.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <Car className="w-5 h-5" />
                      Detalhes por Carro
                    </h3>
                    {monthlyData.carBreakdown.map((car) => (
                      <div key={car.carId} className="border rounded-lg p-4 bg-card">
                        <h4 className="font-semibold text-base mb-3">{car.carName}</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="text-center p-3 bg-success-light border border-success/20 rounded-lg">
                            <p className="text-xs text-success font-medium">Receitas</p>
                            <p className="text-lg font-bold text-success">
                              {displayCurrency(car.revenue)}
                            </p>
                          </div>
                          <div className="text-center p-3 bg-danger-light border border-danger/20 rounded-lg">
                            <p className="text-xs text-danger font-medium">Despesas</p>
                            <p className="text-lg font-bold text-danger">
                              {displayCurrency(car.expenses)}
                            </p>
                          </div>
                          <div className={`text-center p-3 border rounded-lg ${car.profit >= 0 ? 'bg-info-light border-info/20' : 'bg-warning-light border-warning/20'}`}>
                            <p className={`text-xs font-medium ${car.profit >= 0 ? 'text-info' : 'text-warning'}`}>
                              {car.profit >= 0 ? 'Lucro' : 'Prejuízo'}
                            </p>
                            <p className={`text-lg font-bold ${car.profit >= 0 ? 'text-info' : 'text-warning'}`}>
                              {car.profit >= 0 ? '+' : ''}{displayCurrency(Math.abs(car.profit))}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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

            {/* Car Selection for Period */}
            <div className="space-y-3">
              <Label>Selecionar Carros</Label>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="select-all-period"
                  checked={selectAll}
                  onCheckedChange={handleSelectAll}
                />
                <Label htmlFor="select-all-period" className="font-medium">
                  Todos os carros
                </Label>
              </div>
              {!selectAll && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-32 overflow-y-auto p-2 border rounded-lg">
                  {cars?.map((car) => (
                    <div key={car.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`period-${car.id}`}
                        checked={selectedCarIds.includes(car.id)}
                        onCheckedChange={(checked) => handleCarSelection(car.id, checked as boolean)}
                      />
                      <Label htmlFor={`period-${car.id}`} className="text-sm truncate">
                        {car.name}
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {periodLoading && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                <span>Gerando relatório...</span>
              </div>
            )}

            {periodData && (
              <div className="space-y-6">
                {/* Resumo Geral do Período */}
                <div>
                  <h3 className="font-semibold mb-3 text-lg">Resumo Geral do Período</h3>
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
                </div>

                {/* Resumo por Mês */}
                {periodData.monthlyBreakdown && periodData.monthlyBreakdown.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3 text-lg">Resumo por Mês</h3>
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

                {/* Detalhes por Carro */}
                {periodData.carBreakdown && periodData.carBreakdown.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <Car className="w-5 h-5" />
                      Detalhes por Carro
                    </h3>
                    {periodData.carBreakdown.map((car) => (
                      <div key={car.carId} className="border rounded-lg p-4 bg-card space-y-4">
                        <h4 className="font-semibold text-base">{car.carName}</h4>
                        
                        {/* Resumo do Carro */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="text-center p-3 bg-success-light border border-success/20 rounded-lg">
                            <p className="text-xs text-success font-medium">Receitas</p>
                            <p className="text-lg font-bold text-success">
                              {displayCurrency(car.revenue)}
                            </p>
                          </div>
                          <div className="text-center p-3 bg-danger-light border border-danger/20 rounded-lg">
                            <p className="text-xs text-danger font-medium">Despesas</p>
                            <p className="text-lg font-bold text-danger">
                              {displayCurrency(car.expenses)}
                            </p>
                          </div>
                          <div className={`text-center p-3 border rounded-lg ${car.profit >= 0 ? 'bg-info-light border-info/20' : 'bg-warning-light border-warning/20'}`}>
                            <p className={`text-xs font-medium ${car.profit >= 0 ? 'text-info' : 'text-warning'}`}>
                              {car.profit >= 0 ? 'Lucro' : 'Prejuízo'}
                            </p>
                            <p className={`text-lg font-bold ${car.profit >= 0 ? 'text-info' : 'text-warning'}`}>
                              {car.profit >= 0 ? '+' : ''}{displayCurrency(Math.abs(car.profit))}
                            </p>
                          </div>
                        </div>

                        {/* Resumo Mensal do Carro */}
                        {car.monthlyBreakdown && car.monthlyBreakdown.length > 0 && (
                          <div>
                            <h5 className="font-medium text-sm mb-2 text-muted-foreground">Resumo por Mês - {car.carName}</h5>
                            <div className="space-y-1 max-h-40 overflow-y-auto">
                              {car.monthlyBreakdown.map((month) => (
                                <div key={month.month} className="flex justify-between items-center p-2 bg-muted/50 rounded text-sm">
                                  <div>
                                    <p className="font-medium text-xs">{month.monthName}</p>
                                    <p className="text-xs text-muted-foreground">
                                      R: {displayCurrency(month.revenue)} • D: {displayCurrency(month.expenses)}
                                    </p>
                                  </div>
                                  <span className={`font-bold text-xs ${month.profit >= 0 ? 'text-success' : 'text-danger'}`}>
                                    {month.profit >= 0 ? '+' : ''}{displayCurrency(month.profit)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
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