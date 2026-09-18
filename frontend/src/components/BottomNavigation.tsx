import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
      className={`h-10 overflow-hidden whitespace-nowrap transition-all duration-300 ease-out shadow-md ${active ? "ring-2 ring-ring/30" : ""} ${variant === "outline" ? "bg-background/95 backdrop-blur dark:bg-background/95 dark:border-border dark:hover:bg-muted" : ""}`}
      style={{
        width: hovered ? "auto" : "2.5rem",
        minWidth: "2.5rem",
        paddingLeft: hovered ? "0.875rem" : "0.625rem",
        paddingRight: hovered ? "0.875rem" : "0.625rem",
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

export function BottomNavigation() {
  const setPickMode = useUIStore((s) => s.setPickMode);
  const pickMode = useUIStore((s) => s.pickMode);
  const search = useUIStore((s) => s.search);
  const setSearch = useUIStore((s) => s.setSearch);
  const darkMode = useUIStore((s) => s.darkMode);
  const toggleDarkMode = useUIStore((s) => s.toggleDarkMode);
  const setActiveOverlay = useUIStore((s) => s.setActiveOverlay);
  const activeOverlay = useUIStore((s) => s.activeOverlay);
  const typeFilter = useUIStore((s) => s.typeFilter);
  const statusFilter = useUIStore((s) => s.statusFilter);

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [darkMode]);

  const isFilterActive = !!typeFilter || !!statusFilter || activeOverlay === "filter";

  return (
    <div className="flex items-center gap-2 w-full">
      <Input
        placeholder="Search by name..."
        value={search}
        onChange={(e) => {
          const v = e.target.value;
          setSearch(v);
          if (v.length > 0) {
            useUIStore.getState().setSelectedEntityId(null);
            setActiveOverlay("search");
          } else if (activeOverlay === "search") {
            setActiveOverlay("none");
          }
        }}
        className="h-10 flex-1 min-w-0 bg-background/95 backdrop-blur dark:bg-background/95 shadow-md"
      />

      <ExpandableButton
        icon={<SlidersHorizontal className="w-5 h-5" />}
        label="Filter"
        onClick={() => {
          useUIStore.getState().setSelectedEntityId(null);
          setActiveOverlay(activeOverlay === "filter" ? "none" : "filter");
        }}
        active={isFilterActive}
      />

      <ExpandableButton
        icon={darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        label={darkMode ? "Light" : "Dark"}
        onClick={toggleDarkMode}
        variant="outline"
      />

      <ExpandableButton
        icon={<Plus className="w-5 h-5" />}
        label={pickMode ? "Cancel" : "Add Entity"}
        onClick={() => {
          if (!pickMode) {
            useUIStore.getState().setSelectedEntityId(null);
            useUIStore.getState().setDraftLatLng(null);
            useUIStore.getState().setActiveOverlay("add");
          }
          setPickMode(!pickMode);
        }}
        variant={pickMode ? "secondary" : "default"}
        active={pickMode}
      />
    </div>
  );
}
