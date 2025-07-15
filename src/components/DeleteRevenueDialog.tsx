
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2 } from "lucide-react";
import { useDeleteRevenue } from "@/hooks/useRevenues";

interface DeleteRevenueDialogProps {
  revenueId: string;
  revenueDescription: string;
}

export function DeleteRevenueDialog({ revenueId, revenueDescription }: DeleteRevenueDialogProps) {
  const [open, setOpen] = useState(false);
  const deleteRevenueMutation = useDeleteRevenue();

  const handleDelete = async () => {
    try {
      await deleteRevenueMutation.mutateAsync(revenueId);
      setOpen(false);
    } catch (error) {
      console.error("Error deleting revenue:", error);
    }
  };

  const isLoading = deleteRevenueMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Trash2 className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Excluir Receita</DialogTitle>
          <DialogDescription>
            Tem certeza que deseja excluir a receita "{revenueDescription}"? Esta ação não pode ser desfeita.
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
