import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

export type ToolTrayType = 
  | 'templates' 
  | 'images' 
  | 'elements' 
  | 'text' 
  | 'ai-tools' 
  | 'layers' 
  | 'assets';

interface ToolTrayConfig {
  id: ToolTrayType;
  name: string;
  icon: string;
  color: string;
  enabled: boolean;
  order: number;
}

interface ToolTrayState {
  activeTray: ToolTrayType | null;
  previousTray: ToolTrayType | null;
  trayConfigs: Record<ToolTrayType, ToolTrayConfig>;
  trayHistory: ToolTrayType[];
  isAnimating: boolean;
  animationDirection: 'left' | 'right' | 'none';
  trayData: Record<ToolTrayType, any>;
  searchQuery: string;
  filters: Record<ToolTrayType, Record<string, any>>;
  viewMode: Record<ToolTrayType, 'grid' | 'list'>;
  expandedSections: Record<ToolTrayType, Set<string>>;
  leftSidebarCollapsed: boolean;
  middlePanelCollapsed: boolean;
}

interface ToolTrayActions {
  setActiveTray: (trayId: ToolTrayType | null) => void;
  goToPreviousTray: () => void;
  updateTrayConfig: (trayId: ToolTrayType, config: Partial<ToolTrayConfig>) => void;
  setTrayData: (trayId: ToolTrayType, data: any) => void;
  setSearchQuery: (query: string) => void;
  setFilters: (trayId: ToolTrayType, filters: Record<string, any>) => void;
  setViewMode: (trayId: ToolTrayType, mode: 'grid' | 'list') => void;
  toggleSection: (trayId: ToolTrayType, sectionId: string) => void;
  resetTray: (trayId: ToolTrayType) => void;
  resetAllTrays: () => void;
  setAnimationState: (isAnimating: boolean, direction?: 'left' | 'right' | 'none') => void;
  setLeftSidebarCollapsed: (collapsed: boolean) => void;
  setMiddlePanelCollapsed: (collapsed: boolean) => void;
}

type ToolTrayStore = ToolTrayState & ToolTrayActions;

const defaultTrayConfigs: Record<ToolTrayType, ToolTrayConfig> = {
  templates: {
    id: 'templates',
    name: 'Templates',
    icon: 'Layout',
    color: '#3b82f6',
    enabled: true,
    order: 1
  },
  images: {
    id: 'images',
    name: 'Images',
    icon: 'Image',
    color: '#10b981',
    enabled: true,
    order: 2
  },
  elements: {
    id: 'elements',
    name: 'Elements',
    icon: 'Square',
    color: '#f59e0b',
    enabled: true,
    order: 3
  },
  text: {
    id: 'text',
    name: 'Text',
    icon: 'Type',
    color: '#8b5cf6',
    enabled: true,
    order: 4
  },
  'ai-tools': {
    id: 'ai-tools',
    name: 'AI Tools',
    icon: 'Sparkles',
    color: '#ec4899',
    enabled: true,
    order: 5
  },
  layers: {
    id: 'layers',
    name: 'Layers',
    icon: 'Layers',
    color: '#6b7280',
    enabled: true,
    order: 6
  },
  assets: {
    id: 'assets',
    name: 'Assets',
    icon: 'Save',
    color: '#ef4444',
    enabled: true,
    order: 7
  }
};

export const useToolTrayStore = create<ToolTrayStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    activeTray: null,
    previousTray: null,
    trayConfigs: defaultTrayConfigs,
    trayHistory: ['templates'],
    isAnimating: false,
    animationDirection: 'none',
    trayData: {} as Record<ToolTrayType, any>,
    searchQuery: '',
    filters: {} as Record<ToolTrayType, Record<string, any>>,
    viewMode: {
      templates: 'grid',
      images: 'grid',
      elements: 'grid',
      text: 'list',
      'ai-tools': 'list',
      layers: 'list',
      assets: 'grid'
    },
    expandedSections: {
      templates: new Set(['featured']),
      images: new Set(['user']),
      elements: new Set(['shapes']),
      text: new Set(['fonts']),
      'ai-tools': new Set(['suggestions']),
      layers: new Set(['canvas']),
      assets: new Set(['recent'])
    },
    leftSidebarCollapsed: false,
    middlePanelCollapsed: false,

    // Actions
    setActiveTray: (trayId: ToolTrayType | null) => {
      const state = get();
      const currentTray = state.activeTray;
      
      // Handle null case (close tray)
      if (trayId === null) {
        set({
          previousTray: currentTray,
          activeTray: null,
          isAnimating: false,
          animationDirection: 'none'
        });
        return;
      }
      
      // Safety check: ensure tray config exists
      if (!state.trayConfigs[trayId]) {
        console.warn(`Tray config not found for: ${trayId}`);
        return;
      }
      
      // Toggle functionality: if clicking the same tray, close it
      if (currentTray === trayId) {
        set({
          previousTray: currentTray,
          activeTray: null,
          isAnimating: false,
          animationDirection: 'none'
        });
        return;
      }

      // Safety check for current tray config
      if (!currentTray || !state.trayConfigs[currentTray]) {
        // If current tray is invalid, just set the new one without animation
        set({
          previousTray: currentTray,
          activeTray: trayId,
          isAnimating: false,
          animationDirection: 'none'
        });
        return;
      }

      // Determine animation direction
      const currentOrder = state.trayConfigs[currentTray].order;
      const newOrder = state.trayConfigs[trayId].order;
      const direction = newOrder > currentOrder ? 'right' : 'left';

      set({
        previousTray: currentTray,
        activeTray: trayId,
        isAnimating: true,
        animationDirection: direction
      });

      // Add to history if not already there
      if (!state.trayHistory.includes(trayId)) {
        set(state => ({
          trayHistory: [...state.trayHistory, trayId]
        }));
      }

      // Stop animation after transition
      setTimeout(() => {
        set({
          isAnimating: false,
          animationDirection: 'none'
        });
      }, 300);
    },

    goToPreviousTray: () => {
      const state = get();
      if (state.previousTray) {
        get().setActiveTray(state.previousTray);
      }
    },

    updateTrayConfig: (trayId: ToolTrayType, config: Partial<ToolTrayConfig>) => {
      set(state => ({
        trayConfigs: {
          ...state.trayConfigs,
          [trayId]: {
            ...state.trayConfigs[trayId],
            ...config
          }
        }
      }));
    },

    setTrayData: (trayId: ToolTrayType, data: any) => {
      set(state => ({
        trayData: {
          ...state.trayData,
          [trayId]: data
        }
      }));
    },

    setSearchQuery: (query: string) => {
      set({ searchQuery: query });
    },

    setFilters: (trayId: ToolTrayType, filters: Record<string, any>) => {
      set(state => ({
        filters: {
          ...state.filters,
          [trayId]: {
            ...state.filters[trayId],
            ...filters
          }
        }
      }));
    },

    setViewMode: (trayId: ToolTrayType, mode: 'grid' | 'list') => {
      set(state => ({
        viewMode: {
          ...state.viewMode,
          [trayId]: mode
        }
      }));
    },

    toggleSection: (trayId: ToolTrayType, sectionId: string) => {
      set(state => {
        const expandedSections = { ...state.expandedSections };
        const traySections = new Set(expandedSections[trayId]);
        
        if (traySections.has(sectionId)) {
          traySections.delete(sectionId);
        } else {
          traySections.add(sectionId);
        }
        
        expandedSections[trayId] = traySections;
        
        return { expandedSections };
      });
    },

    resetTray: (trayId: ToolTrayType) => {
      set(state => ({
        searchQuery: '',
        filters: {
          ...state.filters,
          [trayId]: {}
        },
        expandedSections: {
          ...state.expandedSections,
          [trayId]: new Set(['featured', 'user', 'shapes', 'fonts', 'suggestions', 'canvas', 'recent'].filter(
            section => section !== 'featured' || trayId === 'templates'
          ))
        }
      }));
    },

    resetAllTrays: () => {
      set({
        activeTray: 'templates',
        previousTray: null,
        searchQuery: '',
        filters: {} as Record<ToolTrayType, Record<string, any>>,
        expandedSections: {
          templates: new Set(['featured']),
          images: new Set(['user']),
          elements: new Set(['shapes']),
          text: new Set(['fonts']),
          'ai-tools': new Set(['suggestions']),
          layers: new Set(['canvas']),
          assets: new Set(['recent'])
        }
      });
    },

    setAnimationState: (isAnimating: boolean, direction: 'left' | 'right' | 'none' = 'none') => {
      set({ isAnimating, animationDirection: direction });
    },

    setLeftSidebarCollapsed: (collapsed: boolean) => {
      set({ leftSidebarCollapsed: collapsed });
    },

    setMiddlePanelCollapsed: (collapsed: boolean) => {
      set({ middlePanelCollapsed: collapsed });
    }
  }))
);

// Selectors for computed values
export const useActiveTray = () => useToolTrayStore(state => state.activeTray);
export const useTrayConfig = (trayId: ToolTrayType) => useToolTrayStore(state => state.trayConfigs[trayId]);
export const useTrayData = (trayId: ToolTrayType) => useToolTrayStore(state => state.trayData[trayId]);
export const useTrayFilters = (trayId: ToolTrayType) => useToolTrayStore(state => state.filters[trayId] || {});
export const useTrayViewMode = (trayId: ToolTrayType) => useToolTrayStore(state => state.viewMode[trayId]);
export const useExpandedSections = (trayId: ToolTrayType) => useToolTrayStore(state => state.expandedSections[trayId]);
export const useAnimationState = () => {
  const isAnimating = useToolTrayStore(state => state.isAnimating);
  const direction = useToolTrayStore(state => state.animationDirection);
  return { isAnimating, direction };
};

export default useToolTrayStore;
