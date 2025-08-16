
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useDeleteCar } from "@/hooks/useDeleteCar";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { Trash2 } from "lucide-react";

interface DeleteCarDialogProps {
  carId: string;
  carName: string;
  onDelete?: () => void;
}

export function DeleteCarDialog({ carId, carName, onDelete }: DeleteCarDialogProps) {
  const [open, setOpen] = useState(false);
  const { mutate: deleteCar, isPending } = useDeleteCar();
  const { clickSound, successSound } = useSoundEffects();

  const handleDelete = () => {
    deleteCar(carId, {
      onSuccess: () => {
        successSound(); // Som de sucesso ao deletar carro
        setOpen(false);
        onDelete?.();
      },
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={(newOpen) => {
      if (newOpen) clickSound(); // Som ao abrir dialog
      setOpen(newOpen);
    }}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="icon" className="h-8 w-8">
          <Trash2 className="w-4 h-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja deletar o carro "{carName}"? Esta ação irá remover:
            <br />
            <br />
            • Todas as despesas relacionadas
            <br />
            • Todas as receitas relacionadas
            <br />
            • Dados do motorista
            <br />
            • Todos os outros dados vinculados
            <br />
            <br />
            <strong>Esta ação não pode ser desfeita.</strong>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isPending ? "Deletando..." : "Sim, Deletar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
