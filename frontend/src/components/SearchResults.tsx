import { useEffect, useRef } from "react";
import { ArrowLeft, Search, Car, Cpu, Building, Circle } from "lucide-react";
import { useSearchEntities } from "@/features/entities/hooks";
import { useUIStore } from "@/store/ui";
import { EntityCardSkeleton } from "@/components/EntityCardSkeleton";
import type { Entity } from "@/interface/entity.interface";

const typeStyles: Record<string, { icon: typeof Car; bg: string; text: string }> = {
  vehicle: { icon: Car, bg: "bg-blue-500", text: "text-white" },
  iot: { icon: Cpu, bg: "bg-purple-500", text: "text-white" },
  facility: { icon: Building, bg: "bg-green-500", text: "text-white" },
  other: { icon: Circle, bg: "bg-gray-500", text: "text-white" },
};

export function SearchResults() {
  const search = useUIStore((s) => s.search);
  const typeFilter = useUIStore((s) => s.typeFilter);
  const statusFilter = useUIStore((s) => s.statusFilter);
  const setActiveOverlay = useUIStore((s) => s.setActiveOverlay);
  const setSearch = useUIStore((s) => s.setSearch);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useSearchEntities(
    search,
    typeFilter,
    statusFilter,
  );

  const scrollRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { root: scrollRef.current, threshold: 0.1 },
    );
    if (sentinelRef.current) observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const handleBack = () => {
    setSearch("");
    setActiveOverlay("none");
  };

  const handleCardClick = (entity: Entity) => {
    useUIStore.getState().setSelectedEntityId(entity.id);
    useUIStore.getState().setPendingFlyTo({ lat: entity.lat, lng: entity.lng });
    useUIStore.getState().setSearch("");
    setActiveOverlay("none");
  };

  const allEntities = data?.pages.flatMap((p) => p.data) ?? [];

  return (
    <div className="w-full bg-background/95 backdrop-blur border rounded-xl shadow-md p-4">
      <div className="flex items-center gap-2 mb-3">
        <button
          onClick={handleBack}
          className="flex-shrink-0 p-1 rounded-lg hover:bg-muted transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        <span className="text-sm font-medium truncate">"{search}"</span>
        {data?.pages[0]?.meta && (
          <span className="text-xs text-muted-foreground ml-auto flex-shrink-0">
            {data.pages[0].meta.total} results
          </span>
        )}
      </div>

      <div ref={scrollRef} className="max-h-[50vh] overflow-y-auto space-y-2 -mr-2 pr-2">
        {isLoading && (
          <>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i}>
                <EntityCardSkeleton />
              </div>
            ))}
          </>
        )}

        {!isLoading && allEntities.length === 0 && (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No entities found for "{search}"
          </div>
        )}

        {allEntities.map((entity) => {
          const style = typeStyles[entity.type] ?? typeStyles.other;
          const Icon = style.icon;
          return (
          <button
            key={entity.id}
            onClick={() => handleCardClick(entity)}
            className="w-full text-left flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <div className={`flex-shrink-0 w-8 h-8 rounded-lg ${style.bg} flex items-center justify-center`}>
              <Icon className={`w-4 h-4 ${style.text}`} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-medium text-sm truncate">{entity.name}</div>
              <div className="text-xs text-muted-foreground font-mono truncate">{entity.device_id}</div>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                {entity.type}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                entity.status === "active" ? "bg-green-100 text-green-700" :
                entity.status === "inactive" ? "bg-gray-100 text-gray-500" :
                "bg-amber-100 text-amber-700"
              }`}>
                {entity.status}
              </span>
            </div>
          </button>
          );
        })}

        {isFetchingNextPage && (
          <div className="py-2 flex justify-center">
            <div className="w-4 h-4 border-2 border-muted border-t-foreground rounded-full animate-spin" />
          </div>
        )}

        <div ref={sentinelRef} className="h-1" />
      </div>
    </div>
  );
}
