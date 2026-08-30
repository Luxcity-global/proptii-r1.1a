/**
 * SavedPropertiesContext
 *
 * Fixes applied:
 *  P2-3: Properties are persisted to Firestore `savedProperties/{userId}/items/{id}`
 *        when the user is authenticated, so they survive device/browser changes.
 *        localStorage remains as an offline-first cache for unauthenticated users.
 *  P2-4: The property ID now prefers the stable backend id or url over the fragile
 *        title-location-price string concatenation.
 *  P2-5: Added cursor-based server-side pagination for efficiency.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { consumePendingProperty } from '../utils/onboardingSession';
import apiService from '../services/api';

export interface SavedProperty {
  id: string;
  title: string;
  price: string;
  location: string;
  bedrooms: string;
  propertyType: string;
  imageUrls: string[];
  agent: {
    id?: string;
    name: string;
    email: string;
    phone?: string;
    company?: string;
    website?: string;
  };
  source?: string;
  description?: string;
  savedAt: string;
}

interface SavedPropertiesContextType {
  savedProperties: SavedProperty[];
  allSavedIds: string[];
  hasMore: boolean;
  isLoading: boolean;
  loadMore: () => Promise<void>;
  isPropertySaved: (propertyId: string) => boolean;
  saveProperty: (property: any) => void;
  unsaveProperty: (propertyId: string) => void;
  toggleSaveProperty: (property: any) => void;
}

const SavedPropertiesContext = createContext<SavedPropertiesContextType | undefined>(undefined);

export const useSavedProperties = () => {
  const context = useContext(SavedPropertiesContext);
  if (context === undefined) {
    throw new Error('useSavedProperties must be used within a SavedPropertiesProvider');
  }
  return context;
};

/**
 * P2-4: Derive a stable property ID.
 * Priority: explicit backend id → scraped url → title-location-price fallback.
 */
function stablePropertyId(property: any): string {
  if (property.id && typeof property.id === 'string' && property.id.trim()) {
    return property.id.trim();
  }
  if (property.url && typeof property.url === 'string' && property.url.trim()) {
    return property.url.trim();
  }
  // Last resort — fragile but keeps backward compatibility with existing saved items
  return `${property.title}-${property.location}-${property.price}`;
}

interface SavedPropertiesProviderProps {
  children: ReactNode;
}

export const SavedPropertiesProvider: React.FC<SavedPropertiesProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [savedProperties, setSavedProperties] = useState<SavedProperty[]>([]);
  const [allSavedIds, setAllSavedIds] = useState<string[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [lastVisible, setLastVisible] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // ─── Bootstrap from localStorage (works for unauthenticated users too) ──────
  useEffect(() => {
    const raw = localStorage.getItem('savedProperties');
    let parsed: SavedProperty[] = [];
    if (raw) {
      try { parsed = JSON.parse(raw); } catch { localStorage.removeItem('savedProperties'); }
    }

    // Migrate pending onboarding property
    const pending = consumePendingProperty();
    if (pending && typeof pending === 'object' && 'title' in pending) {
      const prop = pending as Record<string, unknown>;
      const propertyId = stablePropertyId(prop);
      if (!parsed.some(p => p.id === propertyId)) {
        const agentData = (prop.agent as Record<string, unknown>) || {};
        parsed.push({
          id: propertyId,
          title: String(prop.title ?? ''),
          price: String(prop.price ?? ''),
          location: String(prop.location ?? ''),
          bedrooms: String(prop.bedrooms ?? ''),
          propertyType: String(prop.propertyType ?? ''),
          imageUrls: Array.isArray(prop.imageUrls) ? (prop.imageUrls as string[]) : [],
          agent: {
            id: agentData.id as string | undefined,
            name: String(agentData.name ?? prop.source ?? 'Unknown Agent'),
            email: String(agentData.email ?? ''),
            phone: agentData.phone as string | undefined,
            company: agentData.company as string | undefined,
            website: agentData.website as string | undefined,
          },
          source: prop.source as string | undefined,
          description: prop.description as string | undefined,
          savedAt: new Date().toISOString(),
        });
      }
    }

    setSavedProperties(parsed);
    setAllSavedIds(parsed.map(p => p.id));
    setIsInitialized(true);
  }, []);

  // ─── Keep localStorage in sync (offline cache) ───────────────────────────────
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem('savedProperties', JSON.stringify(savedProperties));
    }
  }, [savedProperties, isInitialized]);

  // ─── Fetch from Backend when authenticated ─────────────────────────────────
  const fetchProperties = useCallback(async (reset = false, currentLast: string | null = null) => {
    if (!user?.id) return;
    
    try {
      setIsLoading(true);
      const limit = 6;
      let url = `/users/me/saved-properties?limit=${limit}`;
      if (currentLast) {
        url += `&lastVisible=${encodeURIComponent(currentLast)}`;
      }
      
      const response = await apiService.get(url);
      
      const items = Array.isArray(response.items) ? response.items : (Array.isArray(response) ? response : (response.data || []));
      const fetchedAllIds = response.allIds || items.map((i: any) => i.id);
      const hasMoreFlag = response.hasMore || false;
      const newLast = response.lastVisible || null;

      if (reset) {
        setSavedProperties(items);
      } else if (items.length > 0) {
        setSavedProperties(prev => {
          const existingIds = new Set(prev.map(i => i.id));
          const newItems = items.filter((i: any) => !existingIds.has(i.id));
          return [...prev, ...newItems];
        });
      }
      
      setAllSavedIds(prev => Array.from(new Set([...prev, ...fetchedAllIds])));
      setHasMore(hasMoreFlag);
      setLastVisible(newLast);
    } catch (err) {
      console.error('Failed to fetch saved properties from backend:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) {
      // Restore guest saved properties from localStorage if unauthenticated
      const raw = localStorage.getItem('savedProperties');
      let parsed: SavedProperty[] = [];
      if (raw) {
        try { parsed = JSON.parse(raw); } catch {}
      }
      setSavedProperties(parsed);
      setAllSavedIds(parsed.map(p => p.id));
      return;
    }

    let isMounted = true;

    // On first auth, merge any local-only saves into backend
    const syncLocalToBackend = async (local: SavedProperty[]) => {
      if (!local.length) return;
      try {
        const response = await apiService.get('/users/me/saved-properties?limit=100');
        const existing = Array.isArray(response.items) ? response.items : (Array.isArray(response) ? response : (response.data || []));
        const existingIds = new Set(existing.map((d: any) => d.id));
        for (const prop of local) {
          if (!existingIds.has(prop.id)) {
            await apiService.post('/users/me/saved-properties', { ...prop, savedAt: prop.savedAt || new Date().toISOString() });
          }
        }
      } catch (err) {
        console.error('Failed to sync local properties to backend:', err);
      }
    };

    setSavedProperties(local => {
      syncLocalToBackend(local).then(() => {
        if (isMounted) fetchProperties(true);
      });
      return local;
    });

    return () => {
      isMounted = false;
    };
  }, [user?.id, fetchProperties]);

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoading || !lastVisible) return;
    await fetchProperties(false, lastVisible);
  }, [hasMore, isLoading, lastVisible, fetchProperties]);

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  const isPropertySaved = useCallback((target: any): boolean => {
    if (!target) return false;

    if (typeof target === 'string') {
      const cleanTarget = target.trim();
      return allSavedIds.includes(cleanTarget) || savedProperties.some(prop =>
        prop.id === cleanTarget ||
        (prop as any).url === cleanTarget ||
        `${prop.title}-${prop.location}-${prop.price}` === cleanTarget
      );
    }

    const targetId = target.id || target.url || stablePropertyId(target);
    const targetKey = `${target.title}-${target.location}-${target.price}`;

    return allSavedIds.includes(targetId) || savedProperties.some(prop => {
      if (prop.id && (prop.id === targetId || prop.id === target.id || prop.id === target.url)) return true;
      if ((prop as any).url && (prop as any).url === target.url) return true;
      const propKey = `${prop.title}-${prop.location}-${prop.price}`;
      return propKey === targetKey;
    });
  }, [savedProperties, allSavedIds]);

  const saveProperty = useCallback(async (property: any) => {
    const propertyId = stablePropertyId(property);
    if (isPropertySaved(propertyId)) return;

    const agentData = property.agent || {};
    const savedProperty: SavedProperty = {
      id: propertyId,
      title: property.title,
      price: property.price,
      location: property.location,
      bedrooms: property.bedrooms,
      propertyType: property.propertyType,
      imageUrls: property.imageUrls || [],
      agent: {
        id: agentData.id || agentData.name || property.source || `agent-${Date.now()}`,
        name: agentData.name || property.source || 'Unknown Agent',
        email: agentData.email || '',
        phone: agentData.phone || '',
        company: agentData.company || property.source || 'Estate Agency',
        website: agentData.website,
      },
      source: property.source,
      description: property.description,
      savedAt: new Date().toISOString(),
    };

    // Optimistic local update
    setSavedProperties(prev => [savedProperty, ...prev]);
    setAllSavedIds(prev => [propertyId, ...prev]);

    if (user?.id) {
      try {
        await apiService.post('/users/me/saved-properties', savedProperty);
      } catch (err) {
        console.error('Failed to save property to backend:', err);
        // localStorage already updated — property is retained offline
      }
    }
  }, [isPropertySaved, user?.id]);

  const unsaveProperty = useCallback(async (propertyId: string) => {
    setSavedProperties(prev => prev.filter(prop => prop.id !== propertyId));
    setAllSavedIds(prev => prev.filter(id => id !== propertyId));

    if (user?.id) {
      try {
        const encodedId = encodeURIComponent(propertyId);
        await apiService.delete(`/users/me/saved-properties/${encodedId}`);
      } catch (err) {
        console.error('Failed to delete property from backend:', err);
      }
    }
  }, [user?.id]);

  const toggleSaveProperty = useCallback((property: any) => {
    const propertyId = stablePropertyId(property);
    if (isPropertySaved(propertyId)) {
      unsaveProperty(propertyId);
    } else {
      saveProperty(property);
    }
  }, [isPropertySaved, saveProperty, unsaveProperty]);

  return (
    <SavedPropertiesContext.Provider value={{
      savedProperties,
      allSavedIds,
      hasMore,
      isLoading,
      loadMore,
      isPropertySaved,
      saveProperty,
      unsaveProperty,
      toggleSaveProperty,
    }}>
      {children}
    </SavedPropertiesContext.Provider>
  );
};
