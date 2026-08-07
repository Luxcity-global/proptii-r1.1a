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
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import { useAuth } from './AuthContext';
import { consumePendingProperty } from '../utils/onboardingSession';

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

function firestoreColRef(userId: string) {
  return collection(db, 'savedProperties', userId, 'items');
}

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

  // ─── P2-3: Subscribe to Firestore when authenticated ─────────────────────────
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

    // Set to empty first to prevent state bleed during network hydration
    setSavedProperties([]);

    // On first auth, merge any local-only saves into Firestore
    const syncLocalToFirestore = async (local: SavedProperty[]) => {
      if (!local.length) return;
      const col = firestoreColRef(user.id);
      const existing = await getDocs(col);
      const existingIds = new Set(existing.docs.map(d => d.id));
      for (const prop of local) {
        if (!existingIds.has(prop.id)) {
          await setDoc(doc(col, prop.id), { ...prop, savedAt: prop.savedAt || new Date().toISOString() });
        }
      }
    };

    // Snapshot listener keeps state in sync across devices
    const unsubscribe = onSnapshot(
      firestoreColRef(user.id),
      (snapshot) => {
        const remote = snapshot.docs.map(d => d.data() as SavedProperty);
        setSavedProperties(remote);
      },
      (err) => console.error('SavedProperties Firestore listener error:', err)
    );

    // Fire-and-forget local→Firestore sync on first mount
    setSavedProperties(local => {
      syncLocalToFirestore(local).catch(console.error);
      return local;
    });

    return () => unsubscribe();
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

    // Optimistic local update (Firestore listener will confirm)
    setSavedProperties(prev => [...prev, savedProperty]);

    if (user?.id) {
      try {
        await setDoc(doc(firestoreColRef(user.id), propertyId), savedProperty);
      } catch (err) {
        console.error('Failed to save property to Firestore:', err);
        // localStorage already updated — property is retained offline
      }
    }
  }, [isPropertySaved, user?.id]);

  const unsaveProperty = useCallback(async (propertyId: string) => {
    setSavedProperties(prev => prev.filter(prop => prop.id !== propertyId));

    if (user?.id) {
      try {
        await deleteDoc(doc(firestoreColRef(user.id), propertyId));
      } catch (err) {
        console.error('Failed to delete property from Firestore:', err);
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
