import { create } from "zustand";

type Overlay = "none" | "add" | "edit" | "delete";

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
    }),
}));
