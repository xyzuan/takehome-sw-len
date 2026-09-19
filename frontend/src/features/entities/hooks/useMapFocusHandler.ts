import { useEffect, useRef } from "react";
import type { Map as MaplibreMap } from "maplibre-gl";
import { useMap } from "@/components/ui/map";
import { useUIStore } from "@/store/ui";
import { useMapRotation, disableInteractions, enableInteractions } from "./useMapRotation";

const updateBboxFromMap = (map: MaplibreMap) => {
  const bounds = map.getBounds();
  useUIStore.getState().setBbox(
    `${bounds.getWest()},${bounds.getSouth()},${bounds.getEast()},${bounds.getNorth()}`,
  );
}

export const useMapFocusHandler = () => {
  const { map, isLoaded } = useMap();
  const selectedEntityId = useUIStore((s) => s.selectedEntityId);
  const pendingFlyTo = useUIStore((s) => s.pendingFlyTo);
  const pickMode = useUIStore((s) => s.pickMode);
  const activeOverlay = useUIStore((s) => s.activeOverlay);
  const committedPos = useUIStore((s) => s.committedPos);

  const { startRotation, stopRotation, focusSessionRef } = useMapRotation(map);

  const prevSelectedRef = useRef<string | null>(null);
  const prevPickModeRef = useRef(false);
  const prevOverlayRef = useRef<string>("none");
  const focusedEntityPosRef = useRef<{ lat: number; lng: number } | null>(null);
  const repickedRef = useRef(false);

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

      map.flyTo({ center: [flyTo.lng, flyTo.lat], zoom: 16, pitch: 60, bearing: 0, duration: 1500, padding: { bottom: 300 } });
      map.once("moveend", () => {
        if (focusSessionRef.current !== session) return;
        updateBboxFromMap(map);
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
        map.flyTo({ center: savedMapView.center, zoom: savedMapView.zoom, pitch: 0, bearing: 0, duration: 1500 });
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

      map.flyTo({ center: [flyTo.lng, flyTo.lat], zoom: 16, pitch: 60, bearing: 0, duration: 1500, padding: { bottom: 300 } });
      map.once("moveend", () => {
        if (focusSessionRef.current !== session) return;
        updateBboxFromMap(map);
        startRotation(session);
      });
      state.setPendingFlyTo(null);
    }

    // RE-PICK PICK: same entity, new flyTo target
    if (prev === now && now !== null && pendingFlyTo) {
      if (committedPos) {
        focusedEntityPosRef.current = { lat: committedPos.lat, lng: committedPos.lng };
        useUIStore.getState().setCommittedPos(null);
      }
      stopRotation();
      focusSessionRef.current++;
      const session = focusSessionRef.current;
      disableInteractions(map);

      map.flyTo({ center: [pendingFlyTo.lng, pendingFlyTo.lat], zoom: 16, pitch: 60, bearing: 0, duration: 1500, padding: { bottom: 300 } });
      map.once("moveend", () => {
        if (focusSessionRef.current !== session) return;
        updateBboxFromMap(map);
        startRotation(session);
      });
      repickedRef.current = true;
      useUIStore.getState().setPendingFlyTo(null);
    }

    // RE-PICK ENTER: pickMode just turned on (editing entity)
    if (pickMode && !prevPickModeRef.current && now !== null) {
      stopRotation();
      focusSessionRef.current++;
      enableInteractions(map);
      map.easeTo({ pitch: 0, bearing: 0 }, { duration: 800 });
    }

    // ADD PICK: no entity, new flyTo target
    if (prev === null && now === null && pendingFlyTo) {
      const state = useUIStore.getState();
      focusedEntityPosRef.current = { lat: pendingFlyTo.lat, lng: pendingFlyTo.lng };
      state.setSavedMapView({
        center: [map.getCenter().lng, map.getCenter().lat],
        zoom: map.getZoom(),
        pitch: map.getPitch(),
        bearing: map.getBearing(),
      });
      disableInteractions(map);
      const session = ++focusSessionRef.current;

      map.flyTo({ center: [pendingFlyTo.lng, pendingFlyTo.lat], zoom: 16, pitch: 60, bearing: 0, duration: 1500, padding: { bottom: 300 } });
      map.once("moveend", () => {
        if (focusSessionRef.current !== session) return;
        updateBboxFromMap(map);
        startRotation(session);
      });
      useUIStore.getState().setPendingFlyTo(null);
    }

    // ADD RE-PICK ENTER: pickMode on, no entity
    if (pickMode && !prevPickModeRef.current && now === null) {
      stopRotation();
      focusSessionRef.current++;
      enableInteractions(map);
      map.easeTo({ pitch: 0, bearing: 0 }, { duration: 800 });
    }

    // ADD RE-PICK PICK: pickMode off, no entity, new flyTo
    if (!pickMode && prevPickModeRef.current && now === null && pendingFlyTo) {
      focusedEntityPosRef.current = { lat: pendingFlyTo.lat, lng: pendingFlyTo.lng };
      stopRotation();
      focusSessionRef.current++;
      const session = focusSessionRef.current;
      disableInteractions(map);

      map.flyTo({ center: [pendingFlyTo.lng, pendingFlyTo.lat], zoom: 16, pitch: 60, bearing: 0, duration: 1500, padding: { bottom: 300 } });
      map.once("moveend", () => {
        if (focusSessionRef.current !== session) return;
        updateBboxFromMap(map);
        startRotation(session);
      });
      useUIStore.getState().setPendingFlyTo(null);
    }

    // ADD RE-PICK CANCEL: pickMode off, no entity, no flyTo
    if (!pickMode && prevPickModeRef.current && now === null && !pendingFlyTo) {
      const draftPos = focusedEntityPosRef.current;
      if (draftPos) {
        map.flyTo({ center: [draftPos.lng, draftPos.lat], zoom: 16, pitch: 0, bearing: 0, duration: 1500 });
      }
    }

    // ADD CANCEL: overlay left add, no entity
    if (prevOverlayRef.current === "add" && activeOverlay !== "add" && now === null) {
      const state = useUIStore.getState();
      const savedMapView = state.savedMapView;
      stopRotation();
      focusSessionRef.current++;
      map.stop();
      enableInteractions(map);

      if (savedMapView) {
        map.flyTo({ center: savedMapView.center, zoom: savedMapView.zoom, pitch: 0, bearing: 0, duration: 1500 });
        state.setSavedMapView(null);
      }
      focusedEntityPosRef.current = null;
    }

    // EDIT CANCEL: overlay left edit, repicked but cancelled
    if (prevOverlayRef.current === "edit" && activeOverlay !== "edit" && now !== null && repickedRef.current && !pendingFlyTo) {
      const origPos = focusedEntityPosRef.current;
      repickedRef.current = false;
      if (origPos) {
        stopRotation();
        focusSessionRef.current++;
        const session = focusSessionRef.current;
        disableInteractions(map);

        map.flyTo({ center: [origPos.lng, origPos.lat], zoom: 16, pitch: 60, bearing: 0, duration: 1500, padding: { bottom: 300 } });
        map.once("moveend", () => {
          if (focusSessionRef.current !== session) return;
          updateBboxFromMap(map);
          startRotation(session);
        });
      }
    }

    prevSelectedRef.current = now;
    prevPickModeRef.current = pickMode;
    prevOverlayRef.current = activeOverlay;
  }, [selectedEntityId, pendingFlyTo, pickMode, activeOverlay, committedPos, map, isLoaded, startRotation, stopRotation, focusSessionRef]);
}
