import { useCallback, useEffect, useMemo, useRef, type ReactNode } from "react";
import type { Map as MaplibreMap } from "maplibre-gl";
import { Map, useMap } from "@/components/ui/map";
import { MarkerLayer } from "./MarkerLayer";
import { PickMode } from "./PickMode";
import { useMapEntities } from "@/features/entities/hooks";
import { useUIStore } from "@/store/ui";

function BboxTracker() {
  const { map, isLoaded } = useMap();
  const setBbox = useUIStore((s) => s.setBbox);

  useEffect(() => {
    if (!map) return;

    const updateBbox = () => {
      const bounds = map.getBounds();
      const bbox = `${bounds.getWest()},${bounds.getSouth()},${bounds.getEast()},${bounds.getNorth()}`;
      setBbox(bbox);
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
  }, [map, isLoaded, setBbox]);

  return null;
}

function disableInteractions(map: MaplibreMap) {
  map.dragPan.disable();
  map.scrollZoom.disable();
  map.touchZoomRotate.disable();
  map.boxZoom.disable();
  map.doubleClickZoom.disable();
  map.keyboard.disable();
}

function enableInteractions(map: MaplibreMap) {
  map.dragPan.enable();
  map.scrollZoom.enable();
  map.touchZoomRotate.enable();
  map.boxZoom.enable();
  map.doubleClickZoom.enable();
  map.keyboard.enable();
}

function MapFocusHandler() {
  const { map, isLoaded } = useMap();
  const selectedEntityId = useUIStore((s) => s.selectedEntityId);

  const prevSelectedRef = useRef<string | null>(null);
  const rotatingRef = useRef(false);
  const rotateHandlerRef = useRef<(() => void) | null>(null);
  const focusSessionRef = useRef(0);

  useEffect(() => {
    if (!map || !isLoaded) return;

    const prev = prevSelectedRef.current;
    const now = selectedEntityId;

    // FOCUS: null -> non-null
    if (prev === null && now !== null) {
      const state = useUIStore.getState();
      const pendingFlyTo = state.pendingFlyTo;
      if (!pendingFlyTo) {
        prevSelectedRef.current = now;
        return;
      }

      // Save current map state before focusing
      state.setSavedMapView({
        center: [map.getCenter().lng, map.getCenter().lat],
        zoom: map.getZoom(),
        pitch: map.getPitch(),
        bearing: map.getBearing(),
      });

      // Lock the map
      disableInteractions(map);

      // Invalidate any stale focus sessions
      const session = ++focusSessionRef.current;

      // Fly to entity with 3D pitch
      map.flyTo({
        center: [pendingFlyTo.lng, pendingFlyTo.lat],
        zoom: 16,
        pitch: 60,
        bearing: 0,
        duration: 1500,
      });

      // Start rotation loop after flyTo completes
      map.once("moveend", () => {
        if (focusSessionRef.current !== session) return;

        rotatingRef.current = true;
        const rotate = () => {
          if (!rotatingRef.current || !map) return;
          map.rotateTo(map.getBearing() + 360, {
            duration: 20000,
            easing: (t: number) => t,
          });
        };
        rotateHandlerRef.current = rotate;
        map.on("rotateend", rotate);
        rotate();
      });

      state.setPendingFlyTo(null);
    }

    // UNFOCUS: non-null -> null
    if (prev !== null && now === null) {
      const state = useUIStore.getState();
      const savedMapView = state.savedMapView;

      // Stop rotation
      rotatingRef.current = false;
      focusSessionRef.current++; // invalidate pending moveend callbacks
      if (rotateHandlerRef.current) {
        map.off("rotateend", rotateHandlerRef.current);
        rotateHandlerRef.current = null;
      }
      map.stop();

      // Unlock the map
      enableInteractions(map);

      // Restore saved view
      if (savedMapView) {
        map.flyTo({
          center: savedMapView.center,
          zoom: savedMapView.zoom,
          pitch: 0,
          bearing: 0,
          duration: 1500,
        });
        state.setSavedMapView(null);
      }
    }

    // SWITCH: non-null -> different non-null (just fly, no save/restore)
    if (prev !== null && now !== null && prev !== now) {
      const state = useUIStore.getState();
      const pendingFlyTo = state.pendingFlyTo;
      if (!pendingFlyTo) {
        prevSelectedRef.current = now;
        return;
      }

      // Stop current rotation
      rotatingRef.current = false;
      focusSessionRef.current++;
      if (rotateHandlerRef.current) {
        map.off("rotateend", rotateHandlerRef.current);
        rotateHandlerRef.current = null;
      }

      const session = ++focusSessionRef.current;

      map.flyTo({
        center: [pendingFlyTo.lng, pendingFlyTo.lat],
        zoom: 16,
        pitch: 60,
        bearing: 0,
        duration: 1500,
      });

      map.once("moveend", () => {
        if (focusSessionRef.current !== session) return;

        rotatingRef.current = true;
        const rotate = () => {
          if (!rotatingRef.current || !map) return;
          map.rotateTo(map.getBearing() + 360, {
            duration: 20000,
            easing: (t: number) => t,
          });
        };
        rotateHandlerRef.current = rotate;
        map.on("rotateend", rotate);
        rotate();
      });

      state.setPendingFlyTo(null);
    }

    prevSelectedRef.current = now;
  }, [selectedEntityId, map, isLoaded]);

  return null;
}

export function EntityMap({ children }: { children?: ReactNode }) {
  const bbox = useUIStore((s) => s.bbox);
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
    <Map center={[106.8456, -6.2088]} zoom={11} theme="light" className="w-full h-full">
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
