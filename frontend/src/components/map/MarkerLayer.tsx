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
  return (
    <>
      {entities.map((entity) => {
        const style = typeStyles[entity.type] ?? typeStyles.other;
        const Icon = style.icon;
        return (
          <MapMarker
            key={entity.id}
            longitude={entity.lng}
            latitude={entity.lat}
            onClick={() => onSelect(entity)}
          >
            <MarkerContent>
              <div className={`p-1 rounded-full bg-background shadow-md cursor-pointer hover:scale-110 transition-transform ${statusRing[entity.status] ?? ""}`}>
                <Icon className={`w-5 h-5 ${style.color}`} />
              </div>
            </MarkerContent>
          </MapMarker>
        );
      })}
    </>
  );
}
