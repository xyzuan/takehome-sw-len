import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useEntity } from "@/features/entities/hooks";
import { useUIStore } from "@/store/ui";

interface EntityDetailProps {
  open: boolean;
  entityId: string | null;
  onClose: () => void;
}

export function EntityDetail({ open, entityId, onClose }: EntityDetailProps) {
  const { data: entity } = useEntity(entityId);
  const setActiveOverlay = useUIStore((s) => s.setActiveOverlay);

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-96 overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{entity?.name ?? "Entity"}</SheetTitle>
        </SheetHeader>
        {entity && (
          <div className="space-y-4 mt-4">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Device ID</dt>
                <dd className="font-mono">{entity.device_id}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Type</dt>
                <dd>{entity.type}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Status</dt>
                <dd>{entity.status}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Location</dt>
                <dd>{entity.lat.toFixed(4)}, {entity.lng.toFixed(4)}</dd>
              </div>
              {entity.description && (
                <div>
                  <dt className="text-muted-foreground">Description</dt>
                  <dd className="mt-1">{entity.description}</dd>
                </div>
              )}
            </dl>

            {entity.attributes && Object.keys(entity.attributes).length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-1">Attributes</h4>
                <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                  {JSON.stringify(entity.attributes, null, 2)}
                </pre>
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setActiveOverlay("edit")}
              >
                Edit
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => setActiveOverlay("delete")}
              >
                Delete
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
