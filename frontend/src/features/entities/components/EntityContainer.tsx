import { SearchResults } from "./SearchResults";
import { EntityAddCard } from "./EntityAddCard";
import { EntityEditCard } from "./EntityEditCard";
import { EntityFilterCard } from "./EntityFilterCard";
import { EntityDetailCard } from "./EntityDetailCard";
import { InAreaCard } from "./InAreaCard";
import { useUIStore } from "@/store/ui";

export const EntityContainer = () => {
  const activeOverlay = useUIStore((s) => s.activeOverlay);
  const selectedEntityId = useUIStore((s) => s.selectedEntityId);

  if (activeOverlay === "search") return <SearchResults />;
  if (activeOverlay === "add") return <EntityAddCard />;
  if (activeOverlay === "edit") return <EntityEditCard />;
  if (activeOverlay === "filter") return <EntityFilterCard />;
  if (selectedEntityId && activeOverlay === "none") return <EntityDetailCard />;
  return <InAreaCard />;
};
