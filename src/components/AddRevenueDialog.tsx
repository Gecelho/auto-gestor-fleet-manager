
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SecureInput } from "@/components/ui/secure-input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Plus, Loader2 } from "lucide-react";
import { useAddRevenue } from "@/hooks/useRevenues";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { useSecureForm } from "@/hooks/useSecureForm";
import { SecurityLogger } from "@/lib/security";

interface AddRevenueDialogProps {
  carId: string;
}

export function AddRevenueDialog({ carId }: AddRevenueDialogProps) {
  const [open, setOpen] = useState(false);
  const { clickSound, successSound } = useSoundEffects();
  const [formData, setFormData] = useState({
    description: "",
    value: "",
    valueNumeric: 0,
    date: "",
    type: "",
  });

  const addRevenueMutation = useAddRevenue();

  // Configuração de segurança para o formulário
  const fieldRules = {
    description: { min: 2, max: 200, type: 'text' as const, required: true },
    date: { required: true },
    type: { required: true },
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
      value: "",
      valueNumeric: 0,
      date: "",
      type: "",
    });
  };

  const handleSubmit = secureSubmit(async (sanitizedData) => {
    try {
      SecurityLogger.log('info', 'revenue_creation_initiated', {
        carId,
        description: sanitizedData.description?.substring(0, 50) + '...',
        type: sanitizedData.type
      });

      await addRevenueMutation.mutateAsync({
        car_id: carId,
        description: sanitizedData.description,
        value: formData.valueNumeric,
        date: sanitizedData.date,
        type: sanitizedData.type,
      });

      SecurityLogger.log('info', 'revenue_created_successfully', {
        carId,
        value: formData.valueNumeric,
        type: sanitizedData.type
      });

      successSound(); // Som de sucesso ao adicionar receita
      resetForm();
      setOpen(false);
    } catch (error) {
      SecurityLogger.log('error', 'revenue_creation_failed', {
        carId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      console.error("Error adding revenue:", error);
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

  const isLoading = addRevenueMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-1 sm:mr-2" />
          <span className="hidden xs:inline">Adicionar </span>Receita
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[85vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Adicionar Receita</DialogTitle>
          <DialogDescription>
            Registre uma nova receita para este carro.
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
              rateLimitKey="revenue_description_input"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Ex: Aluguel mensal"
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
              placeholder="Ex: 1.500,00"
              required
            />
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
            <Label htmlFor="type">Tipo *</Label>
            <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="aluguel">Aluguel</SelectItem>
                <SelectItem value="venda">Venda</SelectItem>
                <SelectItem value="outros">Outros</SelectItem>
              </SelectContent>
            </Select>
          </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Adicionar Receita
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
