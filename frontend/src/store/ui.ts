import { create } from "zustand";

type Overlay = "none" | "add" | "edit" | "detail" | "delete";

interface UIState {
  pickMode: boolean;
  selectedEntityId: string | null;
  activeOverlay: Overlay;
  draftLatLng: { lat: number; lng: number } | null;
  typeFilter: string;
  statusFilter: string;
  search: string;

  setPickMode: (v: boolean) => void;
  setSelectedEntityId: (id: string | null) => void;
  setActiveOverlay: (o: Overlay) => void;
  setDraftLatLng: (coords: { lat: number; lng: number } | null) => void;
  setTypeFilter: (v: string) => void;
  setStatusFilter: (v: string) => void;
  setSearch: (v: string) => void;
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

  setPickMode: (v) => set({ pickMode: v }),
  setSelectedEntityId: (id) => set({ selectedEntityId: id }),
  setActiveOverlay: (o) => set({ activeOverlay: o }),
  setDraftLatLng: (coords) => set({ draftLatLng: coords }),
  setTypeFilter: (v) => set({ typeFilter: v }),
  setStatusFilter: (v) => set({ statusFilter: v }),
  setSearch: (v) => set({ search: v }),
  reset: () =>
    set({
      pickMode: false,
      selectedEntityId: null,
      activeOverlay: "none",
      draftLatLng: null,
      typeFilter: "",
      statusFilter: "",
      search: "",
    }),
}));
