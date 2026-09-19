import { useMapEntities } from "@/services/entity";
import { useUIStore } from "@/store/ui";

export const DebugOverlay = () => {
  const bbox = useUIStore((s) => s.bbox);
  const darkMode = useUIStore((s) => s.darkMode);
  const typeFilter = useUIStore((s) => s.typeFilter);
  const statusFilter = useUIStore((s) => s.statusFilter);
  const renderedCount = useUIStore((s) => s.renderedCount);
  const selectedEntityId = useUIStore((s) => s.selectedEntityId);
  const activeOverlay = useUIStore((s) => s.activeOverlay);

  const { isPending, isFetching, dataUpdatedAt } = useMapEntities({
    bbox: bbox ?? undefined,
    type: typeFilter,
    status: statusFilter,
  });

  return (
    <div className="absolute top-4 right-4 z-50 bg-black/80 text-white rounded-lg p-3 text-xs font-mono shadow-lg backdrop-blur-sm max-w-xs">
      <div className="font-bold text-green-400 mb-2">DEBUG OVERLAY</div>
      <div className="space-y-1">
        <div className="flex justify-between gap-4">
          <span className="text-gray-400">bbox:</span>
          <span className="text-yellow-300 truncate max-w-[180px]">{bbox ?? "—"}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-gray-400">zoom:</span>
          <span className="text-cyan-300">{darkMode ? "dark" : "light"}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-gray-400">type filter:</span>
          <span className="text-purple-300">{typeFilter || "all"}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-gray-400">status filter:</span>
          <span className="text-purple-300">{statusFilter || "all"}</span>
        </div>
        <div className="border-t border-gray-700 my-1.5" />
        <div className="flex justify-between gap-4">
          <span className="text-gray-400">isPending:</span>
          <span className={isPending ? "text-red-400" : "text-green-400"}>{String(isPending)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-gray-400">isFetching:</span>
          <span className={isFetching ? "text-amber-400" : "text-green-400"}>{String(isFetching)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-gray-400">last fetch:</span>
          <span className="text-cyan-300">{new Date(dataUpdatedAt).toLocaleTimeString()}</span>
        </div>
        <div className="border-t border-gray-700 my-1.5" />
        <div className="flex justify-between gap-4">
          <span className="text-gray-400">markers:</span>
          <span className="text-green-400 font-bold">{renderedCount}</span>
        </div>
        <div className="border-t border-gray-700 my-1.5" />
        <div className="flex justify-between gap-4">
          <span className="text-gray-400">overlay:</span>
          <span className="text-blue-300">{activeOverlay}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-gray-400">selected:</span>
          <span className="text-blue-300 truncate max-w-[120px]">{selectedEntityId ?? "—"}</span>
        </div>
      </div>
    </div>
  );
};
