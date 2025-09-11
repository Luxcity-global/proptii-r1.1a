/// <reference types="@types/google.maps" />

// Extend the global window object to include Google Maps
declare global {
  interface Window {
    google: typeof google;
  }
}

// Export for use in other files
export {};
