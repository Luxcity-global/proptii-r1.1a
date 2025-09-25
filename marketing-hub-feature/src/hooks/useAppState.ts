import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppState, User } from '../types';

interface AppStore extends AppState {
  // Actions
  setUser: (user: User | null) => void;
  setCurrentView: (view: AppState['currentView']) => void;
  setCopilotOpen: (isOpen: boolean) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState: AppState = {
  user: null,
  currentView: 'welcome',
  isCopilotOpen: false,
  isLoading: false,
  error: null,
};

export const useAppState = create<AppStore>()(
  persist(
    (set) => ({
      ...initialState,
      
      setUser: (user) => set({ user }),
      
      setCurrentView: (currentView) => set({ currentView }),
      
      setCopilotOpen: (isCopilotOpen) => set({ isCopilotOpen }),
      
      setLoading: (isLoading) => set({ isLoading }),
      
      setError: (error) => set({ error }),
      
      reset: () => set(initialState),
    }),
    {
      name: 'marketing-hub-app-state',
      partialize: (state) => ({
        user: state.user,
        currentView: state.currentView,
      }),
    }
  )
);
