
import { Badge } from "@/components/ui/badge";
import { Car, DollarSign, TrendingUp, TrendingDown, AlertCircle } from "lucide-react";
import { NextExpenseSummary } from "./NextExpenseSummary";
import { useFutureExpenses, useCarCurrentMileage } from "@/hooks/useFutureExpenses";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { displayCurrency } from "@/lib/formatters";

interface CarCardProps {
  id: string;
  name: string;
  plate: string;
  image: string;
  purchaseValue: number;
  totalRevenue: number;
  totalExpenses: number;
  remainingBalance: number;
  status: "quitado" | "andamento" | "alugado";
  mileage: number;
  onClick: () => void;
}

export function CarCard({
  id,
  name,
  plate,
  image,
  purchaseValue,
  totalRevenue,
  totalExpenses,
  remainingBalance,
  status,
  mileage,
  onClick
}: CarCardProps) {
  const { clickSound } = useSoundEffects();
  const netProfit = totalRevenue - totalExpenses;
  const isProfit = netProfit > 0;
  
  // Buscar próxima despesa e quilometragem atual
  const { data: futureExpenses } = useFutureExpenses(id, 'pending');
  const { data: currentMileage } = useCarCurrentMileage(id);
  const nextExpense = futureExpenses?.[0] || null;
  
  const statusConfig = {
    quitado: { label: "Quitado", className: "bg-success text-success-foreground" },
    andamento: { label: "Em Andamento", className: "bg-warning text-warning-foreground" },
    alugado: { label: "Alugado", className: "bg-info text-info-foreground" }
  };

  // Use only valid images from Supabase or placeholder
  const imageUrl = image && image.includes('supabase') ? image : "https://images.unsplash.com/photo-1494976688731-30fc958eeb5e?w=400&h=300&fit=crop";

  return (
    <div 
      className="card-modern mobile-p-3 p-5 cursor-pointer group"
      onClick={() => {
        clickSound(); // Som ao clicar no card
        onClick();
      }}
    >
      {/* Header with Image and Status */}
      <div className="flex items-start space-x-3 sm:space-x-4 mb-4 sm:mb-6">
        <div className="w-14 h-14 sm:w-16 md:w-20 sm:h-16 md:h-20 rounded-lg sm:rounded-xl overflow-hidden bg-muted flex-shrink-0 shadow-soft">
          <img 
            src={imageUrl} 
            alt={name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = "https://images.unsplash.com/photo-1494976688731-30fc958eeb5e?w=400&h=300&fit=crop";
            }}
          />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2 sm:mb-3">
            <div className="min-w-0 flex-1 mr-2 sm:mr-3">
              <h3 className="font-bold text-card-foreground truncate text-sm sm:text-base md:text-lg">{name}</h3>
              <p className="text-xs sm:text-sm text-muted-foreground font-medium">{plate}</p>
            </div>
            <Badge className={`${statusConfig[status].className} text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md sm:rounded-lg shadow-sm flex-shrink-0`}>
              {statusConfig[status].label}
            </Badge>
          </div>
          
          {/* Purchase Value */}
          <div className="flex items-center text-muted-foreground">
            <DollarSign className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
            <span className="text-xs sm:text-sm font-semibold">
              {displayCurrency(purchaseValue)}
            </span>
          </div>
        </div>
      </div>
      
      {/* Financial Summary */}
      <div className="grid grid-cols-3 gap-1.5 sm:gap-2 md:gap-3 mb-4 sm:mb-6">
        <div className="bg-success-light rounded-md sm:rounded-lg p-1.5 sm:p-2 md:p-3 text-center border border-success/20">
          <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-success mx-auto mb-0.5 sm:mb-1" />
          <p className="text-xs mobile-text-xs text-success font-medium">Receita</p>
          <p className="text-xs mobile-text-xs sm:text-sm font-bold text-success truncate">
            {displayCurrency(totalRevenue)}
          </p>
        </div>
        
        <div className="bg-danger-light rounded-md sm:rounded-lg p-1.5 sm:p-2 md:p-3 text-center border border-danger/20">
          <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4 text-danger mx-auto mb-0.5 sm:mb-1" />
          <p className="text-xs mobile-text-xs text-danger font-medium">Gastos</p>
          <p className="text-xs mobile-text-xs sm:text-sm font-bold text-danger truncate">
            {displayCurrency(totalExpenses)}
          </p>
        </div>
        
        <div className={`rounded-md sm:rounded-lg p-1.5 sm:p-2 md:p-3 text-center border ${
          isProfit 
            ? 'bg-info-light border-info/20' 
            : 'bg-warning-light border-warning/20'
        }`}>
          <AlertCircle className={`w-3 h-3 sm:w-4 sm:h-4 mx-auto mb-0.5 sm:mb-1 ${
            isProfit ? 'text-info' : 'text-warning'
          }`} />
          <p className={`text-xs mobile-text-xs font-medium ${
            isProfit ? 'text-info' : 'text-warning'
          }`}>
            {isProfit ? 'Lucro' : 'Prejuízo'}
          </p>
          <p className={`text-xs mobile-text-xs sm:text-sm font-bold truncate ${
            isProfit ? 'text-info' : 'text-warning'
          }`}>
            {displayCurrency(Math.abs(netProfit))}
          </p>
        </div>
      </div>
      
      {/* Next Expense */}
      <div className="border-t border-border pt-3 sm:pt-4">
        <NextExpenseSummary
          nextExpense={nextExpense}
          carId={id}
          carModel={name}
          carBrand={name}
          currentMileage={currentMileage || 0}
        />
      </div>
    </div>
  );
}
