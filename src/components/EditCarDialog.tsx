
import { useState } from "react";
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
import { Edit, Camera, Upload } from "lucide-react";

interface EditCarDialogProps {
  car: Car;
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

export function EditCarDialog({ car }: EditCarDialogProps) {
  const [open, setOpen] = useState(false);
  const { mutate: updateCar, isPending } = useUpdateCar();
  const { uploadImage, uploading } = useImageUpload();
  const { clickSound, successSound } = useSoundEffects();
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>(car.image_url || "");

  const { register, handleSubmit, setValue, watch, reset } = useForm<EditCarForm>({
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

  const onSubmit = async (data: EditCarForm) => {
    try {
      let imageUrl = car.image_url;

      // Upload new image if selected
      if (selectedImage) {
        const uploadedUrl = await uploadImage(selectedImage);
        imageUrl = uploadedUrl;
      }

      updateCar({
        id: car.id,
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

      successSound(); // Som de sucesso ao editar carro
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
      if (newOpen) clickSound(); // Som ao abrir dialog
      setOpen(newOpen);
    }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="h-8 w-8">
          <Edit className="w-4 h-4" />
        </Button>
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
            {/* Linha 1: Nome e Placa */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Carro</Label>
                <Input
                  id="name"
                  {...register("name", { required: true })}
                  placeholder="Ex: Honda Civic 2020"
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="plate">Placa</Label>
                <Input
                  id="plate"
                  {...register("plate", { required: true })}
                  placeholder="Ex: ABC-1234"
                  className="w-full"
                />
              </div>
            </div>

            {/* Linha 2: Valor e Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="purchase_value">Valor de Compra (R$)</Label>
                <Input
                  id="purchase_value"
                  type="number"
                  step="0.01"
                  {...register("purchase_value", { required: true })}
                  placeholder="Ex: 50000"
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={(value) => setValue("status", value as any)}>
                  <SelectTrigger className="w-full">
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

            {/* Linha 3: Forma de Pagamento e Data */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="payment_method">Forma de Pagamento</Label>
                <Input
                  id="payment_method"
                  {...register("payment_method")}
                  placeholder="Ex: Financiamento, À vista"
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="purchase_date">Data da Compra</Label>
                <Input
                  id="purchase_date"
                  type="date"
                  {...register("purchase_date")}
                  className="w-full"
                />
              </div>
            </div>

            {/* Linha 4: Quilometragem (campo único) */}
            <div className="space-y-2">
              <Label htmlFor="mileage">Quilometragem</Label>
              <Input
                id="mileage"
                type="number"
                {...register("mileage")}
                placeholder="Ex: 50000"
                className="w-full sm:w-1/2"
              />
            </div>

            {/* Linha 5: Foto do Carro */}
            <div className="space-y-3">
              <Label>Foto do Carro</Label>
              <div className="space-y-3">
                {/* Botão customizado para upload */}
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    id="car-photo-upload"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full sm:w-auto flex items-center gap-2 h-12 px-6 border-2 border-dashed border-primary/30 hover:border-primary/50 hover:bg-primary/5 transition-all"
                    asChild
                  >
                    <label htmlFor="car-photo-upload" className="cursor-pointer">
                      <Camera className="w-5 h-5 text-primary" />
                      <span className="text-sm font-medium">
                        {imagePreview ? 'Alterar Foto do Carro' : 'Adicionar Foto do Carro'}
                      </span>
                      <Upload className="w-4 h-4 text-muted-foreground" />
                    </label>
                  </Button>
                </div>

                {/* Preview da imagem */}
                {imagePreview && (
                  <div className="relative">
                    <div className="w-full h-40 sm:h-48 bg-muted rounded-lg overflow-hidden border-2 border-border">
                      <img
                        src={imagePreview}
                        alt="Preview da foto do carro"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="absolute top-2 right-2">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setImagePreview("");
                          setSelectedImage(null);
                        }}
                        className="h-8 w-8 p-0 bg-background/80 hover:bg-background"
                      >
                        ✕
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Linha 6: Observações */}
            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                {...register("notes")}
                placeholder="Observações sobre o carro..."
                rows={3}
                className="w-full resize-none"
              />
            </div>

            {/* Botões de ação */}
            <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-2 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                className="w-full sm:w-auto order-2 sm:order-1"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={isPending || uploading}
                className="w-full sm:w-auto order-1 sm:order-2"
              >
                {isPending || uploading ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
