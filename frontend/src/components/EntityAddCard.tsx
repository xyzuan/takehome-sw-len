import { ArrowLeft } from "lucide-react";
import { EntityForm } from "@/features/entities/EntityForm";
import { useUIStore } from "@/store/ui";

export function EntityAddCard() {
  const setActiveOverlay = useUIStore((s) => s.setActiveOverlay);
  const draftLatLng = useUIStore((s) => s.draftLatLng);

  const handleBack = () => {
    useUIStore.getState().setPickMode(false);
    useUIStore.getState().setDraftLatLng(null);
    setActiveOverlay("none");
  };

  return (
    <div className="w-full bg-background/95 backdrop-blur border rounded-xl shadow-md p-4">
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={handleBack}
          className="flex-shrink-0 p-1 rounded-lg hover:bg-muted transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-medium">Add Entity</span>
        {draftLatLng && (
          <span className="text-xs text-muted-foreground ml-auto">
            {draftLatLng.lat.toFixed(4)}, {draftLatLng.lng.toFixed(4)}
          </span>
        )}
      </div>
      <EntityForm onDone={handleBack} />
    </div>
  );
}
