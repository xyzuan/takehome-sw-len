import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUIStore } from "@/store/ui";
import { Plus } from "lucide-react";

export function TopBar() {
  const setPickMode = useUIStore((s) => s.setPickMode);
  const pickMode = useUIStore((s) => s.pickMode);
  const search = useUIStore((s) => s.search);
  const setSearch = useUIStore((s) => s.setSearch);
  const typeFilter = useUIStore((s) => s.typeFilter);
  const setTypeFilter = useUIStore((s) => s.setTypeFilter);
  const statusFilter = useUIStore((s) => s.statusFilter);
  const setStatusFilter = useUIStore((s) => s.setStatusFilter);

  const handleAdd = () => {
    setPickMode(!pickMode);
  };

  return (
    <div className="flex items-center gap-3 bg-background/90 backdrop-blur border rounded-lg shadow-md px-4 py-2">
      <span className="font-semibold text-sm">Geo Entity Map</span>

      <Input
        placeholder="Search by name..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-xs h-8"
      />

      <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v ?? "")}>
        <SelectTrigger className="w-28 h-8">
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

      <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? "")}>
        <SelectTrigger className="w-28 h-8">
          <SelectValue placeholder="All status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">All</SelectItem>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="inactive">Inactive</SelectItem>
          <SelectItem value="maintenance">Maintenance</SelectItem>
        </SelectContent>
      </Select>

      <Button size="sm" onClick={handleAdd} variant={pickMode ? "secondary" : "default"}>
        <Plus className="w-4 h-4 mr-1" />
        {pickMode ? "Cancel" : "Add Entity"}
      </Button>
    </div>
  );
}
