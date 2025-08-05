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
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {/* Receita Total */}
      <div className="bg-success-light rounded-lg sm:rounded-xl p-3 sm:p-4 border border-success/20">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="p-1.5 sm:p-2 bg-success rounded-md sm:rounded-lg shadow-lg w-fit">
            <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-success-foreground" />
          </div>
          <div className="text-left sm:text-right">
            <p className="text-xs text-success font-medium">Receita Total</p>
            <p className="text-sm sm:text-lg font-bold text-success">
              R$ {totalRevenue.toLocaleString("pt-BR")}
            </p>
          </div>
        </div>
      </div>

      {/* Despesas Total */}
      <div className="bg-danger-light rounded-lg sm:rounded-xl p-3 sm:p-4 border border-danger/20">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="p-1.5 sm:p-2 bg-danger rounded-md sm:rounded-lg shadow-lg w-fit">
            <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4 text-danger-foreground" />
          </div>
          <div className="text-left sm:text-right">
            <p className="text-xs text-danger font-medium">Despesas Total</p>
            <p className="text-sm sm:text-lg font-bold text-danger">
              R$ {totalExpenses.toLocaleString("pt-BR")}
            </p>
          </div>
        </div>
      </div>

      {/* Lucro Líquido */}
      <div className={`rounded-lg sm:rounded-xl p-3 sm:p-4 border ${
        isProfit 
          ? 'bg-info-light border-info/20' 
          : 'bg-warning-light border-warning/20'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className={`p-1.5 sm:p-2 rounded-md sm:rounded-lg shadow-lg w-fit ${
            isProfit ? 'bg-info' : 'bg-warning'
          }`}>
            <DollarSign className={`w-3 h-3 sm:w-4 sm:h-4 ${
              isProfit ? 'text-info-foreground' : 'text-warning-foreground'
            }`} />
          </div>
          <div className="text-left sm:text-right">
            <p className={`text-xs font-medium ${
              isProfit ? 'text-info' : 'text-warning'
            }`}>
              {isProfit ? 'Lucro Líquido' : 'Prejuízo'}
            </p>
            <p className={`text-sm sm:text-lg font-bold ${
              isProfit ? 'text-info' : 'text-warning'
            }`}>
              R$ {Math.abs(netProfit).toLocaleString("pt-BR")}
            </p>
          </div>
        </div>
      </div>

      {/* A Quitar */}
      <div className="bg-warning-light rounded-lg sm:rounded-xl p-3 sm:p-4 border border-warning/20">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="p-1.5 sm:p-2 bg-warning rounded-md sm:rounded-lg shadow-lg w-fit">
            <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4 text-warning-foreground" />
          </div>
          <div className="text-left sm:text-right">
            <p className="text-xs text-warning font-medium">A Quitar</p>
            <p className="text-sm sm:text-lg font-bold text-warning">
              R$ {totalPendingBalance.toLocaleString("pt-BR")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}