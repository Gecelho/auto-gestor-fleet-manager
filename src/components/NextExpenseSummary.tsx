import { Checkbox } from "@/components/ui/checkbox";
import { FutureExpensesPopup } from "./FutureExpensesPopup";
import { useToggleFutureExpenseCompletion } from "@/hooks/useFutureExpenses";
import { displayCurrency, displayMileage } from "@/lib/formatters";
import type { FutureExpense } from "@/hooks/useFutureExpenses";

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
  const toggleCompletionMutation = useToggleFutureExpenseCompletion();

  const handleToggleCompletion = (e: React.MouseEvent) => {
    e.stopPropagation(); // Evita que o clique se propague para o card do carro
    if (nextExpense) {
      toggleCompletionMutation.mutate({
        futureExpenseId: nextExpense.future_expense_id,
        isCompleted: !nextExpense.is_completed
      });
    }
  };

  if (!nextExpense) {
    return (
      <div className="bg-muted rounded-md sm:rounded-lg p-2 sm:p-3">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground mb-0.5 sm:mb-1">KM atual: {displayMileage(currentMileage)}</p>
            <p className="text-xs sm:text-sm text-success font-semibold">✓ Nenhuma despesa pendente</p>
          </div>
          <div onClick={(e) => e.stopPropagation()} className="flex-shrink-0 ml-2">
            <FutureExpensesPopup 
              carId={carId}
              carModel={carModel}
              carBrand={carBrand}
              currentMileage={currentMileage}
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
    <div className={`rounded-md sm:rounded-lg p-2 sm:p-3 ${
      isOverdue ? 'bg-danger-light border border-danger/20' :
      isNear ? 'bg-warning-light border border-warning/20' :
      'bg-success-light border border-success/20'
    }`}>
      <div className="flex items-start gap-2 sm:gap-3">
        {/* Checkbox compacto */}
        <div onClick={(e) => e.stopPropagation()} className="flex-shrink-0 mt-0.5">
          <Checkbox
            checked={nextExpense.is_completed}
            onCheckedChange={handleToggleCompletion}
            className="w-3 h-3 sm:w-4 sm:h-4"
          />
        </div>

        <div className="flex-1 min-w-0">
          {/* Info compacta - Mobile First */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0 mb-1 sm:mb-1">
            <p className="text-xs text-muted-foreground">KM atual: {displayMileage(currentMileage)}</p>
            <span className="text-xs sm:text-sm font-bold text-danger">
              {displayCurrency(nextExpense.value)}
            </span>
          </div>

          {/* Próxima despesa - Mobile Layout */}
          <div className="space-y-1 sm:space-y-0">
            <p className="text-xs sm:text-sm font-semibold text-card-foreground truncate" title={nextExpense.description}>
              <span className="sm:hidden">
                {nextExpense.description.length > 15 
                  ? nextExpense.description.substring(0, 15) + "..." 
                  : nextExpense.description
                }
              </span>
              <span className="hidden sm:inline">
                {nextExpense.description.length > 20 
                  ? nextExpense.description.substring(0, 20) + "..." 
                  : nextExpense.description
                }
              </span>
            </p>
            <div className="flex flex-wrap items-center gap-1 sm:gap-2 text-xs">
              <span className="bg-muted px-1.5 sm:px-2 py-0.5 rounded text-xs font-medium text-muted-foreground">
                KM: {displayMileage(nextExpense.target_mileage)}
              </span>
              <span className={`px-1.5 sm:px-2 py-0.5 rounded text-xs font-semibold ${
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

        {/* Botão compacto */}
        <div onClick={(e) => e.stopPropagation()} className="flex-shrink-0">
          <FutureExpensesPopup 
            carId={carId}
            carModel={carModel}
            carBrand={carBrand}
            currentMileage={currentMileage}
          />
        </div>
      </div>
    </div>
  );
}