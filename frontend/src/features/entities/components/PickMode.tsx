import { useEffect } from "react";
import { useMap } from "@/components/ui/map";
import { useUIStore } from "@/store/ui";

// Listens for map clicks when pickMode is active. Calls onPick with lat/lng.
export const PickMode = ({ onPick }: { onPick: (lat: number, lng: number) => void }) => {
  const { map, isLoaded } = useMap();
  const pickMode = useUIStore((s) => s.pickMode);

  useEffect(() => {
    if (!isLoaded || !map || !pickMode) return;

    const handleClick = (e: { lngLat: { lat: number; lng: number } }) => {
      onPick(e.lngLat.lat, e.lngLat.lng);
    };

    map.on("click", handleClick);
    map.getCanvas().style.cursor = "crosshair";

    return () => {
      map.off("click", handleClick);
      map.getCanvas().style.cursor = "";
    };
  }, [map, isLoaded, pickMode, onPick]);

  return null;
}
