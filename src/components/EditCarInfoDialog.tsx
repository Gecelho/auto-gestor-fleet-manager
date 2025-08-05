import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Edit, Loader2 } from "lucide-react";
import { useCarDetails } from "@/hooks/useCarDetails";
import { CurrencyInput } from "@/components/ui/currency-input";
import { MileageInput } from "@/components/ui/mileage-input";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface EditCarInfoDialogProps {
  carId: string;
}

export function EditCarInfoDialog({ carId }: EditCarInfoDialogProps) {
  const [open, setOpen] = useState(false);
  const { data } = useCarDetails(carId);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Criar mutation para atualizar carro
  const updateCarMutation = useMutation({
    mutationFn: async (carData: any) => {
      const { error } = await supabase
        .from("cars")
        .update(carData)
        .eq("id", carId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["car-details", carId] });
      queryClient.invalidateQueries({ queryKey: ["cars"] });
      toast({
        title: "Informações atualizadas com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar informações",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const [formData, setFormData] = useState({
    name: data?.car.name || "",
    plate: data?.car.plate || "",
    purchase_value: { formatted: "", numeric: data?.car.purchase_value || 0 },
    payment_method: data?.car.payment_method || "",
    purchase_date: data?.car.purchase_date || "",
    mileage: { formatted: "", numeric: data?.car.mileage || 0 },
    notes: data?.car.notes || "",
    status: data?.car.status || "andamento"
  });

  // Atualizar formData quando os dados carregarem
  useEffect(() => {
    if (data?.car) {
      setFormData({
        name: data.car.name || "",
        plate: data.car.plate || "",
        purchase_value: { 
          formatted: data.car.purchase_value?.toLocaleString("pt-BR", { minimumFractionDigits: 2 }) || "0,00", 
          numeric: data.car.purchase_value || 0 
        },
        payment_method: data.car.payment_method || "",
        purchase_date: data.car.purchase_date || "",
        mileage: { 
          formatted: data.car.mileage?.toLocaleString("pt-BR") || "0", 
          numeric: data.car.mileage || 0 
        },
        notes: data.car.notes || "",
        status: data.car.status || "andamento"
      });
    }
  }, [data]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    updateCarMutation.mutate({
      name: formData.name,
      plate: formData.plate,
      purchase_value: formData.purchase_value.numeric,
      payment_method: formData.payment_method,
      purchase_date: formData.purchase_date,
      mileage: formData.mileage.numeric,
      notes: formData.notes,
      status: formData.status as "quitado" | "andamento" | "alugado"
    }, {
      onSuccess: () => {
        setOpen(false);
      }
    });
  };

  const handleCurrencyChange = (formatted: string, numeric: number) => {
    setFormData(prev => ({
      ...prev,
      purchase_value: { formatted, numeric }
    }));
  };

  const handleMileageChange = (formatted: string, numeric: number) => {
    setFormData(prev => ({
      ...prev,
      mileage: { formatted, numeric }
    }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-6 w-6">
          <Edit className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Editar Informações do Carro</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2">
          <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nome do Carro */}
            <div>
              <Label htmlFor="name">Nome do Carro</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Honda Civic 2020"
                required
              />
            </div>

            {/* Placa */}
            <div>
              <Label htmlFor="plate">Placa</Label>
              <Input
                id="plate"
                value={formData.plate}
                onChange={(e) => setFormData(prev => ({ ...prev, plate: e.target.value.toUpperCase() }))}
                placeholder="Ex: ABC-1234"
                required
              />
            </div>

            {/* Valor de Compra */}
            <div>
              <Label htmlFor="purchase_value">Valor de Compra</Label>
              <CurrencyInput
                value={formData.purchase_value.formatted}
                onChange={handleCurrencyChange}
                placeholder="0,00"
              />
            </div>

            {/* Forma de Pagamento */}
            <div>
              <Label htmlFor="payment_method">Forma de Pagamento</Label>
              <Select value={formData.payment_method} onValueChange={(value) => setFormData(prev => ({ ...prev, payment_method: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a forma de pagamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="à vista">À Vista</SelectItem>
                  <SelectItem value="financiado">Financiado</SelectItem>
                  <SelectItem value="consórcio">Consórcio</SelectItem>
                  <SelectItem value="parcelado">Parcelado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Data de Compra */}
            <div>
              <Label htmlFor="purchase_date">Data de Compra</Label>
              <Input
                id="purchase_date"
                type="date"
                value={formData.purchase_date}
                onChange={(e) => setFormData(prev => ({ ...prev, purchase_date: e.target.value }))}
              />
            </div>

            {/* Quilometragem na Compra */}
            <div>
              <Label htmlFor="mileage">Quilometragem na Compra</Label>
              <MileageInput
                value={formData.mileage.formatted}
                onChange={handleMileageChange}
                placeholder="0"
              />
            </div>

            {/* Status */}
            <div className="md:col-span-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="quitado">Quitado</SelectItem>
                  <SelectItem value="andamento">Em Andamento</SelectItem>
                  <SelectItem value="alugado">Alugado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Observações */}
          <div>
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Observações sobre o carro..."
              rows={3}
            />
          </div>

            {/* Botões */}
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={updateCarMutation.isPending}>
                {updateCarMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Salvar Alterações
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}