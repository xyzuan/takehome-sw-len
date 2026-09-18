import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUIStore } from "@/store/ui";
import { Plus, SlidersHorizontal, Sun, Moon } from "lucide-react";

function ExpandableButton({
  icon,
  label,
  onClick,
  variant = "outline",
  active,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  variant?: "ghost" | "default" | "secondary" | "destructive" | "outline";
  active?: boolean;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <Button
      size="sm"
      variant={variant}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`h-8 overflow-hidden whitespace-nowrap transition-all duration-300 ease-out ${active ? "ring-2 ring-ring/30" : ""} ${variant === "outline" ? "dark:bg-card dark:border-border dark:hover:bg-secondary" : ""}`}
      style={{
        width: hovered ? "auto" : "2rem",
        minWidth: "2rem",
        paddingLeft: hovered ? "0.75rem" : "0.5rem",
        paddingRight: hovered ? "0.75rem" : "0.5rem",
      }}
    >
      <span className="flex items-center gap-1.5">
        {icon}
        <span
          className="transition-all duration-300 ease-out overflow-hidden"
          style={{
            opacity: hovered ? 1 : 0,
            maxWidth: hovered ? "120px" : "0px",
            marginLeft: hovered ? "0" : "-6px",
          }}
        >
          {label}
        </span>
      </span>
    </Button>
  );
}

function FilterButton() {
  const typeFilter = useUIStore((s) => s.typeFilter);
  const setTypeFilter = useUIStore((s) => s.setTypeFilter);
  const statusFilter = useUIStore((s) => s.statusFilter);
  const setStatusFilter = useUIStore((s) => s.setStatusFilter);
  const [hovered, setHovered] = useState(false);
  const [open, setOpen] = useState(false);
  const isActive = !!typeFilter || !!statusFilter;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <button
            type="button"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            className={`h-8 inline-flex items-center justify-center rounded-lg text-sm font-medium transition-all duration-300 ease-out overflow-hidden whitespace-nowrap bg-background text-foreground border border-border hover:bg-muted dark:bg-card dark:border-border dark:hover:bg-secondary ${isActive || open ? "ring-2 ring-ring/30" : ""}`}
            style={{
              width: hovered ? "auto" : "2rem",
              minWidth: "2rem",
              paddingLeft: hovered ? "0.75rem" : "0.5rem",
              paddingRight: hovered ? "0.75rem" : "0.5rem",
            }}
          >
            <span className="flex items-center gap-1.5">
              <SlidersHorizontal className="w-4 h-4" />
              <span
                className="transition-all duration-300 ease-out overflow-hidden"
                style={{
                  opacity: hovered ? 1 : 0,
                  maxWidth: hovered ? "120px" : "0px",
                  marginLeft: hovered ? "0" : "-6px",
                }}
              >
                Filter
              </span>
            </span>
          </button>
        }
      />
      <PopoverContent className="w-56 p-3" align="end" side="top">
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
      </PopoverContent>
    </Popover>
  );
}

export function BottomNavigation() {
  const setPickMode = useUIStore((s) => s.setPickMode);
  const pickMode = useUIStore((s) => s.pickMode);
  const search = useUIStore((s) => s.search);
  const setSearch = useUIStore((s) => s.setSearch);
  const darkMode = useUIStore((s) => s.darkMode);
  const toggleDarkMode = useUIStore((s) => s.toggleDarkMode);

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [darkMode]);

  return (
    <div className="flex items-center gap-2 w-full">
      <Input
        placeholder="Search by name..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="h-8 flex-1 min-w-0 bg-background dark:bg-card"
      />

      <FilterButton />

      <ExpandableButton
        icon={darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        label={darkMode ? "Light" : "Dark"}
        onClick={toggleDarkMode}
        variant="outline"
      />

      <ExpandableButton
        icon={<Plus className="w-4 h-4" />}
        label={pickMode ? "Cancel" : "Add Entity"}
        onClick={() => setPickMode(!pickMode)}
        variant={pickMode ? "secondary" : "default"}
        active={pickMode}
      />
    </div>
  );
}
