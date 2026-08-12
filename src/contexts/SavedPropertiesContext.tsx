/**
 * SavedPropertiesContext
 *
 * Fixes applied:
 *  P2-3: Properties are persisted to Firestore `savedProperties/{userId}/items/{id}`
 *        when the user is authenticated, so they survive device/browser changes.
 *        localStorage remains as an offline-first cache for unauthenticated users.
 *  P2-4: The property ID now prefers the stable backend id or url over the fragile
 *        title-location-price string concatenation.
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

// Helper removed: no longer using direct Firestore references

interface SavedPropertiesProviderProps {
  children: ReactNode;
}

export const SavedPropertiesProvider: React.FC<SavedPropertiesProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [savedProperties, setSavedProperties] = useState<SavedProperty[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

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
    setIsInitialized(true);
  }, []);

  // ─── Keep localStorage in sync (offline cache) ───────────────────────────────
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem('savedProperties', JSON.stringify(savedProperties));
    }
  }, [savedProperties, isInitialized]);

  // ─── Fetch from Backend when authenticated ─────────────────────────────────
  useEffect(() => {
    if (!user?.id) {
      // Restore guest saved properties from localStorage if unauthenticated
      const raw = localStorage.getItem('savedProperties');
      let parsed: SavedProperty[] = [];
      if (raw) {
        try { parsed = JSON.parse(raw); } catch {}
      }
      setSavedProperties(parsed);
      return;
    }

    let isMounted = true;

    const fetchProperties = async () => {
      try {
        const response = await apiService.get('/users/me/saved-properties');
        if (isMounted) {
          // The backend currently returns an object with a 'data' array based on standard formatting,
          // or possibly the array directly depending on the service implementation.
          const items = Array.isArray(response) ? response : (response.data || []);
          setSavedProperties(items);
        }
      } catch (err) {
        console.error('Failed to fetch saved properties from backend:', err);
      }
    };

    // On first auth, merge any local-only saves into backend
    const syncLocalToBackend = async (local: SavedProperty[]) => {
      if (!local.length) return;
      try {
        const response = await apiService.get('/users/me/saved-properties');
        const existing = Array.isArray(response) ? response : (response.data || []);
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
        fetchProperties();
      });
      return local;
    });

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  const isPropertySaved = useCallback((propertyId: string): boolean => {
    return savedProperties.some(prop => prop.id === propertyId);
  }, [savedProperties]);

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
    setSavedProperties(prev => [...prev, savedProperty]);

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

    if (user?.id) {
      try {
        await apiService.delete(`/users/me/saved-properties/${propertyId}`);
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
      isPropertySaved,
      saveProperty,
      unsaveProperty,
      toggleSaveProperty,
    }}>
      {children}
    </SavedPropertiesContext.Provider>
  );
};
