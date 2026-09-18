import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EntityForm } from "@/features/entities/EntityForm";
import { useEntity } from "@/features/entities/hooks";
import { useUIStore } from "@/store/ui";

interface EntityDialogProps {
  open: boolean;
  mode: "add" | "edit";
  entityId: string | null;
  onClose: () => void;
}

export function EntityDialog({ open, mode, entityId, onClose }: EntityDialogProps) {
  const { data: entity } = useEntity(mode === "edit" ? entityId : null);
  const reset = useUIStore((s) => s.reset);

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === "edit" ? "Edit Entity" : "Add Entity"}</DialogTitle>
        </DialogHeader>
        <EntityForm
          entity={mode === "edit" ? entity : null}
          onDone={handleClose}
        />
      </DialogContent>
    </Dialog>
  );
}
