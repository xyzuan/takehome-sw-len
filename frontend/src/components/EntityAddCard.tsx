import { ArrowLeft, MapPin } from "lucide-react";
import { EntityForm } from "@/features/entities/EntityForm";
import { useUIStore } from "@/store/ui";

export function EntityAddCard() {
  const setActiveOverlay = useUIStore((s) => s.setActiveOverlay);
  const draftLatLng = useUIStore((s) => s.draftLatLng);
  const pickMode = useUIStore((s) => s.pickMode);

  const handleBack = () => {
    useUIStore.getState().setPickMode(false);
    useUIStore.getState().setDraftLatLng(null);
    useUIStore.getState().setDraftEntity(null);
    setActiveOverlay("none");
  };

  const showPlaceholder = pickMode && !draftLatLng;

  return (
    <div className="w-full max-h-[60vh] overflow-y-auto bg-background/95 backdrop-blur border rounded-xl shadow-md p-4">
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={handleBack}
          className="flex-shrink-0 p-1 rounded-lg hover:bg-muted transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-medium">Add Entity</span>
        {draftLatLng && !pickMode && (
          <span className="text-xs text-muted-foreground ml-auto">
            {draftLatLng.lat.toFixed(4)}, {draftLatLng.lng.toFixed(4)}
          </span>
        )}
      </div>

      {showPlaceholder ? (
        <div className="flex items-center gap-3 py-8 justify-center">
          <MapPin className="w-5 h-5 text-primary animate-pulse flex-shrink-0" />
          <span className="text-sm text-muted-foreground">Click the map to place the entity</span>
        </div>
      ) : (
        <EntityForm onDone={handleBack} />
      )}
    </div>
  );
}
