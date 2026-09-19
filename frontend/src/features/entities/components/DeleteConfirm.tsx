import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useDeleteEntity } from "@/services/entity";
import { useUIStore } from "@/store/ui";

interface DeleteConfirmProps {
  open: boolean;
  entityId: string | null;
  onClose: () => void;
}

export const DeleteConfirm = ({ open, entityId, onClose }: DeleteConfirmProps) => {
  const deleteMut = useDeleteEntity();
  const reset = useUIStore((s) => s.reset);

  const handleConfirm = async () => {
    if (!entityId) return;
    await deleteMut.mutateAsync(entityId);
    reset();
    onClose();
  };

  return (
    <Popover open={open} onOpenChange={(v) => !v && onClose()}>
      <PopoverTrigger render={<span className="sr-only" />} />
      <PopoverContent className="w-72 gap-0 overflow-hidden p-0" align="center" side="top">
        <div className="bg-destructive/5 border-destructive/10 border-b p-2">
          <div className="text-destructive flex items-center gap-2 font-semibold text-sm">
            <Trash2 className="size-4" />
            <span>Delete Entity</span>
          </div>
        </div>
        <div className="space-y-3 p-3">
          <p className="text-muted-foreground text-sm leading-relaxed">
            This action cannot be undone. The entity will be permanently removed.
          </p>
          <div className="grid grid-cols-2 items-center gap-2">
            <Button
              size="sm"
              variant="destructive"
              onClick={handleConfirm}
              disabled={deleteMut.isPending}
            >
              {deleteMut.isPending ? "Deleting..." : "Delete"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onClose}
            >
              Cancel
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
