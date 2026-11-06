import React, { useState, useEffect, useRef, memo } from 'react';
import type { Property } from '../../hooks/useSearchBackend';

interface SearchMapProps {
  showMap: boolean;
  properties: Property[];
  searchQuery: string;
  locationLabel: string;
  resolvedLocation?: { displayName?: string; coordinates?: { lat: number; lng: number } } | null;
  onPropertySelect: (property: Property) => void;
}

export const SearchMap: React.FC<SearchMapProps> = memo(({
  showMap,
  properties,
  searchQuery,
  locationLabel,
  resolvedLocation,
  onPropertySelect,
}) => {
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [mapNode, setMapNode] = useState<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const markersGeocodedRef = useRef<boolean>(false);
  const boundsFittedRef = useRef<boolean>(false);
  const boundsFittedTimeRef = useRef<number>(0);
  const lastResultsKeyRef = useRef<string | null>(null);
  const searchLocationCenteredRef = useRef<string | null>(null);
  const onSelectRef = useRef(onPropertySelect);
  onSelectRef.current = onPropertySelect;

  // Helper function to safely set map center
  const safeSetMapCenter = (location: { lat: number; lng: number } | any, zoom?: number) => {
    if (boundsFittedRef.current || (markersGeocodedRef.current && markersRef.current.length > 0)) {
      return false;
    }
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setCenter(location);
      if (zoom !== undefined) {
        mapInstanceRef.current.setZoom(zoom);
      }
      return true;
    }
    return false;
  };

  const safeSetMapZoom = (zoom: number) => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setZoom(zoom);
    }
  };

  // Load Google Maps API script
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if ((window as any).google && (window as any).google.maps) {
      setIsMapLoaded(true);
      return;
    }

    if (!document.getElementById('google-maps-script')) {
      const script = document.createElement('script');
      script.id = 'google-maps-script';
      script.src = `https://maps.googleapis.com/maps/api/js?key=${(import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY || ''}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => setIsMapLoaded(true);
      script.onerror = () => console.error('Failed to load Google Maps script');
      document.head.appendChild(script);
    } else {
      const checkGoogle = setInterval(() => {
        if ((window as any).google && (window as any).google.maps) {
          setIsMapLoaded(true);
          clearInterval(checkGoogle);
        }
      }, 100);
      return () => clearInterval(checkGoogle);
    }
  }, []);

  // Initialize map when showMap is true, script is loaded, and DOM node is ready
  useEffect(() => {
    const win = window as any;
    if (showMap && isMapLoaded && mapNode && win.google && win.google.maps) {
      if (mapInstanceRef.current) {
        const mapDiv = mapInstanceRef.current.getDiv ? mapInstanceRef.current.getDiv() : null;
        if (mapDiv === mapNode) {
          return;
        }
        markersGeocodedRef.current = false;
        boundsFittedRef.current = false;
        boundsFittedTimeRef.current = 0;
        lastResultsKeyRef.current = null;
        searchLocationCenteredRef.current = null;
        markersRef.current = [];
      }

      try {
        mapInstanceRef.current = new win.google.maps.Map(mapNode, {
          center: { lat: 54.0, lng: -2.0 }, // Center of UK
          zoom: 6,
          mapTypeControl: true,
          streetViewControl: true,
          fullscreenControl: true,
          zoomControl: true,
        });

        if (
          searchQuery &&
          win.google.maps &&
          searchLocationCenteredRef.current !== searchQuery &&
          !boundsFittedRef.current &&
          !markersGeocodedRef.current &&
          markersRef.current.length === 0
        ) {
          const geocoder = new win.google.maps.Geocoder();
          const locationMatch = searchQuery.match(/(?:in|at|near)\s+([A-Za-z\s]+)/i);
          const locationToGeocode = locationMatch ? locationMatch[1].trim() : searchQuery;
          searchLocationCenteredRef.current = searchQuery;

          geocoder.geocode({ address: locationToGeocode }, (results: any, status: string) => {
            if (boundsFittedRef.current || markersGeocodedRef.current || markersRef.current.length > 0) {
              return;
            }
            if (status === 'OK' && results && results[0] && mapInstanceRef.current) {
              safeSetMapCenter(results[0].geometry.location, 12);
            } else {
              safeSetMapCenter({ lat: 51.5074, lng: -0.1278 }, 12);
            }
          });
        } else {
          safeSetMapCenter({ lat: 54.0, lng: -2.0 }, 6);
        }
      } catch (error) {
        console.error('Error initializing map:', error);
      }
    }
  }, [showMap, isMapLoaded, mapNode]);

  // Reset search location centering ref when search query actually changes
  useEffect(() => {
    if (searchLocationCenteredRef.current !== null && searchLocationCenteredRef.current !== searchQuery) {
      searchLocationCenteredRef.current = null;
    }
  }, [searchQuery]);

  // Center map when resolvedLocation arrives
  useEffect(() => {
    if (showMap && isMapLoaded && mapInstanceRef.current && resolvedLocation?.coordinates) {
      if (!boundsFittedRef.current && (!markersGeocodedRef.current || markersRef.current.length === 0)) {
        safeSetMapCenter(resolvedLocation.coordinates, 13);
        searchLocationCenteredRef.current = searchQuery;
      }
    }
  }, [resolvedLocation, showMap, isMapLoaded, searchQuery]);

  // Geocode properties and add markers
  useEffect(() => {
    const win = window as any;
    if (showMap && isMapLoaded && mapInstanceRef.current && win.google && win.google.maps && properties.length > 0) {
      const resultsKey = properties.map((r) => `${r.location}-${r.title}-${r.price}`).join('|');
      if (lastResultsKeyRef.current === resultsKey && markersGeocodedRef.current) {
        return;
      }

      if (lastResultsKeyRef.current !== resultsKey) {
        lastResultsKeyRef.current = resultsKey;

        const timeoutId = setTimeout(() => {
          const geocoder = new win.google.maps.Geocoder();
          const bounds = new win.google.maps.LatLngBounds();

          markersRef.current.forEach((marker) => marker.setMap(null));
          markersRef.current = [];
          markersGeocodedRef.current = false;
          boundsFittedRef.current = false;

          const propertiesWithAddresses = properties.filter((prop) => prop.location && prop.location.trim());
          const totalProperties = propertiesWithAddresses.length;
          if (totalProperties === 0) return;

          let completedCount = 0;
          let successfulGeocodes = 0;

          const checkAndFitBounds = () => {
            completedCount++;
            if (completedCount === totalProperties) {
              if (successfulGeocodes > 0) {
                setTimeout(() => {
                  try {
                    const ne = bounds.getNorthEast();
                    const sw = bounds.getSouthWest();
                    if (ne && sw) {
                      const latDiff = Math.abs(ne.lat() - sw.lat());
                      const lngDiff = Math.abs(ne.lng() - sw.lng());

                      if (latDiff > 0.001 || lngDiff > 0.001) {
                        boundsFittedRef.current = true;
                        boundsFittedTimeRef.current = Date.now();
                        mapInstanceRef.current.fitBounds(bounds, { top: 80, right: 80, bottom: 80, left: 80 });

                        win.google.maps.event.addListenerOnce(mapInstanceRef.current, 'idle', () => {
                          const currentZoom = mapInstanceRef.current.getZoom();
                          if (currentZoom < 10) safeSetMapZoom(10);
                          else if (currentZoom > 15) safeSetMapZoom(15);
                          markersGeocodedRef.current = true;
                          boundsFittedRef.current = true;
                        });
                        markersGeocodedRef.current = true;
                      } else if (successfulGeocodes === 1) {
                        boundsFittedRef.current = true;
                        boundsFittedTimeRef.current = Date.now();
                        const singleMarker = markersRef.current[0];
                        if (singleMarker && mapInstanceRef.current) {
                          mapInstanceRef.current.setCenter(singleMarker.getPosition());
                          mapInstanceRef.current.setZoom(14);
                        }
                        markersGeocodedRef.current = true;
                      }
                    }
                  } catch (error) {
                    console.error('Error fitting bounds:', error);
                    if (markersRef.current.length > 0 && mapInstanceRef.current) {
                      boundsFittedRef.current = true;
                      boundsFittedTimeRef.current = Date.now();
                      mapInstanceRef.current.setCenter(markersRef.current[0].getPosition());
                      mapInstanceRef.current.setZoom(12);
                    }
                    markersGeocodedRef.current = true;
                  }
                }, 300);
              }
            }
          };

          const createMarkerForProperty = (location: any, property: Property, index: number) => {
            const marker = new win.google.maps.Marker({
              position: location,
              map: mapInstanceRef.current,
              title: property.title,
              animation: win.google.maps.Animation.DROP,
              optimized: false,
            });

            const propertyId = `prop-${index}-${Date.now()}`;
            const imageUrls = property.imageUrls || [];
            const firstImageUrl = imageUrls.length > 0 ? imageUrls[0] : '';

            const infoWindow = new win.google.maps.InfoWindow({
              headerDisabled: true,
              content: `
                <div id="map-iw-${propertyId}" class="sr-map-iw">
                  ${firstImageUrl ? `
                    <div style="position: relative; width: 100%; height: 150px; overflow: hidden; border-radius: 12px 12px 0 0; background-color: #f0f0f0;">
                      <img id="info-img-${propertyId}" src="${firstImageUrl}" alt="Property" style="width: 100%; height: 100%; object-fit: cover; transition: opacity 0.3s;" />
                      ${imageUrls.length > 1 ? `
                        <button id="prev-btn-${propertyId}" style="position: absolute; left: 8px; top: 50%; transform: translateY(-50%); background: rgba(0,0,0,0.6); color: white; border: none; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 18px; line-height: 1; padding: 0; z-index: 10;">‹</button>
                        <button id="next-btn-${propertyId}" style="position: absolute; right: 8px; top: 50%; transform: translateY(-50%); background: rgba(0,0,0,0.6); color: white; border: none; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 18px; line-height: 1; padding: 0; z-index: 10;">›</button>
                        <div id="img-counter-${propertyId}" style="position: absolute; bottom: 8px; right: 8px; background: rgba(0,0,0,0.6); color: white; padding: 4px 8px; border-radius: 12px; font-size: 11px; font-weight: 500; z-index: 10;">1/${imageUrls.length}</div>
                      ` : ''}
                    </div>
                  ` : ''}
                  <div style="padding: 12px;">
                    <h4 style="font-weight: bold; margin: 0 0 8px 0; font-size: 15px; color: #1a1a1a; display: flex; align-items: start;">
                      <span style="flex: 1;">${property.location}</span>
                    </h4>
                    <p style="margin: 0 0 8px 0; font-size: 13px; color: #666;">${property.title || 'Property'}</p>
                    <p style="margin: 0 0 4px 0; font-size: 16px; font-weight: bold; color: #E65D24;">${property.price || 'N/A'}</p>
                    <p style="margin: 0; font-size: 12px; color: #666;">
                      <strong>${property.bedrooms === 0 ? 'Studio' : property.bedrooms ? `${property.bedrooms} beds` : 'Beds unspecified'}</strong> • <strong>${property.propertyType || 'Property'}</strong>
                    </p>
                  </div>
                </div>
              `,
            });

            win.google.maps.event.addListener(infoWindow, 'domready', () => {
              const card = document.getElementById(`map-iw-${propertyId}`);
              const iwContainer = card?.closest('.gm-style-iw-c') as HTMLElement | null;
              if (iwContainer && !iwContainer.querySelector('.sr-map-iw-close')) {
                const closeBtn = document.createElement('button');
                closeBtn.type = 'button';
                closeBtn.className = 'sr-map-iw-close';
                closeBtn.setAttribute('aria-label', 'Close listing');
                closeBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" d="M6 6l12 12M18 6L6 18" /></svg>';
                closeBtn.addEventListener('click', (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  infoWindow.close();
                });
                iwContainer.appendChild(closeBtn);
              }
              card?.addEventListener('click', (e) => {
                const target = e.target as HTMLElement | null;
                if (target?.closest('button')) return;
                onSelectRef.current(property);
              });

              const imgEl = document.getElementById(`info-img-${propertyId}`) as HTMLImageElement;
              const prevBtn = document.getElementById(`prev-btn-${propertyId}`) as HTMLButtonElement;
              const nextBtn = document.getElementById(`next-btn-${propertyId}`) as HTMLButtonElement;
              const counterEl = document.getElementById(`img-counter-${propertyId}`) as HTMLDivElement;
              if (!imgEl || imageUrls.length <= 1) return;

              let currentIndex = 0;
              const updateImage = () => {
                if (imgEl) imgEl.src = imageUrls[currentIndex];
                if (counterEl) counterEl.textContent = `${currentIndex + 1}/${imageUrls.length}`;
                if (prevBtn) prevBtn.style.display = currentIndex > 0 ? 'flex' : 'none';
                if (nextBtn) nextBtn.style.display = currentIndex < imageUrls.length - 1 ? 'flex' : 'none';
              };

              prevBtn?.addEventListener('click', (e) => {
                e.stopPropagation();
                if (currentIndex > 0) {
                  currentIndex--;
                  updateImage();
                }
              });

              nextBtn?.addEventListener('click', (e) => {
                e.stopPropagation();
                if (currentIndex < imageUrls.length - 1) {
                  currentIndex++;
                  updateImage();
                }
              });

              updateImage();
            });

            marker.addListener('click', () => {
              markersRef.current.forEach((m) => {
                if (m.infoWindow) m.infoWindow.close();
              });
              infoWindow.open(mapInstanceRef.current, marker);
            });

            (marker as any).infoWindow = infoWindow;
            markersRef.current.push(marker);
            bounds.extend(location);
            successfulGeocodes++;
          };

          let fallbackGeocodeDelay = 0;
          propertiesWithAddresses.forEach((property, index) => {
            if (
              property.coordinates &&
              typeof property.coordinates.lat === 'number' &&
              typeof property.coordinates.lng === 'number' &&
              !isNaN(property.coordinates.lat) &&
              !isNaN(property.coordinates.lng)
            ) {
              createMarkerForProperty(property.coordinates, property, index);
              checkAndFitBounds();
              return;
            }

            const address = property.location.trim();
            fallbackGeocodeDelay++;
            setTimeout(() => {
              geocoder.geocode({ address }, (geocodeResults: any, status: string) => {
                if (status === 'OK' && geocodeResults && geocodeResults[0]) {
                  createMarkerForProperty(geocodeResults[0].geometry.location, property, index);
                }
                checkAndFitBounds();
              });
            }, fallbackGeocodeDelay * 150);
          });
        }, 500);

        return () => clearTimeout(timeoutId);
      }
    }
  }, [showMap, isMapLoaded, properties, mapNode]);

  // Reset when map is closed
  useEffect(() => {
    if (!showMap) {
      markersGeocodedRef.current = false;
      boundsFittedRef.current = false;
      boundsFittedTimeRef.current = 0;
      lastResultsKeyRef.current = null;
      markersRef.current.forEach((m) => m.setMap(null));
      markersRef.current = [];
      mapInstanceRef.current = null;
    }
  }, [showMap]);

  if (!showMap) return null;

  return (
    <div className="sr-map-frame" id="map-container">
      {!isMapLoaded ? (
        <div className="sr-map-loading">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-[#136C9E] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading map...</p>
          </div>
        </div>
      ) : (
        <div
          ref={setMapNode}
          className="sr-map-canvas"
          style={{ height: '100%', minHeight: 360 }}
        />
      )}
      <div className="sr-map-pill">
        <span className="sr-dot" />
        <span>Showing active properties in {locationLabel}</span>
      </div>
    </div>
  );
});

SearchMap.displayName = 'SearchMap';
