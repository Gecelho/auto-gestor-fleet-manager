
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { FileText, Loader2 } from "lucide-react";
import { useMonthlyReport } from "@/hooks/useMonthlyReport";

interface MonthlyReportDialogProps {
  carId: string;
}

export function MonthlyReportDialog({ carId }: MonthlyReportDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

  const { data: reportData, isLoading, refetch } = useMonthlyReport(carId, selectedMonth, selectedYear);

  const handleGenerateReport = () => {
    if (selectedMonth && selectedYear) {
      refetch();
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setSelectedMonth("");
      setSelectedYear(new Date().getFullYear().toString());
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Relatório Mensal</DialogTitle>
          <DialogDescription>
            Gere um relatório detalhado das receitas e despesas do mês selecionado.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
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

          <Button 
            onClick={handleGenerateReport} 
            disabled={!selectedMonth || !selectedYear || isLoading}
            className="w-full"
          >
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Gerar Relatório
          </Button>

          {reportData && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card className="p-4">
                  <p className="text-sm text-muted-foreground">Total Receitas</p>
                  <p className="text-xl font-bold text-success">
                    R$ {reportData.totalRevenue.toLocaleString("pt-BR")}
                  </p>
                </Card>
                <Card className="p-4">
                  <p className="text-sm text-muted-foreground">Total Despesas</p>
                  <p className="text-xl font-bold text-danger">
                    R$ {reportData.totalExpenses.toLocaleString("pt-BR")}
                  </p>
                </Card>
              </div>

              <Card className="p-4">
                <p className="text-sm text-muted-foreground">Lucro Líquido</p>
                <p className={`text-xl font-bold ${reportData.netProfit >= 0 ? 'text-success' : 'text-danger'}`}>
                  R$ {Math.abs(reportData.netProfit).toLocaleString("pt-BR")}
                </p>
              </Card>

              {reportData.expenses.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Despesas</h3>
                  <div className="space-y-2">
                    {reportData.expenses.map((expense) => (
                      <div key={expense.id} className="flex justify-between items-center p-2 bg-muted rounded">
                        <div>
                          <p className="font-medium">{expense.description}</p>
                          <p className="text-sm text-muted-foreground">{expense.category}</p>
                        </div>
                        <span className="font-bold text-danger">
                          R$ {Number(expense.value).toLocaleString("pt-BR")}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {reportData.revenues.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Receitas</h3>
                  <div className="space-y-2">
                    {reportData.revenues.map((revenue) => (
                      <div key={revenue.id} className="flex justify-between items-center p-2 bg-muted rounded">
                        <div>
                          <p className="font-medium">{revenue.description}</p>
                          <p className="text-sm text-muted-foreground">{revenue.type}</p>
                        </div>
                        <span className="font-bold text-success">
                          R$ {Number(revenue.value).toLocaleString("pt-BR")}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end pt-4">
            <Button variant="outline" onClick={() => handleOpenChange(false)}>
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
