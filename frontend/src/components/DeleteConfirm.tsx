import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useDeleteEntity } from "@/features/entities/hooks";
import { useUIStore } from "@/store/ui";

interface DeleteConfirmProps {
  open: boolean;
  entityId: string | null;
  onClose: () => void;
}

export function DeleteConfirm({ open, entityId, onClose }: DeleteConfirmProps) {
  const deleteMut = useDeleteEntity();
  const reset = useUIStore((s) => s.reset);

  const handleConfirm = async () => {
    if (!entityId) return;
    await deleteMut.mutateAsync(entityId);
    reset();
    onClose();
  };

  return (
    <AlertDialog
      open={open}
      onOpenChange={(v) => {
        if (!v) {
          onClose();
        }
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this entity?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. The entity will be permanently removed.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={deleteMut.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteMut.isPending ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
