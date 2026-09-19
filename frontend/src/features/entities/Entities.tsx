import type { ReactNode } from "react";
import { EntityMap } from "./components/EntityMap";
import { BottomNavigation } from "./components/BottomNavigation";
import { InAreaCard } from "./components/InAreaCard";
import { EntityDetailCard } from "./components/EntityDetailCard";
import { EntityEditCard } from "./components/EntityEditCard";
import { EntityAddCard } from "./components/EntityAddCard";
import { EntityFilterCard } from "./components/EntityFilterCard";
import { SearchResults } from "./components/SearchResults";
import { useUIStore } from "@/store/ui";

const SharedContainer = () => {
  const activeOverlay = useUIStore((s) => s.activeOverlay);
  const selectedEntityId = useUIStore((s) => s.selectedEntityId);

  if (activeOverlay === "search") return <SearchResults />;
  if (activeOverlay === "add") return <EntityAddCard />;
  if (activeOverlay === "edit") return <EntityEditCard />;
  if (activeOverlay === "filter") return <EntityFilterCard />;
  if (selectedEntityId && activeOverlay === "none") return <EntityDetailCard />;
  return <InAreaCard />;
}

export const Entities = ({ children }: { children?: ReactNode }) => {
  return (
    <>
      <EntityMap>{children}</EntityMap>

      {/* Floating bottom-center: shared container + controls */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex flex-col items-stretch gap-2 w-[calc(100vw-2rem)] max-w-2xl">
        <SharedContainer />
        <BottomNavigation />
      </div>
    </>
  );
}
