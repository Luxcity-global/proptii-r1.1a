/// <reference types="google.maps" />

declare global {
  interface Window {
    google: typeof google;
    initGoogleMaps: () => void;
    geocodeTimeout: number;
  }
}

export {};
