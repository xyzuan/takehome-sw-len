import { create } from "zustand";

type Overlay = "none" | "add" | "edit" | "detail" | "delete";

interface UIState {
  pickMode: boolean;
  selectedEntityId: string | null;
  activeOverlay: Overlay;
  draftLatLng: { lat: number; lng: number } | null;

  setPickMode: (v: boolean) => void;
  setSelectedEntityId: (id: string | null) => void;
  setActiveOverlay: (o: Overlay) => void;
  setDraftLatLng: (coords: { lat: number; lng: number } | null) => void;
  reset: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  pickMode: false,
  selectedEntityId: null,
  activeOverlay: "none",
  draftLatLng: null,

  setPickMode: (v) => set({ pickMode: v }),
  setSelectedEntityId: (id) => set({ selectedEntityId: id }),
  setActiveOverlay: (o) => set({ activeOverlay: o }),
  setDraftLatLng: (coords) => set({ draftLatLng: coords }),
  reset: () => set({ pickMode: false, selectedEntityId: null, activeOverlay: "none", draftLatLng: null }),
}));
