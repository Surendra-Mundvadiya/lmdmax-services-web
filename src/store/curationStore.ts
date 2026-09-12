import { create } from "zustand";
import { curationApi, CurationCounts } from "../api/curationApi";

interface CurationState {
  counts: CurationCounts;
  isLoadingCounts: boolean;
  lastFetchedAt: number | null;

  // Actions
  fetchCurationCount: (silent?: boolean) => Promise<CurationCounts>;
  decrementCount: (type: "transporter_id" | "netradyne" | "ementor" | "autocoaching") => void;
  setCounts: (counts: Partial<CurationCounts>) => void;
}

const DEFAULT_COUNTS: CurationCounts = {
  transporter_id: 0,
  netradyne: 0,
  ementor: 0,
  autocoaching: 0,
  total: 0,
};

export const useCurationStore = create<CurationState>((set, get) => ({
  counts: DEFAULT_COUNTS,
  isLoadingCounts: false,
  lastFetchedAt: null,

  fetchCurationCount: async (silent = false) => {
    if (!silent) set({ isLoadingCounts: true });
    try {
      const counts = await curationApi.getCurationCount();
      set({
        counts,
        isLoadingCounts: false,
        lastFetchedAt: Date.now(),
      });
      return counts;
    } catch {
      set({ isLoadingCounts: false });
      return get().counts;
    }
  },

  decrementCount: (type) => {
    set((state) => {
      const currentVal = state.counts[type] || 0;
      const newVal = Math.max(0, currentVal - 1);
      const newTotal = Math.max(0, state.counts.total - 1);
      return {
        counts: {
          ...state.counts,
          [type]: newVal,
          total: newTotal,
        },
      };
    });
  },

  setCounts: (newCounts) => {
    set((state) => {
      const updated = { ...state.counts, ...newCounts };
      const total =
        updated.transporter_id + updated.netradyne + updated.ementor + updated.autocoaching;
      return {
        counts: { ...updated, total },
      };
    });
  },
}));
