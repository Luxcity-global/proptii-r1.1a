import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';
import { loadGoogleMapsScript } from '../../../utils/mapsEmbed';
import { staticMapImageUrls } from '../../../utils/reportMapEmbed';
import { resolveMapCoordinates } from '../../../utils/reportMapCoords';
import { ReportMapZoomControls } from './ReportMapZoomControls';

export type ReportMapStatus = 'loading' | 'ready' | 'failed';

type MapMode = 'loading' | 'google' | 'static' | 'failed';

interface ReportLocationMapProps {
  query: string;
  onStatusChange?: (status: ReportMapStatus) => void;
}

const TEST_COORDS = { lat: 51.501, lng: -0.141 };
const DEFAULT_ZOOM = 15;
const MIN_ZOOM = 10;
const MAX_ZOOM = 18;
const GOOGLE_RED = '#EA4335';

async function resolveCoords(query: string) {
  if (import.meta.env.MODE === 'test') return TEST_COORDS;
  const coords = await resolveMapCoordinates(query);
  if (!coords) return null;
  return { lat: coords.lat, lng: coords.lng };
}

/**
 * Approximate location map — interactive Google Maps when available,
 * otherwise static tiles with Google-style zoom controls and a red pin.
 */
export const ReportLocationMap: React.FC<ReportLocationMapProps> = ({
  query,
  onStatusChange,
}) => {
  const mapNodeRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const googleMarkerRef = useRef<google.maps.Marker | null>(null);

  const [mode, setMode] = useState<MapMode>('loading');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [candidateUrls, setCandidateUrls] = useState<string[]>([]);
  const [urlIndex, setUrlIndex] = useState(0);

  const imageSrc = useMemo(() => candidateUrls[urlIndex] ?? null, [candidateUrls, urlIndex]);

  useEffect(() => {
    onStatusChange?.('loading');
  }, [query, onStatusChange]);

  useEffect(() => {
    let cancelled = false;
    setMode('loading');
    setCoords(null);
    setZoom(DEFAULT_ZOOM);
    setCandidateUrls([]);
    setUrlIndex(0);

    if (import.meta.env.MODE === 'test') {
      setCoords(TEST_COORDS);
      setMode('static');
      setCandidateUrls(staticMapImageUrls(TEST_COORDS.lat, TEST_COORDS.lng, DEFAULT_ZOOM));
      onStatusChange?.('ready');
      return undefined;
    }

    void resolveCoords(query).then((resolved) => {
      if (cancelled) return;
      if (!resolved) {
        setMode('failed');
        onStatusChange?.('failed');
        return;
      }
      setCoords(resolved);
      setMode('google');
    });

    return () => {
      cancelled = true;
    };
  }, [query, onStatusChange]);

  useEffect(() => {
    if (mode !== 'static' || !coords) return;
    setCandidateUrls(staticMapImageUrls(coords.lat, coords.lng, zoom));
    setUrlIndex(0);
  }, [coords, mode, zoom]);

  useEffect(() => {
    if (mode !== 'google' || !coords || !mapNodeRef.current) return undefined;

    let cancelled = false;
    let idleListener: google.maps.MapsEventListener | null = null;

    void loadGoogleMapsScript()
      .then((maps) => {
        if (cancelled || !mapNodeRef.current) return;

        const map = new maps.Map(mapNodeRef.current, {
          center: { lat: coords.lat, lng: coords.lng },
          zoom: DEFAULT_ZOOM,
          zoomControl: true,
          fullscreenControl: true,
          streetViewControl: false,
          mapTypeControl: false,
          gestureHandling: 'cooperative',
        });

        const marker = new maps.Marker({
          position: { lat: coords.lat, lng: coords.lng },
          map,
          title: `Approximate location of ${query}`,
        });

        googleMapRef.current = map;
        googleMarkerRef.current = marker;

        idleListener = maps.event.addListener(map, 'idle', () => {
          if (!cancelled) onStatusChange?.('ready');
        });
        onStatusChange?.('ready');
      })
      .catch(() => {
        if (cancelled) return;
        setMode('static');
      });

    return () => {
      cancelled = true;
      idleListener?.remove();
      googleMarkerRef.current?.setMap(null);
      googleMarkerRef.current = null;
      googleMapRef.current = null;
    };
  }, [mode, coords, query, onStatusChange]);

  const handleImageError = useCallback(() => {
    if (urlIndex + 1 < candidateUrls.length) {
      setUrlIndex((index) => index + 1);
      return;
    }
    setMode('failed');
    onStatusChange?.('failed');
  }, [candidateUrls.length, onStatusChange, urlIndex]);

  const handleImageLoad = useCallback(() => {
    onStatusChange?.('ready');
  }, [onStatusChange]);

  const zoomIn = useCallback(() => {
    onStatusChange?.('loading');
    setZoom((current) => Math.min(MAX_ZOOM, current + 1));
  }, [onStatusChange]);

  const zoomOut = useCallback(() => {
    onStatusChange?.('loading');
    setZoom((current) => Math.max(MIN_ZOOM, current - 1));
  }, [onStatusChange]);

  if (mode === 'failed') {
    return null;
  }

  if (mode === 'loading' || (mode === 'static' && !imageSrc)) {
    return (
      <div
        className="h-[240px] w-full hatch sm:h-[320px]"
        data-testid="report-location-map-loading"
        aria-hidden
      />
    );
  }

  if (mode === 'google') {
    return (
      <div
        className="relative h-[240px] w-full sm:h-[320px]"
        data-testid="report-location-map"
        data-map-mode="google"
      >
        <div ref={mapNodeRef} className="h-full w-full" id="location-map" />
      </div>
    );
  }

  return (
    <div
      className="relative h-[240px] w-full sm:h-[320px]"
      data-testid="report-location-map"
      data-map-mode="static"
    >
      <img
        id="location-map"
        alt={`Approximate location of ${query}`}
        title={`Approximate location of ${query}`}
        src={imageSrc}
        loading="eager"
        decoding="async"
        referrerPolicy="no-referrer-when-downgrade"
        className="block h-full w-full object-cover grayscale-[0.2]"
        onLoad={handleImageLoad}
        onError={handleImageError}
      />
      <div
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
        aria-hidden="true"
        data-testid="report-map-pin"
      >
        <MapPin
          className="h-11 w-11 -translate-y-4 drop-shadow-[0_2px_6px_rgba(0,0,0,0.35)]"
          fill={GOOGLE_RED}
          color={GOOGLE_RED}
          strokeWidth={1.5}
        />
      </div>
      <ReportMapZoomControls
        zoom={zoom}
        minZoom={MIN_ZOOM}
        maxZoom={MAX_ZOOM}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
      />
    </div>
  );
};
