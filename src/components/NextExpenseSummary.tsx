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
      <div className="mt-3 p-3 bg-muted/50 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">KM atual: {displayMileage(currentMileage)}</p>
            <p className="text-sm text-green-600 font-medium">Nenhuma despesa pendente</p>
          </div>
          <div onClick={(e) => e.stopPropagation()}>
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
  const isNear = nextExpense.is_near && !isOverdue;

  return (
    <div className={`mt-3 p-3 rounded-lg border ${
      isOverdue ? 'bg-red-50 border-red-200' :
      isNear ? 'bg-yellow-50 border-yellow-200' :
      'bg-muted/50 border-border'
    }`}>
      <div className="flex items-start gap-3">
        {/* Checkbox para marcar como completo */}
        <div onClick={(e) => e.stopPropagation()}>
          <Checkbox
            checked={nextExpense.is_completed}
            onCheckedChange={handleToggleCompletion}
            className="mt-0.5"
          />
        </div>

        <div className="flex-1 min-w-0">
          {/* KM atual */}
          <p className="text-sm text-muted-foreground mb-1">
            KM atual: {displayMileage(currentMileage)}
          </p>

          {/* Próxima despesa */}
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" title={nextExpense.description}>
                {nextExpense.description.length > 25 
                  ? nextExpense.description.substring(0, 25) + "..." 
                  : nextExpense.description
                }
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>KM: {displayMileage(nextExpense.target_mileage)}</span>
                <span className={`font-medium ${
                  isOverdue ? 'text-red-600' :
                  isNear ? 'text-yellow-600' : 
                  'text-green-600'
                }`}>
                  {isOverdue 
                    ? `Atrasado ${displayMileage(Math.abs(nextExpense.km_remaining))} km`
                    : `${displayMileage(nextExpense.km_remaining)} km`
                  }
                </span>
              </div>
            </div>
            <span className="text-sm font-bold text-danger ml-2">
              {displayCurrency(nextExpense.value)}
            </span>
          </div>
        </div>

        {/* Botão para abrir popup */}
        <div onClick={(e) => e.stopPropagation()}>
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