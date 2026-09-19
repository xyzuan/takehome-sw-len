import { useState } from "react";
import { Button } from "@/components/ui/button";

export const ExpandableButton = ({
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
}) => {
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
};
