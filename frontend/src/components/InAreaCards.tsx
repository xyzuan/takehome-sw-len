import { useMemo } from "react";
import { EntityCard } from "@/components/EntityCard";
import { useMapEntities } from "@/features/entities/hooks";
import { useUIStore } from "@/store/ui";
import type { Entity } from "@/interface/entity.interface";

export function InAreaCards() {
  const bbox = useUIStore((s) => s.bbox);
  const typeFilter = useUIStore((s) => s.typeFilter);
  const statusFilter = useUIStore((s) => s.statusFilter);
  const search = useUIStore((s) => s.search);
  const { data: entities } = useMapEntities(bbox, typeFilter, statusFilter);

  const filtered = useMemo(() => {
    if (!entities) return [];
    if (!search) return entities;
    const q = search.toLowerCase();
    return entities.filter((e) => e.name.toLowerCase().includes(q));
  }, [entities, search]);

  const handleCardClick = (entity: Entity) => {
    useUIStore.getState().setSelectedEntityId(entity.id);
    useUIStore.getState().setPendingFlyTo({ lat: entity.lat, lng: entity.lng });
    useUIStore.getState().setActiveOverlay("detail");
  };

  if (!filtered || filtered.length === 0) return null;

  return (
    <div className="w-full min-w-0 flex gap-3 overflow-x-auto overscroll-x-contain pb-1 scroll-smooth snap-x" style={{ scrollbarWidth: "thin" }}>
      {filtered.map((entity) => (
        <div key={entity.id} className="snap-start flex-shrink-0">
          <EntityCard entity={entity} onClick={handleCardClick} />
        </div>
      ))}
    </div>
  );
}
