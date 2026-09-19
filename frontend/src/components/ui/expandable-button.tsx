import { useState } from "react";
import { Button } from "@/components/ui/button";

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const DURATION = "280ms";

export const ExpandableButton = ({
  icon,
  label,
  onClick,
  variant = "outline",
  active,
  className,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  variant?: "ghost" | "default" | "secondary" | "destructive" | "outline";
  active?: boolean;
  className?: string;
}) => {
  const [hovered, setHovered] = useState(false);

  return (
    <Button
      size="sm"
      variant={variant}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`h-10 overflow-hidden whitespace-nowrap shadow-md ${active ? "ring-2 ring-ring/30" : ""} ${variant === "outline" ? "bg-background/95 backdrop-blur dark:bg-background/95 dark:border-border dark:hover:bg-muted" : ""} ${className ?? ""}`}
      style={{ minWidth: "2.5rem", paddingLeft: "0.625rem", paddingRight: "0.625rem" }}
    >
      <span className="flex items-center">
        {icon}
        <span
          className="overflow-hidden whitespace-nowrap"
          style={{
            maxWidth: hovered ? "120px" : "0px",
            opacity: hovered ? 1 : 0,
            marginLeft: hovered ? "6px" : "0px",
            transitionProperty: "max-width, opacity, margin",
            transitionDuration: DURATION,
            transitionTimingFunction: EASE,
            transitionDelay: hovered ? "40ms" : "0ms",
          }}
        >
          {label}
        </span>
      </span>
    </Button>
  );
};
