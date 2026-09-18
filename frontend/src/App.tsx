import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/libs/query";
import { Toaster } from "sonner";
import { EntityMap } from "@/components/map/EntityMap";
import { BottomNavigation } from "@/components/BottomNavigation";
import { BottomHeaderNavigation } from "@/components/BottomHeaderNavigation";
import { InAreaCard } from "@/components/InAreaCard";
import { EntityDetailCard } from "@/components/EntityDetailCard";
import { EntityDialog } from "@/components/EntityDialog";
import { DeleteConfirm } from "@/components/DeleteConfirm";
import { useUIStore } from "@/store/ui";

export default function App() {
  const activeOverlay = useUIStore((s) => s.activeOverlay);
  const selectedEntityId = useUIStore((s) => s.selectedEntityId);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="w-screen h-screen relative overflow-hidden">
        <EntityMap />

        {/* Floating bottom-center: header + entity detail or in-area cards + controls */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex flex-col items-stretch gap-2 w-[calc(100vw-2rem)] max-w-2xl">
          <BottomHeaderNavigation show={!selectedEntityId} />
          {selectedEntityId ? <EntityDetailCard /> : <InAreaCard />}
          <BottomNavigation />
        </div>

        {/* Pick-mode banner */}
        {useUIStore((s) => s.pickMode) && (
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-10 bg-background/90 backdrop-blur px-4 py-2 rounded-lg shadow-md border">
            <span className="text-sm font-medium">Click the map to place the entity</span>
          </div>
        )}

        {/* Add/Edit dialog */}
        <EntityDialog
          open={activeOverlay === "add" || activeOverlay === "edit"}
          mode={activeOverlay === "edit" ? "edit" : "add"}
          entityId={selectedEntityId}
          onClose={() => useUIStore.getState().setActiveOverlay("none")}
        />

        {/* Delete confirmation */}
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
