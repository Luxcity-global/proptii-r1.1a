import '@testing-library/jest-dom';
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect method with testing-library matchers
expect.extend(matchers as any);

// Mock scrollIntoView which is missing in JSDOM
if (typeof window !== 'undefined') {
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
    if (window.Element) {
        window.Element.prototype.scrollIntoView = vi.fn();
    }
}
if (typeof Element !== 'undefined') {
    Element.prototype.scrollIntoView = vi.fn();
}
if (typeof HTMLElement !== 'undefined') {
    HTMLElement.prototype.scrollIntoView = vi.fn();
}

// Mock Storage for environments where localStorage/sessionStorage is unavailable (e.g. Node 22+ / JSDOM)
class MockStorage implements Storage {
    private store: Record<string, string> = {};
    get length(): number {
        return Object.keys(this.store).length;
    }
    clear(): void {
        this.store = {};
    }
    getItem(key: string): string | null {
        return Object.prototype.hasOwnProperty.call(this.store, key) ? this.store[key] : null;
    }
    key(index: number): string | null {
        const keys = Object.keys(this.store);
        return keys[index] ?? null;
    }
    removeItem(key: string): void {
        delete this.store[key];
    }
    setItem(key: string, value: string): void {
        this.store[key] = String(value);
    }
}

const mockLocalStorage = new MockStorage();
const mockSessionStorage = new MockStorage();

try {
    delete (globalThis as any).localStorage;
    delete (globalThis as any).sessionStorage;
} catch {
    // ignore
}

if (typeof window !== 'undefined') {
    Object.defineProperty(window, 'localStorage', { value: mockLocalStorage, writable: true, configurable: true });
    Object.defineProperty(window, 'sessionStorage', { value: mockSessionStorage, writable: true, configurable: true });
}
Object.defineProperty(globalThis, 'localStorage', { value: mockLocalStorage, writable: true, configurable: true });
Object.defineProperty(globalThis, 'sessionStorage', { value: mockSessionStorage, writable: true, configurable: true });

// Global mocks for Firebase SDK in testing environment
vi.mock('firebase/app', () => ({
    initializeApp: vi.fn(() => ({})),
}));

vi.mock('firebase/auth', () => ({
    getAuth: vi.fn(() => ({})),
    onAuthStateChanged: vi.fn(),
    signInWithPopup: vi.fn(),
    GoogleAuthProvider: vi.fn(),
    signOut: vi.fn(),
    updateProfile: vi.fn(),
}));

vi.mock('firebase/storage', () => ({
    getStorage: vi.fn(() => ({})),
    ref: vi.fn(),
    uploadBytes: vi.fn(),
    getDownloadURL: vi.fn(),
    uploadBytesResumable: vi.fn(),
    deleteObject: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
    getFirestore: vi.fn(() => ({})),
    collection: vi.fn(),
    doc: vi.fn(),
    getDoc: vi.fn(),
    getDocs: vi.fn(),
    setDoc: vi.fn(),
    updateDoc: vi.fn(),
    deleteDoc: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
    orderBy: vi.fn(),
    limit: vi.fn(),
    onSnapshot: vi.fn(),
}));

// Cleanup after each test case
afterEach(() => {
    cleanup();
}); 