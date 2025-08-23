
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { SecureInput } from "@/components/ui/secure-input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { MileageInput } from "@/components/ui/mileage-input";
import { Plus, Loader2 } from "lucide-react";
import { useAddExpense } from "@/hooks/useExpenses";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { useSecureForm } from "@/hooks/useSecureForm";
import { SecurityLogger } from "@/lib/security";

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
  
  // Configuração de segurança para o formulário
  const fieldRules = {
    description: { min: 2, max: 200, type: 'text' as const, required: true },
    observation: { min: 0, max: 1000, type: 'description' as const, required: false },
    date: { required: true },
    value: { min: 1, required: true }
  };

  const { secureSubmit, securityStatus } = useSecureForm(formData, {
    enableCSRF: true,
    enableSanitization: true,
    enableRateLimit: true,
    strictMode: true
  });

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

  const handleSubmit = secureSubmit(async (sanitizedData) => {
    try {
      SecurityLogger.log('info', 'expense_creation_initiated', {
        carId,
        description: sanitizedData.description?.substring(0, 50) + '...'
      });

      await addExpenseMutation.mutateAsync({
        car_id: carId,
        description: sanitizedData.description,
        observation: sanitizedData.observation || undefined,
        mileage: formData.mileageNumeric || undefined,
        next_mileage: formData.nextMileageNumeric || undefined,
        value: formData.valueNumeric,
        date: sanitizedData.date,
      });

      SecurityLogger.log('info', 'expense_created_successfully', {
        carId,
        value: formData.valueNumeric
      });

      successSound(); // Som de sucesso ao adicionar despesa
      resetForm();
      setOpen(false);
    } catch (error) {
      SecurityLogger.log('error', 'expense_creation_failed', {
        carId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      console.error("Error adding expense:", error);
    }
  }, fieldRules);

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
            <SecureInput
              id="description"
              fieldType="text"
              maxLength={200}
              strictMode={true}
              rateLimitKey="expense_description_input"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Ex: Troca de óleo"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="observation">Observação</Label>
            <SecureInput
              id="observation"
              fieldType="description"
              maxLength={1000}
              strictMode={false}
              rateLimitKey="expense_observation_input"
              value={formData.observation}
              onChange={(e) => setFormData({ ...formData, observation: e.target.value })}
              placeholder="Descreva detalhes sobre esta despesa..."
              multiline={true}
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
