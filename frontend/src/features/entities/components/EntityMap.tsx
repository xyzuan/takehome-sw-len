import { useCallback, useMemo, type ReactNode } from "react";
import { Map } from "@/components/ui/map";
import { MarkerLayer } from "./MarkerLayer";
import { PickMode } from "./PickMode";
import { useBboxTracker } from "../hooks/useBboxTracker";
import { useMapFocusHandler } from "../hooks/useMapFocusHandler";
import { useMapEntities } from "@/services/entity";
import { useUIStore } from "@/store/ui";
import type { Entity } from "@/interfaces/entity";

const BboxTracker = () => {
  useBboxTracker();
  return null;
}

const MapFocusHandler = () => {
  useMapFocusHandler();
  return null;
}

export const EntityMap = ({ children }: { children?: ReactNode }) => {
  const bbox = useUIStore((s) => s.bbox);
  const typeFilter = useUIStore((s) => s.typeFilter);
  const statusFilter = useUIStore((s) => s.statusFilter);
  const search = useUIStore((s) => s.search);
  const selectedEntityId = useUIStore((s) => s.selectedEntityId);
  const darkMode = useUIStore((s) => s.darkMode);
  const { data: entities } = useMapEntities(bbox, typeFilter, statusFilter);
  const pickMode = useUIStore((s) => s.pickMode);
  const draftEntity = useUIStore((s) => s.draftEntity);
  const draftLatLng = useUIStore((s) => s.draftLatLng);
  const setDraftLatLng = useUIStore((s) => s.setDraftLatLng);
  const setActiveOverlay = useUIStore((s) => s.setActiveOverlay);

  const handlePick = useCallback(
    (lat: number, lng: number) => {
      setDraftLatLng({ lat, lng });
      useUIStore.getState().setPendingFlyTo({ lat, lng });
      useUIStore.getState().setPickMode(false);
      if (useUIStore.getState().activeOverlay !== "edit") {
        setActiveOverlay("add");
      }
    },
    [setDraftLatLng, setActiveOverlay],
  );

  const filtered = useMemo(() => {
    const baseEntities = entities ?? [];
    let result: Entity[] = baseEntities;
    if (selectedEntityId) {
      result = baseEntities.filter((e) => e.id === selectedEntityId);
    } else if (search) {
      const q = search.toLowerCase();
      result = baseEntities.filter((e) => e.name.toLowerCase().includes(q));
    }
    if (selectedEntityId) {
      result = result.map((e) => {
        if (e.id !== selectedEntityId) return e;
        let merged = { ...e };
        if (draftEntity) merged = { ...merged, ...draftEntity };
        if (draftLatLng) merged = { ...merged, lat: draftLatLng.lat, lng: draftLatLng.lng };
        return merged;
      });
    }
    if (!selectedEntityId && draftEntity && draftEntity.id === "__draft__" && draftLatLng) {
      result = [...result, draftEntity as Entity];
    }
    return result;
  }, [entities, search, selectedEntityId, draftEntity, draftLatLng]);

  return (
    <Map center={[107.6195, -6.9495]} zoom={14} theme={darkMode ? "dark" : "light"} className="w-full h-full">
      <BboxTracker />
      <MapFocusHandler />
      <MarkerLayer
        entities={filtered}
        onSelect={(e) => {
          useUIStore.getState().setSelectedEntityId(e.id);
          useUIStore.getState().setPendingFlyTo({ lat: e.lat, lng: e.lng });
        }}
      />
      {pickMode && <PickMode onPick={handlePick} />}
      {children}
    </Map>
  );
}
