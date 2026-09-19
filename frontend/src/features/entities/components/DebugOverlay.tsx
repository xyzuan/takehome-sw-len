import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useMapEntities } from "@/services/entity";
import { useUIStore } from "@/store/ui";

const StatusBadge = ({ label, value, color }: { label: string; value: boolean | string; color: string }) => (
  <div className="flex items-center justify-between">
    <span className="text-muted-foreground">{label}</span>
    <Badge variant={value ? "default" : "secondary"} className={color}>{String(value)}</Badge>
  </div>
);

export const DebugOverlay = () => {
  const bbox = useUIStore((s) => s.bbox);
  const darkMode = useUIStore((s) => s.darkMode);
  const typeFilter = useUIStore((s) => s.typeFilter);
  const statusFilter = useUIStore((s) => s.statusFilter);
  const renderedCount = useUIStore((s) => s.renderedCount);
  const selectedEntityId = useUIStore((s) => s.selectedEntityId);
  const activeOverlay = useUIStore((s) => s.activeOverlay);

  const { isPending, isFetching } = useMapEntities({
    bbox: bbox ?? undefined,
    type: typeFilter,
    status: statusFilter,
  });

  const [minLng, minLat, maxLng, maxLat] = bbox ? bbox.split(",") : ["—", "—", "—", "—"];

  return (
    <div className="absolute top-4 right-4 z-50 w-72">
      <Card className="shadow-lg bg-background/80 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-mono">Debug Overlay</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-xs font-mono pt-0">
          <div className="text-muted-foreground mb-1">Query State</div>
          <div className="grid grid-cols-2 gap-1">
            <div className="text-muted-foreground">minLng:</div>
            <div className="truncate">{minLng}</div>
            <div className="text-muted-foreground">minLat:</div>
            <div className="truncate">{minLat}</div>
            <div className="text-muted-foreground">maxLng:</div>
            <div className="truncate">{maxLng}</div>
            <div className="text-muted-foreground">maxLat:</div>
            <div className="truncate">{maxLat}</div>
          </div>

          <Separator />

          <div className="text-muted-foreground mb-1">Filters</div>
          <div className="grid grid-cols-2 gap-1">
            <div className="text-muted-foreground">type:</div>
            <div>{typeFilter || "all"}</div>
            <div className="text-muted-foreground">status:</div>
            <div>{statusFilter || "all"}</div>
            <div className="text-muted-foreground">theme:</div>
            <div>{darkMode ? "dark" : "light"}</div>
          </div>

          <Separator />

          <div className="text-muted-foreground mb-1">Fetch State</div>
          <StatusBadge label="isPending" value={isPending} color={isPending ? "bg-red-500 text-white" : "bg-green-500 text-white"} />
          <StatusBadge label="isFetching" value={isFetching} color={isFetching ? "bg-amber-500 text-white" : "bg-green-500 text-white"} />

          <Separator />

          <div className="text-muted-foreground mb-1">Render</div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">markers:</span>
            <Badge className="bg-green-500 text-white">{renderedCount}</Badge>
          </div>

          <Separator />

          <div className="text-muted-foreground mb-1">UI State</div>
          <div className="grid grid-cols-2 gap-1">
            <div className="text-muted-foreground">overlay:</div>
            <div>{activeOverlay}</div>
            <div className="text-muted-foreground">selected:</div>
            <div className="truncate">{selectedEntityId ?? "—"}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
