import type { ReactNode } from "react";
import { EntityMap } from "./components/EntityMap";
import { EntityContainer } from "./components/EntityContainer";
import { BottomNavigation } from "./components/BottomNavigation";

export const Entities = ({ children }: { children?: ReactNode }) => {
  return (
    <>
      <EntityMap>{children}</EntityMap>

      {/* Floating bottom-center: shared container + controls */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex flex-col items-stretch gap-2 w-[calc(100vw-2rem)] max-w-2xl">
        <EntityContainer />
        <BottomNavigation />
      </div>
    </>
  );
};
