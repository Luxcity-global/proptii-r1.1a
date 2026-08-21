import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Audience } from '../types/govData';
import { fetchRuntimeFlags } from '../services/govDataService';

interface GovDataLayerContextValue {
  /** True after the first flag fetch attempt completes. */
  ready: boolean;
  /** Runtime gate for all r1.4 surfaces. */
  enabled: boolean;
  audience: Audience | null;
  setAudience: (audience: Audience | null) => void;
  refreshFlags: () => Promise<void>;
}

const defaultValue: GovDataLayerContextValue = {
  ready: true,
  enabled: false,
  audience: null,
  setAudience: () => {},
  refreshFlags: async () => {},
};

const GovDataLayerContext = createContext<GovDataLayerContextValue>(defaultValue);

export const useGovDataLayer = () => useContext(GovDataLayerContext);

export const GovDataLayerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [ready, setReady] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [audience, setAudience] = useState<Audience | null>(null);

  const refreshFlags = useCallback(async () => {
    try {
      const flags = await fetchRuntimeFlags();
      setEnabled(Boolean(flags.gov_data_layer));
    } catch {
      setEnabled(false);
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    void refreshFlags();
  }, [refreshFlags]);

  const value = useMemo(
    () => ({
      ready,
      enabled,
      audience,
      setAudience,
      refreshFlags,
    }),
    [ready, enabled, audience, refreshFlags],
  );

  return (
    <GovDataLayerContext.Provider value={value}>{children}</GovDataLayerContext.Provider>
  );
};
