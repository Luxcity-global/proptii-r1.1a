/// <reference types="vite/client" />

// Google Maps API types
declare global {
  interface Window {
    google?: {
      maps: typeof google.maps;
    };
  }
}

// Basic Google Maps types
declare namespace google {
  namespace maps {
    class Map {
      constructor(element: HTMLElement, options?: MapOptions);
      setCenter(latlng: LatLng | LatLngLiteral): void;
      setZoom(zoom: number): void;
      setMapTypeId(mapTypeId: MapTypeId): void;
    }

    class Marker {
      constructor(options?: MarkerOptions);
      setMap(map: Map | null): void;
      addListener(eventName: string, handler: Function): void;
    }

    class InfoWindow {
      constructor(options?: InfoWindowOptions);
      open(map?: Map | StreetViewPanorama, anchor?: Marker | MVCObject): void;
      setContent(content: string | Node): void;
    }

    class Geocoder {
      geocode(request: GeocoderRequest, callback: (results: GeocoderResult[] | null, status: GeocoderStatus) => void): void;
    }

    class LatLngBounds {
      constructor(sw?: LatLng | LatLngLiteral, ne?: LatLng | LatLngLiteral);
      extend(point: LatLng | LatLngLiteral): void;
      getCenter(): LatLng;
      getNorthEast(): LatLng;
      getSouthWest(): LatLng;
    }

    interface MapOptions {
      center?: LatLng | LatLngLiteral;
      zoom?: number;
      mapTypeControl?: boolean;
      mapTypeControlOptions?: MapTypeControlOptions;
      streetViewControl?: boolean;
      fullscreenControl?: boolean;
      zoomControl?: boolean;
      zoomControlOptions?: ZoomControlOptions;
    }

    interface LatLng {
      lat(): number;
      lng(): number;
    }

    interface LatLngLiteral {
      lat: number;
      lng: number;
    }

    enum MapTypeId {
      ROADMAP = 'roadmap',
      SATELLITE = 'satellite',
      HYBRID = 'hybrid',
      TERRAIN = 'terrain',
    }

    interface MarkerOptions {
      position?: LatLng | LatLngLiteral;
      map?: Map | null;
      title?: string;
      icon?: string | Icon | Symbol;
    }

    interface InfoWindowOptions {
      content?: string | Node;
      position?: LatLng | LatLngLiteral;
    }

    interface Icon {
      url?: string;
      scaledSize?: Size;
      size?: Size;
    }

    interface Symbol {
      path?: SymbolPath | string;
      scale?: number;
    }

    enum SymbolPath {
      CIRCLE = 0,
      FORWARD_CLOSED_ARROW = 1,
      FORWARD_OPEN_ARROW = 2,
      BACKWARD_CLOSED_ARROW = 3,
      BACKWARD_OPEN_ARROW = 4,
    }

    class Size {
      constructor(width: number, height: number);
    }

    interface MapTypeControlOptions {
      style?: MapTypeControlStyle;
      position?: ControlPosition;
    }

    enum MapTypeControlStyle {
      DEFAULT = 0,
      HORIZONTAL_BAR = 1,
      DROPDOWN_MENU = 2,
      INSET = 3,
      INSET_LARGE = 4,
    }

    enum ControlPosition {
      TOP_LEFT = 1,
      TOP_CENTER = 2,
      TOP_RIGHT = 3,
      LEFT_TOP = 4,
      RIGHT_TOP = 5,
      LEFT_CENTER = 6,
      RIGHT_CENTER = 7,
      LEFT_BOTTOM = 8,
      RIGHT_BOTTOM = 9,
      BOTTOM_LEFT = 11,
      BOTTOM_CENTER = 12,
      BOTTOM_RIGHT = 13,
    }

    interface ZoomControlOptions {
      position?: ControlPosition;
    }

    interface GeocoderRequest {
      address?: string;
      location?: LatLng | LatLngLiteral;
    }

    interface GeocoderResult {
      geometry: {
        location: LatLng;
      };
    }

    enum GeocoderStatus {
      ERROR = 'ERROR',
      INVALID_REQUEST = 'INVALID_REQUEST',
      OK = 'OK',
      OVER_QUERY_LIMIT = 'OVER_QUERY_LIMIT',
      REQUEST_DENIED = 'REQUEST_DENIED',
      UNKNOWN_ERROR = 'UNKNOWN_ERROR',
      ZERO_RESULTS = 'ZERO_RESULTS',
    }

    class MVCObject {
      // Minimal implementation
    }

    class StreetViewPanorama {
      // Minimal implementation
    }
  }
}

export {};