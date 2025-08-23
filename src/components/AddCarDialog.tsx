
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SimpleInput } from "@/components/ui/simple-input";
import { useSecureForm } from "@/hooks/useSecureForm";
import { useAddCar } from "@/hooks/useCars";
import { useImageUpload } from "@/hooks/useImageUpload";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { Plus, Camera, Upload, Shield } from "lucide-react";
import { toast } from "sonner";

interface AddCarForm {
  name: string;
  plate: string;
  purchase_value: string;
  payment_method: string;
  purchase_date: string;
  mileage: string;
  status: "quitado" | "andamento" | "alugado";
  notes: string;
}

export function AddCarDialog() {
  const [open, setOpen] = useState(false);
  const { mutate: addCar, isPending } = useAddCar();
  const { uploadImage, uploading } = useImageUpload();
  const { clickSound, successSound } = useSoundEffects();
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");

  // Usar formulário seguro com configurações específicas
  const { 
    register, 
    handleSubmit, 
    setValue, 
    watch, 
    reset, 
    secureSubmit,
    securityStatus,
    resetSecurity
  } = useSecureForm<AddCarForm>({
    defaultValues: {
      status: "andamento",
    },
  }, {
    enableCSRF: true,
    enableSanitization: true,
    enableValidation: true,
    enableRateLimit: true,
    rateLimitKey: 'add_car_form',
    maxSubmissions: 5,
    windowMs: 300000, // 5 minutos
    strictMode: true,
    onSecurityViolation: (violations) => {
      toast.error(`Violação de segurança detectada: ${violations.join(', ')}`);
    },
    onSanitization: (fields) => {
      toast.warning(`Campos sanitizados: ${fields.join(', ')}`);
    },
    onRateLimitExceeded: () => {
      toast.error('Muitas tentativas de adicionar carros. Aguarde alguns minutos.');
    }
  });

  const status = watch("status");

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Definir regras de validação para cada campo
  const fieldRules = {
    name: {
      maxLength: 100,
      minLength: 2,
      fieldType: 'text' as const,
      required: true,
      strictMode: true
    },
    plate: {
      maxLength: 10,
      minLength: 7,
      fieldType: 'alphanumeric' as const,
      required: true,
      strictMode: true
    },
    purchase_value: {
      maxLength: 15,
      fieldType: 'numeric' as const,
      required: true,
      strictMode: true
    },
    payment_method: {
      maxLength: 50,
      fieldType: 'text' as const,
      required: false
    },
    purchase_date: {
      maxLength: 10,
      fieldType: 'text' as const,
      required: false
    },
    mileage: {
      maxLength: 10,
      fieldType: 'numeric' as const,
      required: false
    },
    notes: {
      maxLength: 1000,
      fieldType: 'description' as const,
      required: false
    }
  };

  const onSubmit = secureSubmit(async (data: AddCarForm) => {
    try {
      let imageUrl = null;

      // Upload image if selected
      if (selectedImage) {
        imageUrl = await uploadImage(selectedImage);
      }

      addCar({
        name: data.name,
        plate: data.plate,
        purchase_value: parseFloat(data.purchase_value),
        payment_method: data.payment_method || null,
        purchase_date: data.purchase_date || null,
        mileage: data.mileage ? parseInt(data.mileage) : null,
        status: data.status,
        notes: data.notes || null,
        image_url: imageUrl,
      });

      successSound(); // Som de sucesso ao adicionar carro
      setOpen(false);
      reset();
      resetSecurity();
      setSelectedImage(null);
      setImagePreview("");
      
      toast.success('Carro adicionado com sucesso!');
    } catch (error) {
      console.error("Error adding car:", error);
      toast.error('Erro ao adicionar carro. Tente novamente.');
    }
  }, fieldRules);

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      clickSound(); // Som ao abrir dialog
    }
    setOpen(newOpen);
    if (!newOpen) {
      reset();
      resetSecurity();
      setSelectedImage(null);
      setImagePreview("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="rounded-xl h-9 px-3 sm:px-4 font-medium text-sm">
          <Plus className="w-4 h-4 sm:mr-2" />
          <span className="hidden sm:inline">Adicionar Carro</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader className="flex-shrink-0 pb-6 border-b border-border">
          <div className="flex items-center gap-2">
            <DialogTitle className="text-lg font-semibold">Adicionar Novo Carro</DialogTitle>

          </div>
          <DialogDescription className="text-muted-foreground text-sm">
            Preencha as informações do carro que deseja adicionar ao sistema.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Image Upload */}
            <div className="space-y-2">
              <Label>Foto do Carro</Label>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="w-full sm:w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center overflow-hidden">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Camera className="w-8 h-8 text-gray-400" />
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    id="image-upload"
                  />
                  <Label
                    htmlFor="image-upload"
                    className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Escolher Foto
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Formatos aceitos: JPG, PNG, WebP
                  </p>
                </div>
              </div>
            </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Carro *</Label>
              <SimpleInput
                id="name"
                {...register("name", { required: true })}
                placeholder="Ex: Honda Civic 2020"
                maxLength={100}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="plate">Placa *</Label>
              <SimpleInput
                id="plate"
                {...register("plate", { required: true })}
                placeholder="Ex: ABC-1234"
                maxLength={10}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="purchase_value">Valor de Compra (R$) *</Label>
              <SimpleInput
                id="purchase_value"
                type="number"
                step="0.01"
                {...register("purchase_value", { required: true })}
                placeholder="Ex: 50000"
                maxLength={15}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select 
                value={status || "andamento"} 
                onValueChange={(value) => setValue("status", value as "quitado" | "andamento" | "alugado")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="andamento">Em Andamento</SelectItem>
                  <SelectItem value="alugado">Alugado</SelectItem>
                  <SelectItem value="quitado">Quitado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="payment_method">Forma de Pagamento</Label>
              <SimpleInput
                id="payment_method"
                {...register("payment_method")}
                placeholder="Ex: Financiamento, À vista"
                maxLength={50}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="purchase_date">Data da Compra</Label>
              <SimpleInput
                id="purchase_date"
                type="date"
                {...register("purchase_date")}
                maxLength={10}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="mileage">Quilometragem</Label>
            <SimpleInput
              id="mileage"
              type="number"
              {...register("mileage")}
              placeholder="Ex: 50000"
              maxLength={10}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <SimpleInput
              id="notes"
              {...register("notes")}
              placeholder="Observações sobre o carro..."
              multiline={true}
              rows={3}
              maxLength={1000}
            />
          </div>



            <div className="flex flex-col sm:flex-row justify-end gap-2 sm:space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  clickSound(); // Som ao cancelar
                  handleOpenChange(false);
                }}
                className="w-full sm:w-auto"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={isPending || uploading || securityStatus.rateLimitRemaining <= 0} 
                className="w-full sm:w-auto"
              >
                {isPending || uploading ? "Adicionando..." : "Adicionar Carro"}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
