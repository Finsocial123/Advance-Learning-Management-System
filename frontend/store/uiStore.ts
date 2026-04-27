import { create } from "zustand";

interface UIState {
  isLoading: boolean;
  modalOpen: boolean;
  modalContent: string | null;

  setLoading: (val: boolean) => void;
  openModal: (content: string) => void;
  closeModal: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isLoading: false,
  modalOpen: false,
  modalContent: null,

  setLoading: (val) => set({ isLoading: val }),
  openModal: (content) => set({ modalOpen: true, modalContent: content }),
  closeModal: () => set({ modalOpen: false, modalContent: null }),
}));