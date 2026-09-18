import { useState, useCallback, useEffect, type ReactNode } from "react";
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
  const { data: entities } = useMapEntities(bbox);
  const pickMode = useUIStore((s) => s.pickMode);
  const setDraftLatLng = useUIStore((s) => s.setDraftLatLng);
  const setActiveOverlay = useUIStore((s) => s.setActiveOverlay);

  const handlePick = useCallback(
    (lat: number, lng: number) => {
      setDraftLatLng({ lat, lng });
      setActiveOverlay("add");
      useUIStore.getState().setPickMode(false);
    },
    [setDraftLatLng, setActiveOverlay],
  );

  return (
    <Map center={[106.8456, -6.2088]} zoom={11} className="w-full h-full">
      <BboxTracker onBbox={setBbox} />
      {entities && <MarkerLayer entities={entities} onSelect={(e) => {
        useUIStore.getState().setSelectedEntityId(e.id);
        useUIStore.getState().setActiveOverlay("detail");
      }} />}
      {pickMode && <PickMode onPick={handlePick} />}
      {children}
    </Map>
  );
}
