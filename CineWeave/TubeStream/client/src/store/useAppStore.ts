import { create } from 'zustand';

interface AppState {
  personalMode: boolean;
  searchQuery: string;
  currentUserId: string;
  sidebarCollapsed: boolean;
  setPersonalMode: (mode: boolean) => void;
  setSearchQuery: (query: string) => void;
  setCurrentUserId: (userId: string) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  personalMode: false,
  searchQuery: "",
  currentUserId: "cc700eff-ddf5-4ccb-9e31-bc55183580b3", // Default user from seed
  sidebarCollapsed: false,
  setPersonalMode: (mode: boolean) => set({ personalMode: mode }),
  setSearchQuery: (query: string) => set({ searchQuery: query }),
  setCurrentUserId: (userId: string) => set({ currentUserId: userId }),
  setSidebarCollapsed: (collapsed: boolean) => set({ sidebarCollapsed: collapsed }),
}));
