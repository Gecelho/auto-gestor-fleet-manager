
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2 } from "lucide-react";
import { useDeleteExpense } from "@/hooks/useExpenses";
import { useSoundEffects } from "@/hooks/useSoundEffects";

interface DeleteExpenseDialogProps {
  expenseId: string;
  expenseDescription: string;
}

export function DeleteExpenseDialog({ expenseId, expenseDescription }: DeleteExpenseDialogProps) {
  const [open, setOpen] = useState(false);
  const deleteExpenseMutation = useDeleteExpense();
  const { clickSound, successSound } = useSoundEffects();

  const handleDelete = async () => {
    try {
      await deleteExpenseMutation.mutateAsync(expenseId);
      successSound(); // Som de sucesso ao deletar despesa
      setOpen(false);
    } catch (error) {
      console.error("Error deleting expense:", error);
    }
  };

  const isLoading = deleteExpenseMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Trash2 className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Excluir Despesa</DialogTitle>
          <DialogDescription>
            Tem certeza que deseja excluir a despesa "{expenseDescription}"? Esta ação não pode ser desfeita.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isLoading}>
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Excluir
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
