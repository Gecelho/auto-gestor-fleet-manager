import { useState, ReactNode } from "react";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUpdateCar } from "@/hooks/useCars";
import { useImageUpload } from "@/hooks/useImageUpload";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { Car } from "@/types/database";
import { Camera, Upload } from "lucide-react";

interface EditCarDialogCustomProps {
  car: Car;
  trigger: ReactNode;
}

interface EditCarForm {
  name: string;
  plate: string;
  purchase_value: string;
  payment_method: string;
  purchase_date: string;
  mileage: string;
  status: "quitado" | "andamento" | "alugado";
  notes: string;
}

export function EditCarDialogCustom({ car, trigger }: EditCarDialogCustomProps) {
  const [open, setOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState(car.image_url || "");
  const { clickSound, successSound } = useSoundEffects();
  
  const updateCarMutation = useUpdateCar();
  const { uploadImage, isUploading } = useImageUpload();

  const { register, handleSubmit, reset, setValue, watch } = useForm<EditCarForm>({
    defaultValues: {
      name: car.name,
      plate: car.plate,
      purchase_value: car.purchase_value.toString(),
      payment_method: car.payment_method || "",
      purchase_date: car.purchase_date || "",
      mileage: car.mileage?.toString() || "",
      status: car.status,
      notes: car.notes || "",
    },
  });

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: EditCarForm) => {
    try {
      let imageUrl = car.image_url;

      if (selectedImage) {
        const uploadedUrl = await uploadImage(selectedImage, `cars/${car.id}`);
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        }
      }

      await updateCarMutation.mutateAsync({
        id: car.id,
        name: data.name,
        plate: data.plate,
        purchase_value: parseFloat(data.purchase_value),
        payment_method: data.payment_method,
        purchase_date: data.purchase_date,
        mileage: data.mileage ? parseInt(data.mileage) : null,
        status: data.status,
        notes: data.notes,
        image_url: imageUrl,
      });

      successSound();
      setOpen(false);
      reset();
      setSelectedImage(null);
      setImagePreview(car.image_url || "");
    } catch (error) {
      console.error("Error updating car:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      if (newOpen) clickSound();
      setOpen(newOpen);
    }}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Editar Carro</DialogTitle>
          <DialogDescription>
            Edite as informações do carro. Clique em salvar quando terminar.
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

            {/* Form fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Carro</Label>
                <Input
                  id="name"
                  {...register("name", { required: true })}
                  placeholder="Ex: Honda Civic 2020"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="plate">Placa</Label>
                <Input
                  id="plate"
                  {...register("plate", { required: true })}
                  placeholder="Ex: ABC-1234"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="purchase_value">Valor de Compra (R$)</Label>
                <Input
                  id="purchase_value"
                  type="number"
                  step="0.01"
                  {...register("purchase_value", { required: true })}
                  placeholder="Ex: 50000.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mileage">Quilometragem</Label>
                <Input
                  id="mileage"
                  type="number"
                  {...register("mileage")}
                  placeholder="Ex: 50000"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="payment_method">Forma de Pagamento</Label>
                <Input
                  id="payment_method"
                  {...register("payment_method")}
                  placeholder="Ex: Financiamento, À vista"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="purchase_date">Data da Compra</Label>
                <Input
                  id="purchase_date"
                  type="date"
                  {...register("purchase_date")}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={watch("status")}
                onValueChange={(value: "quitado" | "andamento" | "alugado") =>
                  setValue("status", value)
                }
              >
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

            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                {...register("notes")}
                placeholder="Observações adicionais sobre o carro..."
                rows={3}
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={updateCarMutation.isPending || isUploading}
              >
                {updateCarMutation.isPending || isUploading ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}