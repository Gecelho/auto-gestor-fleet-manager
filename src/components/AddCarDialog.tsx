
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
import { useAddCar } from "@/hooks/useCars";
import { useImageUpload } from "@/hooks/useImageUpload";
import { Plus } from "lucide-react";

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
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");

  const { register, handleSubmit, setValue, watch, reset } = useForm<AddCarForm>({
    defaultValues: {
      status: "andamento",
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

  const onSubmit = async (data: AddCarForm) => {
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

      setOpen(false);
      reset();
      setSelectedImage(null);
      setImagePreview("");
    } catch (error) {
      console.error("Error adding car:", error);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      reset();
      setSelectedImage(null);
      setImagePreview("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="h-9 w-9 sm:w-auto sm:h-auto p-0 sm:px-4 sm:py-2">
          <Plus className="w-4 h-4 sm:mr-2" />
          <span className="hidden sm:inline">Adicionar Carro</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col w-[95vw] sm:w-full">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Adicionar Novo Carro</DialogTitle>
          <DialogDescription>
            Preencha as informações do carro que deseja adicionar ao sistema.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
                placeholder="Ex: 50000"
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
            <Label htmlFor="mileage">Quilometragem</Label>
            <Input
              id="mileage"
              type="number"
              {...register("mileage")}
              placeholder="Ex: 50000"
            />
          </div>

          <div className="space-y-2">
            <Label>Foto do Carro</Label>
            <div className="space-y-2">
              <Input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
              />
              {imagePreview && (
                <div className="w-full h-32 bg-muted rounded-lg overflow-hidden">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              {...register("notes")}
              placeholder="Observações sobre o carro..."
              rows={3}
            />
          </div>

            <div className="flex flex-col sm:flex-row justify-end gap-2 sm:space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                className="w-full sm:w-auto"
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending || uploading} className="w-full sm:w-auto">
                {isPending || uploading ? "Adicionando..." : "Adicionar Carro"}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
