import { useState } from "react";
import { X, MapPin, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useEntity, useDeleteEntity } from "@/services/entity";
import { queryClient } from "@/libs/query";
import { QKEY_ENTITY_DETAIL } from "@/constants/query-keys";
import { useUIStore } from "@/store/ui";
import { formatLabel } from "@/constants/labels";
import { typeStyles, statusColors } from "@/constants/entity";

export const EntityDetailCard = () => {
  const selectedEntityId = useUIStore((s) => s.selectedEntityId);
  const { data: entityRes } = useEntity(selectedEntityId);
  const entity = entityRes?.data;
  const setActiveOverlay = useUIStore((s) => s.setActiveOverlay);
  const setSelectedEntityId = useUIStore((s) => s.setSelectedEntityId);
  const deleteMut = useDeleteEntity();
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (!entity) return null;

  const style = typeStyles[entity.type] ?? typeStyles.other;
  const Icon = style.icon;

  const handleClose = () => {
    setSelectedEntityId(null);
    setActiveOverlay("none");
  };

  const handleDelete = async () => {
    const id = entity.id;
    setSelectedEntityId(null);
    setActiveOverlay("none");
    await deleteMut.mutateAsync(id);
    queryClient.removeQueries({ queryKey: [...QKEY_ENTITY_DETAIL, id] });
  };

  return (
    <div className="w-full bg-background/95 backdrop-blur border rounded-xl shadow-md p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`flex-shrink-0 w-10 h-10 rounded-lg ${style.bg} flex items-center justify-center`}>
            <Icon className={`w-5 h-5 ${style.text}`} />
          </div>
          <div className="min-w-0">
            <div className="font-medium text-sm truncate">{entity.name}</div>
            <div className="text-xs text-muted-foreground font-mono truncate">{entity.device_id}</div>
          </div>
        </div>
        <button
          onClick={handleClose}
          className="flex-shrink-0 p-1 rounded-lg hover:bg-muted transition-colors"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      <div className="flex items-center gap-1.5 mb-3">
        <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
          {formatLabel(entity.type)}
        </span>
        <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[entity.status] ?? ""}`}>
          {formatLabel(entity.status)}
        </span>
        <span className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
          <MapPin className="w-3 h-3" />
          {entity.lat.toFixed(4)}, {entity.lng.toFixed(4)}
        </span>
      </div>

      {entity.description && (
        <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{entity.description}</p>
      )}

      {entity.attributes && Object.keys(entity.attributes).length > 0 && (
        <div className="mb-3">
          <pre className="text-xs bg-muted p-2 rounded-lg overflow-x-auto max-h-20 overflow-y-auto">
            {JSON.stringify(entity.attributes, null, 2)}
          </pre>
        </div>
      )}

      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          className="flex-1"
          onClick={() => setActiveOverlay("edit")}
        >
          Edit
        </Button>
        <Popover open={deleteOpen} onOpenChange={setDeleteOpen}>
          <PopoverTrigger
            render={
              <Button
                size="sm"
                variant="destructive"
                className="flex-1"
                disabled={deleteMut.isPending}
              >
                {deleteMut.isPending ? "Deleting..." : "Delete"}
              </Button>
            }
          />
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
                  onClick={() => {
                    setDeleteOpen(false);
                    handleDelete();
                  }}
                  disabled={deleteMut.isPending}
                >
                  {deleteMut.isPending ? "Deleting..." : "Delete"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setDeleteOpen(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};
