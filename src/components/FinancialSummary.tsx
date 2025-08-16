import { TrendingUp, TrendingDown, DollarSign, AlertTriangle, Car } from "lucide-react";

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

  const stats = [
    {
      label: "Receitas",
      value: `R$ ${totalRevenue.toLocaleString("pt-BR")}`,
      icon: TrendingUp,
      color: "bg-green-50 text-green-600 border-green-200",
      iconBg: "bg-green-100",
      darkColor: "dark:bg-green-950 dark:text-green-400 dark:border-green-800",
      darkIconBg: "dark:bg-green-900"
    },
    {
      label: "Despesas",
      value: `R$ ${totalExpenses.toLocaleString("pt-BR")}`,
      icon: TrendingDown,
      color: "bg-red-50 text-red-600 border-red-200",
      iconBg: "bg-red-100",
      darkColor: "dark:bg-red-950 dark:text-red-400 dark:border-red-800",
      darkIconBg: "dark:bg-red-900"
    },
    {
      label: isProfit ? "Lucro" : "Prejuízo",
      value: `R$ ${Math.abs(netProfit).toLocaleString("pt-BR")}`,
      icon: DollarSign,
      color: isProfit 
        ? "bg-emerald-50 text-emerald-600 border-emerald-200" 
        : "bg-orange-50 text-orange-600 border-orange-200",
      iconBg: isProfit ? "bg-emerald-100" : "bg-orange-100",
      darkColor: isProfit 
        ? "dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800"
        : "dark:bg-orange-950 dark:text-orange-400 dark:border-orange-800",
      darkIconBg: isProfit ? "dark:bg-emerald-900" : "dark:bg-orange-900"
    },
    {
      label: "A Quitar",
      value: `R$ ${totalPendingBalance.toLocaleString("pt-BR")}`,
      icon: AlertTriangle,
      color: "bg-yellow-50 text-yellow-600 border-yellow-200",
      iconBg: "bg-yellow-100",
      darkColor: "dark:bg-yellow-950 dark:text-yellow-400 dark:border-yellow-800",
      darkIconBg: "dark:bg-yellow-900"
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div
            key={index}
            className={`
              relative overflow-hidden rounded-xl border p-3 sm:p-4 transition-all duration-200 hover:shadow-md
              ${stat.color} ${stat.darkColor}
            `}
          >
            {/* Layout vertical para mobile, horizontal para desktop */}
            <div className="flex flex-col items-center text-center space-y-1.5 sm:flex-row sm:items-center sm:justify-between sm:text-left sm:space-y-0">
              <div className="flex flex-col items-center space-y-1.5 sm:space-y-1 sm:items-start sm:flex-1">
                <div className={`
                  p-1.5 rounded-lg ${stat.iconBg} ${stat.darkIconBg} sm:hidden
                `}>
                  <Icon className="w-4 h-4" />
                </div>
                <p className="text-xs font-medium opacity-80 whitespace-nowrap">
                  {stat.label}
                </p>
                <p className="text-sm sm:text-base font-bold">
                  {stat.value}
                </p>
              </div>
              <div className={`
                hidden sm:block p-2 rounded-lg ${stat.iconBg} ${stat.darkIconBg}
              `}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}