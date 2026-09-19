import type { Entity } from "@/interfaces/entity";
import { formatLabel } from "@/constants/labels";
import { typeStyles, statusColors } from "@/constants/entity";

interface EntityCardProps {
  entity: Entity;
  onClick: (entity: Entity) => void;
}

export const EntityCard = ({ entity, onClick }: EntityCardProps) => {
  const style = typeStyles[entity.type] ?? typeStyles.other;
  const Icon = style.icon;

  return (
    <button
      onClick={() => onClick(entity)}
      className="flex-shrink-0 w-56 text-left bg-background/95 backdrop-blur border rounded-xl shadow-md p-3 hover:shadow-lg hover:border-primary/30 transition-all"
    >
      <div className="flex items-start gap-3">
        <div className={`flex-shrink-0 w-9 h-9 rounded-lg ${style.bg} flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${style.text}`} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-medium text-sm truncate">{entity.name}</div>
          <div className="text-xs text-muted-foreground font-mono truncate">{entity.device_id}</div>
        </div>
      </div>
      <div className="flex items-center gap-1.5 mt-2">
        <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
          {formatLabel(entity.type)}
        </span>
        <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[entity.status] ?? ""}`}>
          {formatLabel(entity.status)}
        </span>
      </div>
    </button>
  );
};
