
import { Badge } from "@/components/ui/badge";
import { Car, TrendingUp, TrendingDown, AlertCircle, ChevronRight } from "lucide-react";
import { NextExpenseSummary } from "./NextExpenseSummary";
import { useFutureExpenses, useCarCurrentMileage } from "@/hooks/useFutureExpenses";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { displayCurrency, displayCompactCurrency } from "@/lib/formatters";
import { useIsMobile } from "@/hooks/use-mobile";
import { CarIcon } from "./CarIcon";

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
  const isMobile = useIsMobile();
  const netProfit = totalRevenue - totalExpenses;
  const isProfit = netProfit > 0;
  
  // Buscar próxima despesa e quilometragem atual
  const { data: futureExpenses } = useFutureExpenses(id, 'pending');
  const { data: currentMileage } = useCarCurrentMileage(id);
  const nextExpense = futureExpenses?.[0] || null;
  
  const statusConfig = {
    quitado: { 
      label: "Quitado", 
      className: "bg-green-100 text-green-700 border-green-200",
      darkClassName: "dark:bg-green-900 dark:text-green-300 dark:border-green-800"
    },
    andamento: { 
      label: "Em Andamento", 
      className: "bg-yellow-100 text-yellow-700 border-yellow-200",
      darkClassName: "dark:bg-yellow-900 dark:text-yellow-300 dark:border-yellow-800"
    },
    alugado: { 
      label: "Alugado", 
      className: "bg-blue-100 text-blue-700 border-blue-200",
      darkClassName: "dark:bg-blue-900 dark:text-blue-300 dark:border-blue-800"
    }
  };

  // Check if we have a valid image
  const hasValidImage = image && image.includes('supabase');
  const imageUrl = hasValidImage ? image : "https://images.unsplash.com/photo-1494976688731-30fc958eeb5e?w=400&h=300&fit=crop";

  return (
    <div 
      className={`group relative bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 cursor-pointer transition-all duration-200 hover:shadow-lg hover:shadow-gray-200/50 dark:hover:shadow-gray-900/50 hover:-translate-y-1 ${isMobile ? 'p-3' : 'p-6'}`}
      onClick={() => {
        clickSound(); // Som ao clicar no card
        onClick();
      }}
    >
      {/* Header */}
      <div className={`flex items-start justify-between ${isMobile ? 'mb-2' : 'mb-4'}`}>
        <div className={`flex items-start flex-1 min-w-0 ${isMobile ? 'space-x-2' : 'space-x-3'}`}>
          <div className={`rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 flex-shrink-0 flex items-center justify-center ${isMobile ? 'w-14 h-14' : 'w-12 h-12'}`}>
            {hasValidImage ? (
              <img 
                src={imageUrl} 
                alt={name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "https://images.unsplash.com/photo-1494976688731-30fc958eeb5e?w-400&h=300&fit=crop";
                }}
              />
            ) : (
              <CarIcon 
                size={isMobile ? 28 : 24} 
                className="text-gray-400 dark:text-gray-500 group-hover:scale-105 transition-transform duration-300" 
              />
            )}
          </div>
          <div className={`min-w-0 flex-1 flex flex-col justify-between ${isMobile ? 'h-14' : 'h-12'}`}>
            <div>
              <h3 className={`font-semibold text-gray-900 dark:text-gray-100 truncate leading-tight ${isMobile ? 'text-sm' : 'text-base'}`}>
                {name}
              </h3>
              <p className={`text-gray-500 dark:text-gray-400 font-medium leading-tight ${isMobile ? 'text-xs' : 'text-sm'}`}>
                {plate}
              </p>
            </div>
            <div className="text-gray-600 dark:text-gray-400 flex items-end">
              <span className={`font-semibold ${isMobile ? 'text-xs' : 'text-sm'}`}>
                {isMobile ? displayCompactCurrency(purchaseValue) : displayCurrency(purchaseValue)}
              </span>
            </div>
          </div>
        </div>
        
        <div className={`flex items-center flex-shrink-0 ${isMobile ? 'space-x-0.5' : 'space-x-2'}`}>
          <Badge className={`
            border font-medium ${isMobile ? 'text-[9px] px-1.5 py-0.5 rounded' : 'text-xs px-2 py-1 rounded-lg'}
            ${statusConfig[status].className} ${statusConfig[status].darkClassName}
          `}>
            {statusConfig[status].label}
          </Badge>
          <ChevronRight className={`text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors ${isMobile ? 'w-2.5 h-2.5' : 'w-4 h-4'}`} />
        </div>
      </div>
      
      {/* Financial Summary */}
      <div className={`grid grid-cols-3 ${isMobile ? 'gap-0.5 mb-2' : 'gap-3 mb-4'}`}>
        <div className={`bg-green-50 dark:bg-green-950 rounded-lg text-center border border-green-200 dark:border-green-800 min-w-0 ${isMobile ? 'p-1.5' : 'p-3'}`}>
          <TrendingUp className={`text-green-600 dark:text-green-400 mx-auto ${isMobile ? 'w-3 h-3 mb-1' : 'w-4 h-4 mb-1'}`} />
          <p className={`text-green-600 dark:text-green-400 font-medium leading-tight ${isMobile ? 'text-[9px]' : 'text-xs'}`}>Receita</p>
          <p className={`font-bold leading-tight truncate ${isMobile ? 'text-[9px] px-0' : 'text-xs px-0.5'} text-green-700 dark:text-green-300`} title={displayCurrency(totalRevenue)}>
            {isMobile ? displayCompactCurrency(totalRevenue) : displayCurrency(totalRevenue)}
          </p>
        </div>
        
        <div className={`bg-red-50 dark:bg-red-950 rounded-lg text-center border border-red-200 dark:border-red-800 min-w-0 ${isMobile ? 'p-1.5' : 'p-3'}`}>
          <TrendingDown className={`text-red-600 dark:text-red-400 mx-auto ${isMobile ? 'w-3 h-3 mb-1' : 'w-4 h-4 mb-1'}`} />
          <p className={`text-red-600 dark:text-red-400 font-medium leading-tight ${isMobile ? 'text-[9px]' : 'text-xs'}`}>Gastos</p>
          <p className={`font-bold leading-tight truncate ${isMobile ? 'text-[9px] px-0' : 'text-xs px-0.5'} text-red-700 dark:text-red-300`} title={displayCurrency(totalExpenses)}>
            {isMobile ? displayCompactCurrency(totalExpenses) : displayCurrency(totalExpenses)}
          </p>
        </div>
        
        <div className={`rounded-lg text-center border min-w-0 ${isMobile ? 'p-1.5' : 'p-3'} ${
          isProfit 
            ? 'bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800' 
            : 'bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800'
        }`}>
          <AlertCircle className={`mx-auto ${isMobile ? 'w-3 h-3 mb-1' : 'w-4 h-4 mb-1'} ${
            isProfit 
              ? 'text-emerald-600 dark:text-emerald-400' 
              : 'text-orange-600 dark:text-orange-400'
          }`} />
          <p className={`font-medium leading-tight ${isMobile ? 'text-[9px]' : 'text-xs'} ${
            isProfit 
              ? 'text-emerald-600 dark:text-emerald-400' 
              : 'text-orange-600 dark:text-orange-400'
          }`}>
            {isProfit ? 'Lucro' : 'Prejuízo'}
          </p>
          <p className={`font-bold leading-tight truncate ${isMobile ? 'text-[9px] px-0' : 'text-xs px-0.5'} ${
            isProfit 
              ? 'text-emerald-700 dark:text-emerald-300' 
              : 'text-orange-700 dark:text-orange-300'
          }`} title={displayCurrency(Math.abs(netProfit))}>
            {isMobile ? displayCompactCurrency(Math.abs(netProfit)) : displayCurrency(Math.abs(netProfit))}
          </p>
        </div>
      </div>
      
      {/* Next Expense */}
      <div className={`border-t border-gray-200 dark:border-gray-800 ${isMobile ? 'pt-2' : 'pt-4'}`}>
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
