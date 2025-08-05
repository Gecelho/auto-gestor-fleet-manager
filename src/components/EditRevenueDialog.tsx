
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Edit, Loader2 } from "lucide-react";
import { useUpdateRevenue } from "@/hooks/useRevenues";
import { Revenue } from "@/types/database";
import { formatCurrency } from "@/lib/formatters";

interface EditRevenueDialogProps {
  revenue: Revenue;
}

export function EditRevenueDialog({ revenue }: EditRevenueDialogProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    description: revenue.description,
    value: formatCurrency((revenue.value * 100).toString()),
    valueNumeric: revenue.value,
    date: revenue.date,
    type: revenue.type,
  });

  const updateRevenueMutation = useUpdateRevenue();

  const resetForm = () => {
    setFormData({
      description: revenue.description,
      value: formatCurrency((revenue.value * 100).toString()),
      valueNumeric: revenue.value,
      date: revenue.date,
      type: revenue.type,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await updateRevenueMutation.mutateAsync({
        id: revenue.id,
        description: formData.description,
        value: formData.valueNumeric,
        date: formData.date,
        type: formData.type,
      });

      setOpen(false);
    } catch (error) {
      console.error("Error updating revenue:", error);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      resetForm();
    }
  };

  const isLoading = updateRevenueMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Edit className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[85vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Editar Receita</DialogTitle>
          <DialogDescription>
            Edite os dados da receita.
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
            <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value as typeof formData.type })}>
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
                Salvar
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
