import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/libs/query";
import { Toaster } from "sonner";
import { MapPin } from "lucide-react";
import { EntityMap } from "@/components/map/EntityMap";
import { BottomNavigation } from "@/components/BottomNavigation";
import { InAreaCard } from "@/components/InAreaCard";
import { EntityDetailCard } from "@/components/EntityDetailCard";
import { EntityEditCard } from "@/components/EntityEditCard";
import { EntityAddCard } from "@/components/EntityAddCard";
import { EntityFilterCard } from "@/components/EntityFilterCard";
import { DeleteConfirm } from "@/components/DeleteConfirm";
import { useUIStore } from "@/store/ui";

function SharedContainer() {
  const activeOverlay = useUIStore((s) => s.activeOverlay);
  const selectedEntityId = useUIStore((s) => s.selectedEntityId);

  if (activeOverlay === "add") return <EntityAddCard />;
  if (activeOverlay === "edit") return <EntityEditCard />;
  if (activeOverlay === "filter") return <EntityFilterCard />;
  if (selectedEntityId && activeOverlay === "none") return <EntityDetailCard />;
  return <InAreaCard />;
}

export default function App() {
  const activeOverlay = useUIStore((s) => s.activeOverlay);
  const selectedEntityId = useUIStore((s) => s.selectedEntityId);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="w-screen h-screen relative overflow-hidden">
        <EntityMap />

        {/* Floating bottom-center: shared container + controls */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex flex-col items-stretch gap-2 w-[calc(100vw-2rem)] max-w-2xl">
          {!useUIStore((s) => s.pickMode) && <SharedContainer />}
          <BottomNavigation />
        </div>

        {/* Pick-mode banner — replaces shared container */}
        {useUIStore((s) => s.pickMode) && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 w-[calc(100vw-2rem)] max-w-2xl">
            <div className="bg-background/95 backdrop-blur border rounded-xl shadow-md px-4 py-3 flex items-center gap-3">
              <MapPin className="w-5 h-5 text-primary animate-pulse flex-shrink-0" />
              <span className="text-sm font-medium">Click the map to place the entity</span>
            </div>
          </div>
        )}

        {/* Delete confirmation — kept as dialog */}
        <DeleteConfirm
          open={activeOverlay === "delete"}
          entityId={selectedEntityId}
          onClose={() => useUIStore.getState().setActiveOverlay("none")}
        />
      </div>
      <Toaster />
    </QueryClientProvider>
  );
}
