
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Plus, Loader2 } from "lucide-react";
import { useAddRevenue } from "@/hooks/useRevenues";
import { useSoundEffects } from "@/hooks/useSoundEffects";

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

  const resetForm = () => {
    setFormData({
      description: "",
      value: "",
      valueNumeric: 0,
      date: "",
      type: "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await addRevenueMutation.mutateAsync({
        car_id: carId,
        description: formData.description,
        value: formData.valueNumeric,
        date: formData.date,
        type: formData.type,
      });

      successSound(); // Som de sucesso ao adicionar receita
      resetForm();
      setOpen(false);
    } catch (error) {
      console.error("Error adding revenue:", error);
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
            <Input
              id="description"
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
