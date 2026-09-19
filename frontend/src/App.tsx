import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/libs/query";
import { Toaster } from "@/components/ui/sonner";
import { Entities } from "@/features/entities/Entities";
import { DeleteConfirm } from "@/features/entities/components/DeleteConfirm";
import { useUIStore } from "@/store/ui";

export default function App() {
  const activeOverlay = useUIStore((s) => s.activeOverlay);
  const selectedEntityId = useUIStore((s) => s.selectedEntityId);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="w-screen h-screen relative overflow-hidden">
        <Entities />

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
