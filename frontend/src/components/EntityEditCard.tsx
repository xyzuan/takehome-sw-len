import { ArrowLeft, MapPin } from "lucide-react";
import { EntityForm } from "@/features/entities/EntityForm";
import { useEntity } from "@/features/entities/hooks";
import { useUIStore } from "@/store/ui";

export function EntityEditCard() {
  const selectedEntityId = useUIStore((s) => s.selectedEntityId);
  const { data: entity } = useEntity(selectedEntityId);
  const setActiveOverlay = useUIStore((s) => s.setActiveOverlay);
  const pickMode = useUIStore((s) => s.pickMode);
  const draftLatLng = useUIStore((s) => s.draftLatLng);

  const handleBack = () => {
    useUIStore.getState().setPickMode(false);
    useUIStore.getState().setDraftLatLng(null);
    setActiveOverlay("none");
  };

  const showPlaceholder = pickMode;

  return (
    <div className="w-full bg-background/95 backdrop-blur border rounded-xl shadow-md p-4">
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={handleBack}
          className="flex-shrink-0 p-1 rounded-lg hover:bg-muted transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-medium">Edit Entity</span>
        {draftLatLng && !pickMode && (
          <span className="text-xs text-muted-foreground ml-auto">
            {draftLatLng.lat.toFixed(4)}, {draftLatLng.lng.toFixed(4)}
          </span>
        )}
      </div>

      {showPlaceholder ? (
        <div className="flex items-center gap-3 py-8 justify-center">
          <MapPin className="w-5 h-5 text-primary animate-pulse flex-shrink-0" />
          <span className="text-sm text-muted-foreground">Click the map to re-pick location</span>
        </div>
      ) : (
        entity && <EntityForm entity={entity} onDone={handleBack} />
      )}
    </div>
  );
}
