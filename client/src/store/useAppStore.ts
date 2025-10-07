import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'light' | 'dark' | 'device';

interface AppState {
  personalMode: boolean;
  searchQuery: string;
  currentUserId: string;
  sidebarCollapsed: boolean;
  theme: Theme;
  setPersonalMode: (mode: boolean) => void;
  setSearchQuery: (query: string) => void;
  setCurrentUserId: (userId: string) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setTheme: (theme: Theme) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      personalMode: false,
      searchQuery: "",
      currentUserId: "", // Will be set from authenticated user
      sidebarCollapsed: false,
      theme: 'dark',
      setPersonalMode: (mode: boolean) => set({ personalMode: mode }),
      setSearchQuery: (query: string) => set({ searchQuery: query }),
      setCurrentUserId: (userId: string) => set({ currentUserId: userId }),
      setSidebarCollapsed: (collapsed: boolean) => set({ sidebarCollapsed: collapsed }),
      setTheme: (theme: Theme) => set({ theme }),
    }),
    {
      name: 'cineweave-storage',
      partialize: (state) => ({ theme: state.theme }),
    }
  )
);
