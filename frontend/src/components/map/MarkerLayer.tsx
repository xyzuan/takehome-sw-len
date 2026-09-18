import { useRef } from "react";
import { MapMarker, MarkerContent } from "@/components/ui/map";
import { Car, Cpu, Building, Circle } from "lucide-react";
import type { Entity } from "@/interface/entity.interface";

const typeStyles: Record<string, { icon: typeof Car; color: string }> = {
  vehicle: { icon: Car, color: "text-blue-500" },
  iot: { icon: Cpu, color: "text-purple-500" },
  facility: { icon: Building, color: "text-green-500" },
  other: { icon: Circle, color: "text-gray-500" },
};

const statusRing: Record<string, string> = {
  active: "ring-2 ring-blue-400",
  inactive: "opacity-50",
  maintenance: "ring-2 ring-amber-400",
};

interface MarkerLayerProps {
  entities: Entity[];
  onSelect: (entity: Entity) => void;
}

export function MarkerLayer({ entities, onSelect }: MarkerLayerProps) {
  const knownIdsRef = useRef<Set<string>>(new Set());
  const currentIds = new Set(entities.map((e) => e.id));
  const newIds = new Set<string>();

  for (const id of currentIds) {
    if (!knownIdsRef.current.has(id)) {
      newIds.add(id);
    }
  }

  // Only remember IDs when we have data — preserves the known set
  // across refetch gaps (when entities briefly becomes empty).
  if (entities.length > 0) {
    knownIdsRef.current = currentIds;
  }

  return (
    <>
      {entities.map((entity) => {
        const style = typeStyles[entity.type] ?? typeStyles.other;
        const Icon = style.icon;
        const isNew = newIds.has(entity.id);
        return (
          <MapMarker
            key={entity.id}
            longitude={entity.lng}
            latitude={entity.lat}
            onClick={() => onSelect(entity)}
          >
            <MarkerContent>
              <div
                ref={
                  isNew
                    ? (el) => {
                      if (el) {
                        el.animate(
                          [
                            { opacity: 0, transform: "scale(0.5)" },
                            { opacity: 1, transform: "scale(1)" },
                          ],
                          { duration: 300, easing: "ease-out", fill: "forwards" },
                        );
                      }
                    }
                    : undefined
                }
                className={`p-1 rounded-full bg-background shadow-md cursor-pointer hover:scale-110 transition-transform ${statusRing[entity.status] ?? ""}`}
              >
                <Icon className={`w-5 h-5 ${style.color}`} />
              </div>
            </MarkerContent>
          </MapMarker>
        );
      })}
    </>
  );
}
