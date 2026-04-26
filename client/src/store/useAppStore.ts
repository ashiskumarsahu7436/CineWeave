import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SearchSort, SearchDuration, SearchUploaded } from '@shared/schema';

export type Theme = 'light' | 'dark' | 'device';

export interface SearchFilters {
  sort: SearchSort;
  duration: SearchDuration;
  uploaded: SearchUploaded;
}

interface AppState {
  personalMode: boolean;
  searchQuery: string;
  searchFilters: SearchFilters;
  currentUserId: string;
  sidebarCollapsed: boolean;
  mobileSidebarOpen: boolean;
  theme: Theme;
  setPersonalMode: (mode: boolean) => void;
  setSearchQuery: (query: string) => void;
  setSearchFilters: (filters: Partial<SearchFilters>) => void;
  resetSearchFilters: () => void;
  setCurrentUserId: (userId: string) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setMobileSidebarOpen: (open: boolean) => void;
  setTheme: (theme: Theme) => void;
}

const defaultFilters: SearchFilters = {
  sort: 'relevance',
  duration: 'any',
  uploaded: 'any',
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      personalMode: false,
      searchQuery: "",
      searchFilters: defaultFilters,
      currentUserId: "",
      sidebarCollapsed: false,
      mobileSidebarOpen: false,
      theme: 'dark',
      setPersonalMode: (mode: boolean) => set({ personalMode: mode }),
      setSearchQuery: (query: string) => set({ searchQuery: query }),
      setSearchFilters: (filters: Partial<SearchFilters>) =>
        set((state) => ({ searchFilters: { ...state.searchFilters, ...filters } })),
      resetSearchFilters: () => set({ searchFilters: defaultFilters }),
      setCurrentUserId: (userId: string) => set({ currentUserId: userId }),
      setSidebarCollapsed: (collapsed: boolean) => set({ sidebarCollapsed: collapsed }),
      setMobileSidebarOpen: (open: boolean) => set({ mobileSidebarOpen: open }),
      setTheme: (theme: Theme) => set({ theme }),
    }),
    {
      name: 'cineweave-storage',
      partialize: (state) => ({ theme: state.theme }),
    }
  )
);
