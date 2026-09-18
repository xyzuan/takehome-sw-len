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

    // move fires continuously during drag + zoom animations.
    // Debounced 300ms → fetches while dragging at most every 300ms,
    // with a final fetch 300ms after the last movement. Like GMaps.
    map.on("move", debouncedUpdate);

    return () => {
      if (timer) clearTimeout(timer);
      map.off("move", debouncedUpdate);
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
  const pendingFlyTo = useUIStore((s) => s.pendingFlyTo);
  const pickMode = useUIStore((s) => s.pickMode);
  const activeOverlay = useUIStore((s) => s.activeOverlay);
  const committedPos = useUIStore((s) => s.committedPos);

  const prevSelectedRef = useRef<string | null>(null);
  const prevPickModeRef = useRef(false);
  const prevOverlayRef = useRef<string>("none");
  const rafRef = useRef<number | null>(null);
  const focusSessionRef = useRef(0);
  const focusedEntityPosRef = useRef<{ lat: number; lng: number } | null>(null);
  const repickedRef = useRef(false);

  const stopRotation = () => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  };

  const startRotation = (session: number) => {
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
  };

  useEffect(() => {
    if (!map || !isLoaded) return;

    const prev = prevSelectedRef.current;
    const now = selectedEntityId;

    // FOCUS: null -> non-null
    if (prev === null && now !== null) {
      const state = useUIStore.getState();
      const flyTo = state.pendingFlyTo;
      if (!flyTo) {
        prevSelectedRef.current = now;
        return;
      }

      focusedEntityPosRef.current = { lat: flyTo.lat, lng: flyTo.lng };

      state.setSavedMapView({
        center: [map.getCenter().lng, map.getCenter().lat],
        zoom: map.getZoom(),
        pitch: map.getPitch(),
        bearing: map.getBearing(),
      });

      disableInteractions(map);

      const session = ++focusSessionRef.current;

      map.flyTo({
        center: [flyTo.lng, flyTo.lat],
        zoom: 16,
        pitch: 60,
        bearing: 0,
        duration: 1500,
      });

      map.once("moveend", () => {
        if (focusSessionRef.current !== session) return;
        startRotation(session);
      });

      state.setPendingFlyTo(null);
    }

    // UNFOCUS: non-null -> null
    if (prev !== null && now === null) {
      const state = useUIStore.getState();
      const savedMapView = state.savedMapView;

      stopRotation();
      focusSessionRef.current++;
      map.stop();

      enableInteractions(map);

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
      focusedEntityPosRef.current = null;
    }

    // SWITCH: non-null -> different non-null
    if (prev !== null && now !== null && prev !== now) {
      const state = useUIStore.getState();
      const flyTo = state.pendingFlyTo;
      if (!flyTo) {
        prevSelectedRef.current = now;
        return;
      }

      focusedEntityPosRef.current = { lat: flyTo.lat, lng: flyTo.lng };

      stopRotation();
      focusSessionRef.current++;
      const session = focusSessionRef.current;

      map.flyTo({
        center: [flyTo.lng, flyTo.lat],
        zoom: 16,
        pitch: 60,
        bearing: 0,
        duration: 1500,
      });

      map.once("moveend", () => {
        if (focusSessionRef.current !== session) return;
        startRotation(session);
      });

      state.setPendingFlyTo(null);
    }

    // RE-PICK PICK: same entity, new flyTo target → re-focus with 3D + rotation
    if (prev === now && now !== null && pendingFlyTo) {
      // If committedPos is set, this is from a form save — update original position
      if (committedPos) {
        focusedEntityPosRef.current = { lat: committedPos.lat, lng: committedPos.lng };
        useUIStore.getState().setCommittedPos(null);
      }

      stopRotation();
      focusSessionRef.current++;
      const session = focusSessionRef.current;

      disableInteractions(map);

      map.flyTo({
        center: [pendingFlyTo.lng, pendingFlyTo.lat],
        zoom: 16,
        pitch: 60,
        bearing: 0,
        duration: 1500,
      });

      map.once("moveend", () => {
        if (focusSessionRef.current !== session) return;
        startRotation(session);
      });

      repickedRef.current = true;
      useUIStore.getState().setPendingFlyTo(null);
    }

    // RE-PICK ENTER: pickMode just turned on → unlock map, go 2D
    if (pickMode && !prevPickModeRef.current && now !== null) {
      stopRotation();
      focusSessionRef.current++;
      enableInteractions(map);
      map.easeTo({ pitch: 0, bearing: 0 }, { duration: 800 });
    }

    // RE-PICK CANCEL: pickMode turned off, no new coords → fly back to original at 2D
    if (!pickMode && prevPickModeRef.current && now !== null && !pendingFlyTo) {
      const origPos = focusedEntityPosRef.current;
      if (origPos) {
        map.flyTo({
          center: [origPos.lng, origPos.lat],
          zoom: 16,
          pitch: 0,
          bearing: 0,
          duration: 1500,
        });
      }
    }

    // EDIT CANCEL: activeOverlay changed from edit to none/detail, repicked but cancelled
    // → fly back to original position, re-focus with rotation
    if (prevOverlayRef.current === "edit" && activeOverlay !== "edit" && now !== null && repickedRef.current && !pendingFlyTo) {
      const origPos = focusedEntityPosRef.current;
      repickedRef.current = false;
      if (origPos) {
        stopRotation();
        focusSessionRef.current++;
        const session = focusSessionRef.current;

        disableInteractions(map);

        map.flyTo({
          center: [origPos.lng, origPos.lat],
          zoom: 16,
          pitch: 60,
          bearing: 0,
          duration: 1500,
        });

        map.once("moveend", () => {
          if (focusSessionRef.current !== session) return;
          startRotation(session);
        });
      }
    }

    prevSelectedRef.current = now;
    prevPickModeRef.current = pickMode;
    prevOverlayRef.current = activeOverlay;
  }, [selectedEntityId, pendingFlyTo, pickMode, activeOverlay, committedPos, map, isLoaded]);

  // Cleanup on unmount
  useEffect(() => {
    return () => stopRotation();
  }, []);

  return null;
}

export function EntityMap({ children }: { children?: ReactNode }) {
  const bbox = useUIStore((s) => s.bbox);
  const typeFilter = useUIStore((s) => s.typeFilter);
  const statusFilter = useUIStore((s) => s.statusFilter);
  const search = useUIStore((s) => s.search);
  const selectedEntityId = useUIStore((s) => s.selectedEntityId);
  const darkMode = useUIStore((s) => s.darkMode);
  const { data: entities } = useMapEntities(bbox, typeFilter, statusFilter);
  const pickMode = useUIStore((s) => s.pickMode);
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
    if (!entities) return [];
    let result = entities;
    if (selectedEntityId) {
      result = entities.filter((e) => e.id === selectedEntityId);
    } else if (search) {
      const q = search.toLowerCase();
      result = entities.filter((e) => e.name.toLowerCase().includes(q));
    }
    // Override marker position with draft coords during edit re-pick
    if (draftLatLng && selectedEntityId) {
      result = result.map((e) =>
        e.id === selectedEntityId
          ? { ...e, lat: draftLatLng.lat, lng: draftLatLng.lng }
          : e,
      );
    }
    return result;
  }, [entities, search, selectedEntityId, draftLatLng]);

  return (
    <Map center={[106.8456, -6.2088]} zoom={11} theme={darkMode ? "dark" : "light"} className="w-full h-full">
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
