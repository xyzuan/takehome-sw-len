import { useEffect } from "react";
import { useMap } from "@/components/ui/map";
import { useUIStore } from "@/store/ui";

export const useBboxTracker = () => {
  const { map, isLoaded } = useMap();
  const setBbox = useUIStore((s) => s.setBbox);

  useEffect(() => {
    if (!map) return;

    let timer: ReturnType<typeof setTimeout> | null = null;

    const computeBbox = () => {
      const bounds = map.getBounds();
      return `${bounds.getWest()},${bounds.getSouth()},${bounds.getEast()},${bounds.getNorth()}`;
    };

    const debouncedUpdate = () => {
      if (useUIStore.getState().selectedEntityId) return;
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        setBbox(computeBbox());
      }, 100);
    };

    if (isLoaded) {
      setBbox(computeBbox());
    }

    map.on("move", debouncedUpdate);

    return () => {
      if (timer) clearTimeout(timer);
      map.off("move", debouncedUpdate);
    };
  }, [map, isLoaded, setBbox]);
}
