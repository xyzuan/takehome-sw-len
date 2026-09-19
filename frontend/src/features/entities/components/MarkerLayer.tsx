import { useRef } from "react";
import { MapMarker, MarkerContent, MarkerTooltip } from "@/components/ui/map";
import type { Entity } from "@/interfaces/entity";
import { typeStyles, statusDot } from "@/constants/entity";

interface MarkerLayerProps {
  entities: Entity[];
  onSelect: (entity: Entity) => void;
}

export const MarkerLayer = ({ entities, onSelect }: MarkerLayerProps) => {
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
                className={`relative p-1 rounded-full ${style.bg} shadow-md cursor-pointer hover:scale-110 transition-transform`}
              >
                <Icon className={`w-5 h-5 ${style.text}`} />
                <span className={`absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white shadow-sm ${statusDot[entity.status] ?? "bg-gray-400"}`}>
                  <span className={`absolute inset-0 rounded-full animate-ping opacity-75 ${statusDot[entity.status] ?? "bg-gray-400"}`} />
                </span>
              </div>
            </MarkerContent>
            <MarkerTooltip>
              <span className="font-medium">{entity.name}</span>
            </MarkerTooltip>
          </MapMarker>
        );
      })}
    </>
  );
}
