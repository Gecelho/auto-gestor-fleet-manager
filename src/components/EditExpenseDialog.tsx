
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CurrencyInput } from "@/components/ui/currency-input";
import { MileageInput } from "@/components/ui/mileage-input";
import { Edit, Loader2 } from "lucide-react";
import { useUpdateExpense } from "@/hooks/useExpenses";
import { formatCurrency, formatMileage } from "@/lib/formatters";

interface Expense {
  id: string;
  car_id: string;
  description: string;
  observation?: string;
  mileage?: number;
  next_mileage?: number;
  value: number;
  date: string;
  created_at: string;
}

interface EditExpenseDialogProps {
  expense: Expense;
}

export function EditExpenseDialog({ expense }: EditExpenseDialogProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    description: expense.description,
    observation: expense.observation || "",
    mileage: expense.mileage ? formatMileage(expense.mileage.toString()) : "",
    mileageNumeric: expense.mileage || 0,
    next_mileage: expense.next_mileage ? formatMileage(expense.next_mileage.toString()) : "",
    nextMileageNumeric: expense.next_mileage || 0,
    date: expense.date,
    value: formatCurrency((expense.value * 100).toString()),
    valueNumeric: expense.value,
  });

  const updateExpenseMutation = useUpdateExpense();

  const resetForm = () => {
    setFormData({
      description: expense.description,
      observation: expense.observation || "",
      mileage: expense.mileage ? formatMileage(expense.mileage.toString()) : "",
      mileageNumeric: expense.mileage || 0,
      next_mileage: expense.next_mileage ? formatMileage(expense.next_mileage.toString()) : "",
      nextMileageNumeric: expense.next_mileage || 0,
      date: expense.date,
      value: formatCurrency((expense.value * 100).toString()),
      valueNumeric: expense.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await updateExpenseMutation.mutateAsync({
        id: expense.id,
        description: formData.description,
        observation: formData.observation || undefined,
        mileage: formData.mileageNumeric || undefined,
        next_mileage: formData.nextMileageNumeric || undefined,
        value: formData.valueNumeric,
        date: formData.date,
      });

      setOpen(false);
    } catch (error) {
      console.error("Error updating expense:", error);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      resetForm();
    }
  };

  const isLoading = updateExpenseMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Edit className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[85vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Editar Despesa</DialogTitle>
          <DialogDescription>
            Edite os dados da despesa.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto pr-2">
          <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">Descrição *</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="observation">Observação</Label>
            <Textarea
              id="observation"
              value={formData.observation}
              onChange={(e) => setFormData({ ...formData, observation: e.target.value })}
              placeholder="Descreva detalhes sobre esta despesa..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="mileage">KM Atual</Label>
              <MileageInput
                id="mileage"
                value={formData.mileage}
                onChange={(formatted, numeric) => setFormData({ 
                  ...formData, 
                  mileage: formatted, 
                  mileageNumeric: numeric 
                })}
                placeholder="Ex: 50.000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="next_mileage">Próximo KM</Label>
              <MileageInput
                id="next_mileage"
                value={formData.next_mileage}
                onChange={(formatted, numeric) => setFormData({ 
                  ...formData, 
                  next_mileage: formatted, 
                  nextMileageNumeric: numeric 
                })}
                placeholder="Ex: 55.000"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Data *</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="value">Valor *</Label>
            <CurrencyInput
              id="value"
              value={formData.value}
              onChange={(formatted, numeric) => setFormData({ 
                ...formData, 
                value: formatted, 
                valueNumeric: numeric 
              })}
              placeholder="Ex: 150,00"
              required
            />
          </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Salvar
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
