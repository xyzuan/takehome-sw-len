import { ArrowLeft } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUIStore } from "@/store/ui";

export const EntityFilterCard = () => {
  const setActiveOverlay = useUIStore((s) => s.setActiveOverlay);
  const typeFilter = useUIStore((s) => s.typeFilter);
  const setTypeFilter = useUIStore((s) => s.setTypeFilter);
  const statusFilter = useUIStore((s) => s.statusFilter);
  const setStatusFilter = useUIStore((s) => s.setStatusFilter);

  const handleBack = () => {
    setActiveOverlay("none");
  };

  const handleClear = () => {
    setTypeFilter("");
    setStatusFilter("");
  };

  const hasFilters = !!typeFilter || !!statusFilter;

  return (
    <div className="w-full bg-background/95 backdrop-blur border rounded-xl shadow-md p-4">
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={handleBack}
          className="flex-shrink-0 p-1 rounded-lg hover:bg-muted transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-medium">Filter</span>
        {hasFilters && (
          <button
            onClick={handleClear}
            className="text-xs text-muted-foreground hover:text-foreground ml-auto transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Type</label>
          <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v ?? "")}>
            <SelectTrigger className="h-8 w-full">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All</SelectItem>
              <SelectItem value="vehicle">Vehicle</SelectItem>
              <SelectItem value="iot">IoT</SelectItem>
              <SelectItem value="facility">Facility</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Status</label>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? "")}>
            <SelectTrigger className="h-8 w-full">
              <SelectValue placeholder="All status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
