
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CurrencyInput } from "@/components/ui/currency-input";
import { MileageInput } from "@/components/ui/mileage-input";
import { Plus, Loader2 } from "lucide-react";
import { useAddExpense } from "@/hooks/useExpenses";
import { useSoundEffects } from "@/hooks/useSoundEffects";

interface AddExpenseDialogProps {
  carId: string;
}

export function AddExpenseDialog({ carId }: AddExpenseDialogProps) {
  const [open, setOpen] = useState(false);
  const { clickSound, successSound } = useSoundEffects();
  const [formData, setFormData] = useState({
    description: "",
    observation: "",
    mileage: "",
    mileageNumeric: 0,
    next_mileage: "",
    nextMileageNumeric: 0,
    date: "",
    value: "",
    valueNumeric: 0,
  });

  const addExpenseMutation = useAddExpense();

  const resetForm = () => {
    setFormData({
      description: "",
      observation: "",
      mileage: "",
      mileageNumeric: 0,
      next_mileage: "",
      nextMileageNumeric: 0,
      date: "",
      value: "",
      valueNumeric: 0,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await addExpenseMutation.mutateAsync({
        car_id: carId,
        description: formData.description,
        observation: formData.observation || undefined,
        mileage: formData.mileageNumeric || undefined,
        next_mileage: formData.nextMileageNumeric || undefined,
        value: formData.valueNumeric,
        date: formData.date,
      });

      successSound(); // Som de sucesso ao adicionar despesa
      resetForm();
      setOpen(false);
    } catch (error) {
      console.error("Error adding expense:", error);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      clickSound(); // Som ao abrir dialog
    }
    setOpen(newOpen);
    if (!newOpen) {
      resetForm();
    }
  };

  const isLoading = addExpenseMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-1 sm:mr-2" />
          <span className="hidden xs:inline">Adicionar </span>Despesa
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[85vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Adicionar Despesa</DialogTitle>
          <DialogDescription>
            Registre uma nova despesa para este carro.
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
              placeholder="Ex: Troca de óleo"
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
                Adicionar Despesa
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
