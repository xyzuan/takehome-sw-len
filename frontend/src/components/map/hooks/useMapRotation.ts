import { useCallback, useEffect, useRef } from "react";
import type { Map as MaplibreMap } from "maplibre-gl";

export function disableInteractions(map: MaplibreMap) {
  map.dragPan.disable();
  map.scrollZoom.disable();
  map.touchZoomRotate.disable();
  map.boxZoom.disable();
  map.doubleClickZoom.disable();
  map.keyboard.disable();
}

export function enableInteractions(map: MaplibreMap) {
  map.dragPan.enable();
  map.scrollZoom.enable();
  map.touchZoomRotate.enable();
  map.boxZoom.enable();
  map.doubleClickZoom.enable();
  map.keyboard.enable();
}

export function useMapRotation(map: MaplibreMap | null) {
  const rafRef = useRef<number | null>(null);
  const focusSessionRef = useRef(0);

  const stopRotation = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const startRotation = useCallback(
    (session: number) => {
      if (!map) return;
      const tick = () => {
        if (focusSessionRef.current !== session || !map) {
          rafRef.current = null;
          return;
        }
        map.setBearing(map.getBearing() + 0.1);
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    },
    [map],
  );

  useEffect(() => {
    return () => stopRotation();
  }, [stopRotation]);

  return { startRotation, stopRotation, focusSessionRef };
}
