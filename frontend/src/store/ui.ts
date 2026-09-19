import { create } from "zustand";
import type { Entity } from "@/interfaces/entity";

type Overlay = "none" | "add" | "edit" | "filter" | "search";

interface MapView {
  center: [number, number];
  zoom: number;
  pitch: number;
  bearing: number;
}

interface UIState {
  pickMode: boolean;
  selectedEntityId: string | null;
  activeOverlay: Overlay;
  draftLatLng: { lat: number; lng: number } | null;
  typeFilter: string;
  statusFilter: string;
  search: string;
  bbox: string | null;
  pendingFlyTo: { lat: number; lng: number } | null;
  savedMapView: MapView | null;
  darkMode: boolean;
  committedPos: { lat: number; lng: number } | null;
  draftEntity: Partial<Entity> | null;
  debugMode: boolean;
  renderedCount: number;

  setPickMode: (v: boolean) => void;
  setSelectedEntityId: (id: string | null) => void;
  setActiveOverlay: (o: Overlay) => void;
  setDraftLatLng: (coords: { lat: number; lng: number } | null) => void;
  setTypeFilter: (v: string) => void;
  setStatusFilter: (v: string) => void;
  setSearch: (v: string) => void;
  setBbox: (bbox: string | null) => void;
  setPendingFlyTo: (coords: { lat: number; lng: number } | null) => void;
  setSavedMapView: (v: MapView | null) => void;
  setDarkMode: (v: boolean) => void;
  toggleDarkMode: () => void;
  setCommittedPos: (v: { lat: number; lng: number } | null) => void;
  setDraftEntity: (v: Partial<Entity> | null) => void;
  toggleDebugMode: () => void;
  setRenderedCount: (v: number) => void;
  reset: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  pickMode: false,
  selectedEntityId: null,
  activeOverlay: "none",
  draftLatLng: null,
  typeFilter: "",
  statusFilter: "",
  search: "",
  bbox: null,
  pendingFlyTo: null,
  savedMapView: null,
  darkMode: false,
  committedPos: null,
  draftEntity: null,
  debugMode: false,
  renderedCount: 0,

  setPickMode: (v) => set({ pickMode: v }),
  setSelectedEntityId: (id) => set({ selectedEntityId: id }),
  setActiveOverlay: (o) => set({ activeOverlay: o }),
  setDraftLatLng: (coords) => set({ draftLatLng: coords }),
  setTypeFilter: (v) => set({ typeFilter: v }),
  setStatusFilter: (v) => set({ statusFilter: v }),
  setSearch: (v) => set({ search: v }),
  setBbox: (bbox) => set({ bbox }),
  setPendingFlyTo: (coords) => set({ pendingFlyTo: coords }),
  setSavedMapView: (v) => set({ savedMapView: v }),
  setDarkMode: (v) => set({ darkMode: v }),
  toggleDarkMode: () => set((s) => ({ darkMode: !s.darkMode })),
  setCommittedPos: (v) => set({ committedPos: v }),
  setDraftEntity: (v) => set({ draftEntity: v }),
  toggleDebugMode: () => set((s) => ({ debugMode: !s.debugMode })),
  setRenderedCount: (v) => set({ renderedCount: v }),
  reset: () =>
    set({
      pickMode: false,
      selectedEntityId: null,
      activeOverlay: "none",
      draftLatLng: null,
      typeFilter: "",
      statusFilter: "",
      search: "",
      bbox: null,
      pendingFlyTo: null,
      savedMapView: null,
      darkMode: false,
      committedPos: null,
      draftEntity: null,
      debugMode: false,
      renderedCount: 0,
    }),
}));
