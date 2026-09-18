import { useState, useCallback, useEffect, useMemo, type ReactNode } from "react";
import { Map, useMap } from "@/components/ui/map";
import { MarkerLayer } from "./MarkerLayer";
import { PickMode } from "./PickMode";
import { useMapEntities } from "@/features/entities/hooks";
import { useUIStore } from "@/store/ui";

function BboxTracker({ onBbox }: { onBbox: (bbox: string) => void }) {
  const { map, isLoaded } = useMap();

  useEffect(() => {
    if (!map) return;

    const updateBbox = () => {
      const bounds = map.getBounds();
      const bbox = `${bounds.getWest()},${bounds.getSouth()},${bounds.getEast()},${bounds.getNorth()}`;
      onBbox(bbox);
    };

    if (isLoaded) {
      updateBbox();
    }

    map.on("moveend", updateBbox);
    map.on("load", updateBbox);

    return () => {
      map.off("moveend", updateBbox);
      map.off("load", updateBbox);
    };
  }, [map, isLoaded, onBbox]);

  return null;
}

export function EntityMap({ children }: { children?: ReactNode }) {
  const [bbox, setBbox] = useState<string | null>(null);
  const typeFilter = useUIStore((s) => s.typeFilter);
  const statusFilter = useUIStore((s) => s.statusFilter);
  const search = useUIStore((s) => s.search);
  const { data: entities } = useMapEntities(bbox, typeFilter, statusFilter);
  const pickMode = useUIStore((s) => s.pickMode);
  const setDraftLatLng = useUIStore((s) => s.setDraftLatLng);
  const setActiveOverlay = useUIStore((s) => s.setActiveOverlay);

  const handlePick = useCallback(
    (lat: number, lng: number) => {
      setDraftLatLng({ lat, lng });
      useUIStore.getState().setPickMode(false);
      if (useUIStore.getState().activeOverlay !== "edit") {
        setActiveOverlay("add");
      }
    },
    [setDraftLatLng, setActiveOverlay],
  );

  const filtered = useMemo(() => {
    if (!entities) return [];
    if (!search) return entities;
    const q = search.toLowerCase();
    return entities.filter((e) => e.name.toLowerCase().includes(q));
  }, [entities, search]);

  return (
    <Map center={[106.8456, -6.2088]} zoom={11} className="w-full h-full">
      <BboxTracker onBbox={setBbox} />
      <MarkerLayer
        entities={filtered}
        onSelect={(e, action) => {
          useUIStore.getState().setSelectedEntityId(e.id);
          useUIStore.getState().setActiveOverlay(action);
        }}
      />
      {pickMode && <PickMode onPick={handlePick} />}
      {children}
    </Map>
  );
}
