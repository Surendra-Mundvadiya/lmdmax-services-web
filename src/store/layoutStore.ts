import { create } from "zustand";

export type AppLayoutMode = "top-nav" | "sidebar-nav";

interface LayoutState {
  layoutMode: AppLayoutMode;
  isSidebarCollapsed: boolean;
  isMobileSidebarOpen: boolean;
  isLayoutModalOpen: boolean;

  setLayoutMode: (mode: AppLayoutMode) => void;
  toggleSidebarCollapse: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setMobileSidebarOpen: (open: boolean) => void;
  setLayoutModalOpen: (open: boolean) => void;
}

const STORAGE_KEY = "lmdmax_app_layout_mode";
const COLLAPSED_STORAGE_KEY = "lmdmax_sidebar_collapsed";

const getInitialLayoutMode = (): AppLayoutMode => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "sidebar-nav" || saved === "top-nav") {
      return saved;
    }
  } catch {
    // Ignore storage read errors
  }
  return "top-nav"; // Default: Existing top navigation
};

const getInitialSidebarCollapsed = (): boolean => {
  try {
    return localStorage.getItem(COLLAPSED_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
};

export const useLayoutStore = create<LayoutState>((set) => ({
  layoutMode: getInitialLayoutMode(),
  isSidebarCollapsed: getInitialSidebarCollapsed(),
  isMobileSidebarOpen: false,
  isLayoutModalOpen: false,

  setLayoutMode: (mode: AppLayoutMode) => {
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      // Ignore storage write errors
    }
    set({ layoutMode: mode });
  },

  toggleSidebarCollapse: () => {
    set((state) => {
      const next = !state.isSidebarCollapsed;
      try {
        localStorage.setItem(COLLAPSED_STORAGE_KEY, String(next));
      } catch {
        // Ignore
      }
      return { isSidebarCollapsed: next };
    });
  },

  setSidebarCollapsed: (collapsed: boolean) => {
    try {
      localStorage.setItem(COLLAPSED_STORAGE_KEY, String(collapsed));
    } catch {
      // Ignore
    }
    set({ isSidebarCollapsed: collapsed });
  },

  setMobileSidebarOpen: (open: boolean) => {
    set({ isMobileSidebarOpen: open });
  },

  setLayoutModalOpen: (open: boolean) => {
    set({ isLayoutModalOpen: open });
  },
}));
