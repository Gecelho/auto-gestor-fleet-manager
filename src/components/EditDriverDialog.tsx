
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { SecureInput } from "@/components/ui/secure-input";
import { Edit, Loader2 } from "lucide-react";
import { useUpdateDriver } from "@/hooks/useCarDetails";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { useSecureForm } from "@/hooks/useSecureForm";
import { SecurityLogger } from "@/lib/security";
import { Driver } from "@/types/database";

interface EditDriverDialogProps {
  driver: Driver | null;
  carId: string;
}

export function EditDriverDialog({ driver, carId }: EditDriverDialogProps) {
  const [open, setOpen] = useState(false);
  const { clickSound, successSound } = useSoundEffects();
  const [formData, setFormData] = useState({
    name: driver?.name || "",
    phone: driver?.phone || "",
    cpf: driver?.cpf || "",
    address: driver?.address || "",
  });

  const updateDriverMutation = useUpdateDriver();

  // Configuração de segurança para o formulário
  const fieldRules = {
    name: { min: 2, max: 100, type: 'text' as const, required: true },
    phone: { min: 0, max: 15, type: 'numeric' as const, required: false },
    cpf: { min: 0, max: 14, type: 'numeric' as const, required: false },
    address: { min: 0, max: 200, type: 'text' as const, required: false }
  };

  const { secureSubmit, securityStatus } = useSecureForm(formData, {
    enableCSRF: true,
    enableSanitization: true,
    enableRateLimit: true,
    strictMode: true
  });

  const resetForm = () => {
    setFormData({
      name: driver?.name || "",
      phone: driver?.phone || "",
      cpf: driver?.cpf || "",
      address: driver?.address || "",
    });
  };

  const handleSubmit = secureSubmit(async (sanitizedData) => {
    try {
      SecurityLogger.log('info', 'driver_update_initiated', {
        carId,
        driverName: sanitizedData.name?.substring(0, 30) + '...'
      });

      await updateDriverMutation.mutateAsync({
        car_id: carId,
        name: sanitizedData.name,
        phone: sanitizedData.phone || undefined,
        cpf: sanitizedData.cpf || undefined,
        address: sanitizedData.address || undefined,
      });

      SecurityLogger.log('info', 'driver_updated_successfully', {
        carId,
        driverName: sanitizedData.name?.substring(0, 30) + '...'
      });

      successSound(); // Som de sucesso ao editar motorista
      setOpen(false);
    } catch (error) {
      SecurityLogger.log('error', 'driver_update_failed', {
        carId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      console.error("Error updating driver:", error);
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

  const isLoading = updateDriverMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full sm:w-auto">
          <Edit className="w-4 h-4 mr-1 sm:mr-2" />
          <span className="hidden xs:inline">{driver ? "Editar" : "Adicionar"} </span>
          {driver ? "Motorista" : "Motorista"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[85vh] flex flex-col">
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
            <SecureInput
              id="name"
              fieldType="text"
              maxLength={100}
              strictMode={true}
              rateLimitKey="driver_name_input"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Digite o nome completo"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Telefone</Label>
            <SecureInput
              id="phone"
              fieldType="numeric"
              maxLength={15}
              strictMode={true}
              rateLimitKey="driver_phone_input"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="(11) 99999-9999"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cpf">CPF</Label>
            <SecureInput
              id="cpf"
              fieldType="numeric"
              maxLength={14}
              strictMode={true}
              rateLimitKey="driver_cpf_input"
              value={formData.cpf}
              onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
              placeholder="000.000.000-00"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Endereço</Label>
            <SecureInput
              id="address"
              fieldType="text"
              maxLength={200}
              strictMode={false}
              rateLimitKey="driver_address_input"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Digite o endereço completo"
              multiline={true}
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
