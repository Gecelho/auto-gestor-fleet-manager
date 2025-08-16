import { useState, ReactNode } from "react";
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
import { useDeleteCar } from "@/hooks/useDeleteCar";
import { useSoundEffects } from "@/hooks/useSoundEffects";

interface DeleteCarDialogCustomProps {
  carId: string;
  carName: string;
  onDelete?: () => void;
  trigger: ReactNode;
}

export function DeleteCarDialogCustom({ carId, carName, onDelete, trigger }: DeleteCarDialogCustomProps) {
  const [open, setOpen] = useState(false);
  const deleteCarMutation = useDeleteCar();
  const { clickSound, successSound } = useSoundEffects();

  const handleDelete = async () => {
    try {
      await deleteCarMutation.mutateAsync(carId);
      successSound();
      setOpen(false);
      onDelete?.();
    } catch (error) {
      console.error("Error deleting car:", error);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={(newOpen) => {
      if (newOpen) clickSound();
      setOpen(newOpen);
    }}>
      <AlertDialogTrigger asChild>
        {trigger}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir Carro</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir o carro "{carName}"? Esta ação não pode ser desfeita.
            Todas as despesas e receitas associadas também serão excluídas.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteCarMutation.isPending}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            {deleteCarMutation.isPending ? "Excluindo..." : "Excluir"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}