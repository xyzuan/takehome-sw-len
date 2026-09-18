import { Car, Cpu, Building, Circle, X, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEntity } from "@/features/entities/hooks";
import { useUIStore } from "@/store/ui";

const typeStyles: Record<string, { icon: typeof Car; color: string; bg: string }> = {
  vehicle: { icon: Car, color: "text-blue-600", bg: "bg-blue-50" },
  iot: { icon: Cpu, color: "text-purple-600", bg: "bg-purple-50" },
  facility: { icon: Building, color: "text-green-600", bg: "bg-green-50" },
  other: { icon: Circle, color: "text-gray-600", bg: "bg-gray-50" },
};

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  inactive: "bg-gray-100 text-gray-500",
  maintenance: "bg-amber-100 text-amber-700",
};

export function EntityDetailCard() {
  const selectedEntityId = useUIStore((s) => s.selectedEntityId);
  const { data: entity } = useEntity(selectedEntityId);
  const setActiveOverlay = useUIStore((s) => s.setActiveOverlay);
  const setSelectedEntityId = useUIStore((s) => s.setSelectedEntityId);

  if (!entity) return null;

  const style = typeStyles[entity.type] ?? typeStyles.other;
  const Icon = style.icon;

  const handleClose = () => {
    setSelectedEntityId(null);
    setActiveOverlay("none");
  };

  return (
    <div className="w-full bg-background/95 backdrop-blur border rounded-xl shadow-md p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`flex-shrink-0 w-10 h-10 rounded-lg ${style.bg} flex items-center justify-center`}>
            <Icon className={`w-5 h-5 ${style.color}`} />
          </div>
          <div className="min-w-0">
            <div className="font-medium text-sm truncate">{entity.name}</div>
            <div className="text-xs text-muted-foreground font-mono truncate">{entity.device_id}</div>
          </div>
        </div>
        <button
          onClick={handleClose}
          className="flex-shrink-0 p-1 rounded-lg hover:bg-muted transition-colors"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      <div className="flex items-center gap-1.5 mb-3">
        <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
          {entity.type}
        </span>
        <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[entity.status] ?? ""}`}>
          {entity.status}
        </span>
        <span className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
          <MapPin className="w-3 h-3" />
          {entity.lat.toFixed(4)}, {entity.lng.toFixed(4)}
        </span>
      </div>

      {entity.description && (
        <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{entity.description}</p>
      )}

      {entity.attributes && Object.keys(entity.attributes).length > 0 && (
        <div className="mb-3">
          <pre className="text-xs bg-muted p-2 rounded-lg overflow-x-auto max-h-20 overflow-y-auto">
            {JSON.stringify(entity.attributes, null, 2)}
          </pre>
        </div>
      )}

      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          className="flex-1"
          onClick={() => setActiveOverlay("edit")}
        >
          Edit
        </Button>
        <Button
          size="sm"
          variant="destructive"
          className="flex-1"
          onClick={() => setActiveOverlay("delete")}
        >
          Delete
        </Button>
      </div>
    </div>
  );
}
