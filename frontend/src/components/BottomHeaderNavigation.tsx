import { useEffect } from "react";
import { Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUIStore } from "@/store/ui";

interface BottomHeaderNavigationProps {
  show: boolean;
  title?: string;
}

export function BottomHeaderNavigation({ show, title = "Entities in This Area" }: BottomHeaderNavigationProps) {
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
    <div className="flex items-center justify-between bg-background/90 backdrop-blur border rounded-lg shadow-md px-4 py-2">
      {show && (
        <span className="text-sm font-medium text-foreground truncate">{title}</span>
      )}
      {!show && <span />}

      <Button
        size="sm"
        variant="ghost"
        onClick={toggleDarkMode}
        className="h-8 w-8 p-0"
      >
        {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </Button>
    </div>
  );
}
