import { ArrowLeft } from "lucide-react";
import { EntityForm } from "@/features/entities/EntityForm";
import { useEntity } from "@/features/entities/hooks";
import { useUIStore } from "@/store/ui";

export function EntityEditCard() {
  const selectedEntityId = useUIStore((s) => s.selectedEntityId);
  const { data: entity } = useEntity(selectedEntityId);
  const setActiveOverlay = useUIStore((s) => s.setActiveOverlay);

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
        <span className="text-sm font-medium">Edit Entity</span>
      </div>
      {entity && <EntityForm entity={entity} onDone={handleBack} />}
    </div>
  );
}
