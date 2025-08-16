import { useState } from "react";
import { FutureExpensesPopup } from "./FutureExpensesPopup";
import { displayCurrency, displayMileage } from "@/lib/formatters";
import type { FutureExpense } from "@/hooks/useFutureExpenses";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { useIsMobile } from "@/hooks/use-mobile";

interface NextExpenseSummaryProps {
  nextExpense: FutureExpense | null;
  carId: string;
  carModel: string;
  carBrand: string;
  currentMileage: number;
}

export function NextExpenseSummary({ 
  nextExpense, 
  carId, 
  carModel, 
  carBrand, 
  currentMileage 
}: NextExpenseSummaryProps) {
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const { clickSound } = useSoundEffects();
  const isMobile = useIsMobile();

  const handleCardClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Evita que o clique se propague para o card do carro
    clickSound(); // Som ao clicar no card
    setIsPopupOpen(true);
  };

  if (!nextExpense) {
    return (
      <div 
        className={`bg-gray-50 dark:bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${isMobile ? 'p-1.5' : 'p-3'}`}
        onClick={handleCardClick}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <p className={`text-muted-foreground ${isMobile ? 'text-[9px] mb-0.5' : 'text-xs mb-1'}`}>KM atual: {displayMileage(currentMileage)}</p>
            <p className={`text-green-600 dark:text-green-400 font-medium ${isMobile ? 'text-[10px]' : 'text-sm'}`}>✓ Nenhuma despesa pendente</p>
          </div>
          <div onClick={(e) => e.stopPropagation()} className={`flex-shrink-0 ${isMobile ? 'w-3' : 'w-auto'}`}>
            <FutureExpensesPopup 
              carId={carId}
              carModel={carModel}
              carBrand={carBrand}
              currentMileage={currentMileage}
              open={isPopupOpen}
              onOpenChange={setIsPopupOpen}
            />
          </div>
        </div>
      </div>
    );
  }

  const isOverdue = nextExpense.km_remaining <= 0;
  const isNear = nextExpense.km_remaining > 0 && nextExpense.km_remaining <= 3000;
  const isDistant = nextExpense.km_remaining > 3000;

  return (
    <div 
      className={`rounded-lg cursor-pointer transition-all hover:shadow-sm ${isMobile ? 'p-1.5' : 'p-3'} ${
        isOverdue ? 'bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800' :
        isNear ? 'bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800' :
        'bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800'
      }`}
      onClick={handleCardClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className={`flex items-center justify-between ${isMobile ? 'mb-0.5' : 'mb-2'}`}>
            <p className={`text-muted-foreground ${isMobile ? 'text-[9px]' : 'text-xs'}`}>KM atual: {displayMileage(currentMileage)}</p>
            <span className={`font-semibold ${isMobile ? 'text-[9px]' : 'text-sm'} ${
              isOverdue ? 'text-red-600 dark:text-red-400' :
              isNear ? 'text-yellow-600 dark:text-yellow-400' :
              'text-green-600 dark:text-green-400'
            }`}>
              {displayCurrency(nextExpense.value)}
            </span>
          </div>

          <div className={`${isMobile ? 'space-y-0.5' : 'space-y-1'}`}>
            <p className={`font-medium truncate ${isMobile ? 'text-[10px]' : 'text-sm'} ${
              isOverdue ? 'text-red-700 dark:text-red-300' :
              isNear ? 'text-yellow-700 dark:text-yellow-300' :
              'text-green-700 dark:text-green-300'
            }`} title={nextExpense.description}>
              {nextExpense.description.length > 30 
                ? nextExpense.description.substring(0, 30) + "..." 
                : nextExpense.description
              }
            </p>
            <div className={`flex items-center text-xs ${isMobile ? 'gap-0.5' : 'gap-2'}`}>
              <span className={`bg-gray-100 dark:bg-gray-800 rounded text-muted-foreground font-medium ${isMobile ? 'px-0.5 py-0.5 text-[8px]' : 'px-2 py-1'}`}>
                KM: {displayMileage(nextExpense.target_mileage)}
              </span>
              <span className={`rounded font-semibold ${isMobile ? 'px-0.5 py-0.5 text-[8px]' : 'px-2 py-0.5 text-xs'} ${
                isOverdue ? 'bg-danger-light text-danger' :
                isNear ? 'bg-warning-light text-warning' : 
                'bg-success-light text-success'
              }`}>
                {isOverdue 
                  ? `⚠️ ${displayMileage(Math.abs(nextExpense.km_remaining))} km`
                  : `${displayMileage(nextExpense.km_remaining)} km`
                }
              </span>
            </div>
          </div>
        </div>

        {/* Botão compacto - bem pequeno e colado na direita */}
        <div onClick={(e) => e.stopPropagation()} className={`flex-shrink-0 ${isMobile ? 'w-4' : 'w-auto'}`}>
          <FutureExpensesPopup 
            carId={carId}
            carModel={carModel}
            carBrand={carBrand}
            currentMileage={currentMileage}
            open={isPopupOpen}
            onOpenChange={setIsPopupOpen}
          />
        </div>
      </div>
    </div>
  );
}