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

  let content;
  let key;

  if (activeOverlay === "search") {
    content = <SearchResults />;
    key = "search";
  } else if (activeOverlay === "add") {
    content = <EntityAddCard />;
    key = "add";
  } else if (activeOverlay === "edit") {
    content = <EntityEditCard />;
    key = "edit";
  } else if (activeOverlay === "filter") {
    content = <EntityFilterCard />;
    key = "filter";
  } else if (selectedEntityId && activeOverlay === "none") {
    content = <EntityDetailCard />;
    key = `detail-${selectedEntityId}`;
  } else {
    content = <InAreaCard />;
    key = "inarea";
  }

  return (
    <div
      key={key}
      className="animate-in fade-in slide-in-from-bottom-4 duration-300 ease-out"
    >
      {content}
    </div>
  );
};
