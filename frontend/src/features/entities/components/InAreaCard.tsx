import { useEffect, useMemo, useRef, useState } from "react";
import { EntityCard } from "@/features/entities/components/EntityCard";
import { EntityCardSkeleton } from "@/features/entities/components/EntityCardSkeleton";
import { useMapEntities } from "@/api/entity";
import { useUIStore } from "@/store/ui";
import type { Entity } from "@/interfaces/entity";

const MIN_SKELETON_MS = 400;

export function InAreaCard() {
  const bbox = useUIStore((s) => s.bbox);
  const typeFilter = useUIStore((s) => s.typeFilter);
  const statusFilter = useUIStore((s) => s.statusFilter);
  const search = useUIStore((s) => s.search);
  const { data: entities, isPending, isFetching } = useMapEntities(bbox, typeFilter, statusFilter);

  const [showSkeleton, setShowSkeleton] = useState(false);
  const skeletonStartRef = useRef<number | null>(null);

  useEffect(() => {
    if (isPending) {
      setShowSkeleton(true);
      skeletonStartRef.current = Date.now();
    } else {
      const start = skeletonStartRef.current;
      if (start) {
        const elapsed = Date.now() - start;
        const remaining = Math.max(0, MIN_SKELETON_MS - elapsed);
        const id = setTimeout(() => setShowSkeleton(false), remaining);
        skeletonStartRef.current = null;
        return () => clearTimeout(id);
      }
      setShowSkeleton(false);
    }
  }, [isPending]);

  const filtered = useMemo(() => {
    if (!entities) return [];
    if (!search) return entities;
    const q = search.toLowerCase();
    return entities.filter((e) => e.name.toLowerCase().includes(q));
  }, [entities, search]);

  const handleCardClick = (entity: Entity) => {
    useUIStore.getState().setSelectedEntityId(entity.id);
    useUIStore.getState().setPendingFlyTo({ lat: entity.lat, lng: entity.lng });
  };

  if (showSkeleton) {
    return (
      <div
        className="w-full min-w-0 flex gap-3 overflow-x-auto overscroll-x-contain pb-1 scroll-smooth snap-x animate-fade-in"
        style={{ scrollbarWidth: "thin" }}
      >
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="snap-start flex-shrink-0">
            <EntityCardSkeleton />
          </div>
        ))}
      </div>
    );
  }

  if (!filtered || filtered.length === 0) return null;

  return (
    <div
      className={`w-full min-w-0 flex gap-3 overflow-x-auto overscroll-x-contain pb-1 scroll-smooth snap-x transition-opacity duration-200 ${isFetching ? "opacity-40" : "opacity-100"}`}
      style={{ scrollbarWidth: "thin" }}
    >
      {filtered.map((entity) => (
        <div key={entity.id} className="snap-start flex-shrink-0">
          <EntityCard entity={entity} onClick={handleCardClick} />
        </div>
      ))}
    </div>
  );
}
