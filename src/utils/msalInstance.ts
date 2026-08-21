import {
  PublicClientApplication,
  EventType,
  type EventMessage,
} from '@azure/msal-browser';
import { msalConfig } from '../config/authConfig';

let msalInstance: PublicClientApplication | null = null;
let msalInitPromise: Promise<void> | null = null;

/** Shared MSAL singleton — safe to import from services without pulling in AuthContext. */
export const getMsalInstance = (): PublicClientApplication => {
  if (!msalInstance) {
    msalInstance = new PublicClientApplication(msalConfig);

    msalInitPromise = msalInstance.initialize();
    msalInitPromise.catch((error) => {
      console.error('Error initializing MSAL:', error);
    });

    msalInstance.addEventCallback((event: EventMessage) => {
      if (event.eventType === EventType.LOGIN_SUCCESS) {
        window.dispatchEvent(new CustomEvent('auth-state-changed'));
      }
      if (event.eventType === EventType.LOGOUT_SUCCESS) {
        window.dispatchEvent(new CustomEvent('auth-state-changed'));
      }
      if (event.eventType === EventType.LOGIN_FAILURE || event.eventType === EventType.ACQUIRE_TOKEN_FAILURE) {
        window.dispatchEvent(new CustomEvent('auth-state-changed'));
      }
    });
  }
  return msalInstance;
};

/** Wait until MSAL `initialize()` has finished before calling acquireTokenSilent / loginPopup. */
export async function waitForMsalReady(): Promise<void> {
  if (!msalInstance) {
    getMsalInstance();
  }
  if (msalInitPromise) {
    await msalInitPromise;
  }
}
