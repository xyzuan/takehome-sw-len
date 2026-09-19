import type { ReactNode } from "react";
import { EntityMap } from "./components/EntityMap";
import { EntityContainer } from "./components/EntityContainer";
import { BottomNavigation } from "./components/BottomNavigation";
import { DebugOverlay } from "./components/DebugOverlay";
import { useUIStore } from "@/store/ui";

export const Entities = ({ children }: { children?: ReactNode }) => {
  const debugMode = useUIStore((s) => s.debugMode);

  return (
    <>
      <EntityMap>{children}</EntityMap>

      {debugMode && <DebugOverlay />}

      {/* Floating bottom-center: shared container + controls */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex flex-col items-stretch gap-2 w-[calc(100vw-2rem)] max-w-2xl">
        <EntityContainer />
        <BottomNavigation />
      </div>
    </>
  );
};
