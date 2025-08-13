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
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mobile-financial-grid">
      {/* Receita Total */}
      <div className="bg-success-light rounded-lg sm:rounded-xl p-3 sm:p-4 border border-success/20">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="p-2 sm:p-3 bg-success rounded-lg sm:rounded-xl shadow-soft w-fit mx-auto sm:mx-0">
            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-success-foreground" />
          </div>
          <div className="text-center sm:text-right">
            <p className="text-xs sm:text-sm text-success font-medium">Receita Total</p>
            <p className="text-sm sm:text-xl font-bold text-success">
              R$ {totalRevenue.toLocaleString("pt-BR")}
            </p>
          </div>
        </div>
      </div>

      {/* Despesas Total */}
      <div className="bg-danger-light rounded-lg sm:rounded-xl p-3 sm:p-4 border border-danger/20">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="p-2 sm:p-3 bg-danger rounded-lg sm:rounded-xl shadow-soft w-fit mx-auto sm:mx-0">
            <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5 text-danger-foreground" />
          </div>
          <div className="text-center sm:text-right">
            <p className="text-xs sm:text-sm text-danger font-medium">Despesas Total</p>
            <p className="text-sm sm:text-xl font-bold text-danger">
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
          <div className={`p-2 sm:p-3 rounded-lg sm:rounded-xl shadow-soft w-fit mx-auto sm:mx-0 ${
            isProfit ? 'bg-info' : 'bg-warning'
          }`}>
            <DollarSign className={`w-4 h-4 sm:w-5 sm:h-5 ${
              isProfit ? 'text-info-foreground' : 'text-warning-foreground'
            }`} />
          </div>
          <div className="text-center sm:text-right">
            <p className={`text-xs sm:text-sm font-medium ${
              isProfit ? 'text-info' : 'text-warning'
            }`}>
              {isProfit ? 'Lucro Líquido' : 'Prejuízo'}
            </p>
            <p className={`text-sm sm:text-xl font-bold ${
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
          <div className="p-2 sm:p-3 bg-warning rounded-lg sm:rounded-xl shadow-soft w-fit mx-auto sm:mx-0">
            <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-warning-foreground" />
          </div>
          <div className="text-center sm:text-right">
            <p className="text-xs sm:text-sm text-warning font-medium">A Quitar</p>
            <p className="text-sm sm:text-xl font-bold text-warning">
              R$ {totalPendingBalance.toLocaleString("pt-BR")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}