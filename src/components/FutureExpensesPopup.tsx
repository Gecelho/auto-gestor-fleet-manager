import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronDown, Loader2, Edit } from "lucide-react";
import { useFutureExpenses, useToggleFutureExpenseCompletion, useToggleExpensePayment, useUpdateCarMileage, useCarCurrentMileage } from "@/hooks/useFutureExpenses";
import { displayCurrency, displayMileage } from "@/lib/formatters";

interface FutureExpensesPopupProps {
  carId: string;
  carModel: string;
  carBrand: string;
  currentMileage: number;
}

export function FutureExpensesPopup({ carId, carModel, carBrand, currentMileage }: FutureExpensesPopupProps) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [editingMileage, setEditingMileage] = useState(false);
  
  // Buscar quilometragem atual real
  const { data: realCurrentMileage } = useCarCurrentMileage(carId);
  const actualMileage = realCurrentMileage || currentMileage || 0;
  const [newMileage, setNewMileage] = useState(actualMileage.toString());

  const { data: futureExpenses, isLoading } = useFutureExpenses(carId, filter);
  const toggleCompletionMutation = useToggleFutureExpenseCompletion();
  const togglePaymentMutation = useToggleExpensePayment();
  const updateMileageMutation = useUpdateCarMileage();

  const handleToggleCompletion = (futureExpenseId: string, currentStatus: boolean, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    toggleCompletionMutation.mutate({
      futureExpenseId,
      isCompleted: !currentStatus
    });
  };

  const handleTogglePayment = (expenseId: string, currentStatus: boolean, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    togglePaymentMutation.mutate({
      expenseId,
      isPaid: !currentStatus
    });
  };

  const handleUpdateMileage = () => {
    const mileage = parseInt(newMileage);
    if (mileage && mileage !== actualMileage) {
      updateMileageMutation.mutate({
        carId,
        mileage
      }, {
        onSuccess: () => {
          setEditingMileage(false);
        }
      });
    } else {
      setEditingMileage(false);
    }
  };

  const handleCancelMileageEdit = () => {
    setNewMileage(actualMileage.toString());
    setEditingMileage(false);
  };

  // Função para determinar a cor baseada na quilometragem restante
  const getStatusColor = (kmRemaining: number, isCompleted: boolean) => {
    if (isCompleted) return 'green'; // Verde para completo
    if (kmRemaining <= 0) return 'red'; // Vermelho para atrasado
    if (kmRemaining <= 3000) return 'yellow'; // Amarelo para próximo (≤ 3000km)
    return 'green'; // Verde para distante (> 3000km)
  };

  // Função para obter as classes CSS baseadas na cor
  const getStatusClasses = (color: string) => {
    switch (color) {
      case 'red':
        return 'bg-danger-light border-danger/20';
      case 'yellow':
        return 'bg-warning-light border-warning/20';
      case 'green':
        return 'bg-success-light border-success/20';
      default:
        return 'bg-card border-border';
    }
  };

  // Função para obter a cor do texto baseada na quilometragem
  const getTextColor = (kmRemaining: number, isCompleted: boolean) => {
    if (isCompleted) return 'text-success';
    if (kmRemaining <= 0) return 'text-danger';
    if (kmRemaining <= 3000) return 'text-warning';
    return 'text-success';
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-6 w-6">
          <ChevronDown className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Despesas Futuras - {carBrand} {carModel}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Seção de quilometragem atual */}
          <div className="border rounded-lg p-4 bg-muted/50">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Quilometragem Atual</Label>
                {editingMileage ? (
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      type="number"
                      value={newMileage}
                      onChange={(e) => setNewMileage(e.target.value)}
                      className="w-32 h-8"
                      placeholder="KM atual"
                    />
                    <Button 
                      size="sm" 
                      onClick={handleUpdateMileage}
                      disabled={updateMileageMutation.isPending}
                    >
                      {updateMileageMutation.isPending && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                      Salvar
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={handleCancelMileageEdit}
                    >
                      Cancelar
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-lg font-bold">{displayMileage(actualMileage)} km</span>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6"
                      onClick={() => setEditingMileage(true)}
                    >
                      <Edit className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Filtro */}
          <div className="flex items-center gap-2">
            <Label htmlFor="filter">Filtrar por:</Label>
            <Select value={filter} onValueChange={(value: 'all' | 'pending' | 'completed') => setFilter(value)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
                <SelectItem value="completed">Pagos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Lista de despesas futuras */}
          <div className="space-y-3">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : futureExpenses?.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Nenhuma despesa futura encontrada
              </p>
            ) : (
              futureExpenses?.map((expense) => {
                const statusColor = getStatusColor(expense.km_remaining, expense.is_completed);
                const statusClasses = getStatusClasses(statusColor);
                
                return (
                <div 
                  key={expense.future_expense_id} 
                  className={`border rounded-lg p-4 ${statusClasses}`}
                >
                  <div className="flex items-start gap-3">
                    {/* Checkbox para marcar como completo */}
                    <div onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={expense.is_completed}
                        onCheckedChange={() => handleToggleCompletion(expense.future_expense_id, expense.is_completed)}
                        className="mt-1"
                      />
                    </div>

                    <div className="flex-1 space-y-2">
                      {/* Título e valor */}
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{expense.description}</h4>
                        <span className="font-bold text-danger">
                          {displayCurrency(expense.value)}
                        </span>
                      </div>

                      {/* Informações de quilometragem */}
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div className="flex items-center gap-4">
                          <span>KM para fazer: {displayMileage(expense.target_mileage)}</span>
                          <span className={`font-medium ${getTextColor(expense.km_remaining, expense.is_completed)}`}>
                            {expense.km_remaining <= 0 
                              ? `Atrasado em ${displayMileage(Math.abs(expense.km_remaining))} km`
                              : `Faltam ${displayMileage(expense.km_remaining)} km`
                            }
                          </span>
                        </div>
                        
                        {expense.observation && (
                          <p className="text-xs">{expense.observation}</p>
                        )}
                      </div>


                    </div>
                  </div>
                </div>
                );
              })
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}