import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, AlertTriangle } from "lucide-react";

interface FinancialSummaryProps {
  totalRevenue: number;
  totalExpenses: number;
  totalPendingBalance: number;
  totalCars: number;
}

export function FinancialSummary({
  totalRevenue,
  totalExpenses,
  totalPendingBalance,
  totalCars
}: FinancialSummaryProps) {
  const netProfit = totalRevenue - totalExpenses;
  const isProfit = netProfit >= 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <Card className="p-4 bg-gradient-card">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-success-light rounded-lg">
            <TrendingUp className="w-5 h-5 text-success" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Receita Total</p>
            <p className="text-lg font-bold text-success">
              R$ {totalRevenue.toLocaleString("pt-BR")}
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-4 bg-gradient-card">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-danger-light rounded-lg">
            <TrendingDown className="w-5 h-5 text-danger" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Despesas Total</p>
            <p className="text-lg font-bold text-danger">
              R$ {totalExpenses.toLocaleString("pt-BR")}
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-4 bg-gradient-card">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${isProfit ? 'bg-success-light' : 'bg-danger-light'}`}>
            <DollarSign className={`w-5 h-5 ${isProfit ? 'text-success' : 'text-danger'}`} />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Lucro Líquido</p>
            <p className={`text-lg font-bold ${isProfit ? 'text-success' : 'text-danger'}`}>
              R$ {Math.abs(netProfit).toLocaleString("pt-BR")}
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-4 bg-gradient-card">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-warning-light rounded-lg">
            <AlertTriangle className="w-5 h-5 text-warning" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">A Quitar</p>
            <p className="text-lg font-bold text-warning">
              R$ {totalPendingBalance.toLocaleString("pt-BR")}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}