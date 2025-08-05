
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Edit, Loader2 } from "lucide-react";
import { useUpdateDriver } from "@/hooks/useCarDetails";
import { Driver } from "@/types/database";

interface EditDriverDialogProps {
  driver: Driver | null;
  carId: string;
}

export function EditDriverDialog({ driver, carId }: EditDriverDialogProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: driver?.name || "",
    phone: driver?.phone || "",
    cpf: driver?.cpf || "",
    address: driver?.address || "",
  });

  const updateDriverMutation = useUpdateDriver();

  const resetForm = () => {
    setFormData({
      name: driver?.name || "",
      phone: driver?.phone || "",
      cpf: driver?.cpf || "",
      address: driver?.address || "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await updateDriverMutation.mutateAsync({
        car_id: carId,
        name: formData.name,
        phone: formData.phone || undefined,
        cpf: formData.cpf || undefined,
        address: formData.address || undefined,
      });

      setOpen(false);
    } catch (error) {
      console.error("Error updating driver:", error);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      resetForm();
    }
  };

  const isLoading = updateDriverMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Edit className="w-4 h-4 mr-2" />
          {driver ? "Editar" : "Adicionar Motorista"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[85vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>{driver ? "Editar Motorista" : "Adicionar Motorista"}</DialogTitle>
          <DialogDescription>
            {driver ? "Edite os dados do motorista." : "Cadastre os dados do motorista para este carro."}
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto pr-2">
          <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome Completo *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Digite o nome completo"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Telefone</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="(11) 99999-9999"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cpf">CPF</Label>
            <Input
              id="cpf"
              value={formData.cpf}
              onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
              placeholder="000.000.000-00"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Endereço</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Digite o endereço completo"
              rows={3}
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
