import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/libs/query";
import { Toaster } from "sonner";
import { EntityMap } from "@/features/entities/components/EntityMap";
import { BottomNavigation } from "@/features/entities/components/BottomNavigation";
import { InAreaCard } from "@/features/entities/components/InAreaCard";
import { EntityDetailCard } from "@/features/entities/components/EntityDetailCard";
import { EntityEditCard } from "@/features/entities/components/EntityEditCard";
import { EntityAddCard } from "@/features/entities/components/EntityAddCard";
import { EntityFilterCard } from "@/features/entities/components/EntityFilterCard";
import { SearchResults } from "@/features/entities/components/SearchResults";
import { DeleteConfirm } from "@/features/entities/components/DeleteConfirm";
import { useUIStore } from "@/store/ui";

function SharedContainer() {
  const activeOverlay = useUIStore((s) => s.activeOverlay);
  const selectedEntityId = useUIStore((s) => s.selectedEntityId);

  if (activeOverlay === "search") return <SearchResults />;
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
          <SharedContainer />
          <BottomNavigation />
        </div>

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
